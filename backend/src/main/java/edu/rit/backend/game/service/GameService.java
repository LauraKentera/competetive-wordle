package edu.rit.backend.game.service;

import edu.rit.backend.chat.service.ChatService;
import edu.rit.backend.game.client.WordApiClient;
import edu.rit.backend.game.client.WordValidatorClient;
import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.game.dto.GuessDto;
import edu.rit.backend.game.dto.GuessResult;
import edu.rit.backend.game.logic.WordleFeedback;
import edu.rit.backend.game.model.Game;
import edu.rit.backend.game.model.GameStatus;
import edu.rit.backend.game.model.Guess;
import edu.rit.backend.game.repo.GameRepository;
import edu.rit.backend.game.repo.GuessRepository;
import edu.rit.backend.lobby.dto.LobbyPlayerDto;
import edu.rit.backend.user.model.UserStatus;
import edu.rit.backend.user.repo.UserRepository;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GuessRepository guessRepository;
    private final WordApiClient wordApiClient;
    private final WordValidatorClient wordValidatorClient;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    public GameService(GameRepository gameRepository, GuessRepository guessRepository,
            WordApiClient wordApiClient, WordValidatorClient wordValidatorClient,
            ChatService chatService, SimpMessagingTemplate messagingTemplate,
            UserRepository userRepository) {
        this.gameRepository = gameRepository;
        this.guessRepository = guessRepository;
        this.wordApiClient = wordApiClient;
        this.wordValidatorClient = wordValidatorClient;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    @Transactional
    public GameDto createGame(Long playerOneId) {
        Game game = new Game(playerOneId, GameStatus.WAITING_FOR_PLAYER);
        game.setCreatedAt(java.time.LocalDateTime.now());
        game = gameRepository.save(game);
        return toDto(game);
    }

    @Transactional
    public GameDto createChallenge(Long challengerId, Long invitedPlayerId) {
        if (challengerId.equals(invitedPlayerId)) {
            throw new IllegalArgumentException("Cannot challenge yourself");
        }
        Game game = new Game(challengerId, GameStatus.WAITING_FOR_PLAYER);
        game.setCreatedAt(java.time.LocalDateTime.now());
        game.setInvitedPlayerId(invitedPlayerId);
        game = gameRepository.save(game);
        return toDto(game);
    }

    private void setPlayersInGame(Long playerOneId, Long playerTwoId) {
        userRepository.findById(playerOneId).ifPresent(u -> {
            u.setStatus(UserStatus.IN_GAME);
            userRepository.save(u);
        });
        userRepository.findById(playerTwoId).ifPresent(u -> {
            u.setStatus(UserStatus.IN_GAME);
            userRepository.save(u);
        });
        broadcastOnlinePlayers();
    }

    private void setPlayersOnline(Long playerOneId, Long playerTwoId) {
        userRepository.findById(playerOneId).ifPresent(u -> {
            if (u.getStatus() == UserStatus.IN_GAME) {
                u.setStatus(UserStatus.ONLINE);
                userRepository.save(u);
            }
        });
        userRepository.findById(playerTwoId).ifPresent(u -> {
            if (u.getStatus() == UserStatus.IN_GAME) {
                u.setStatus(UserStatus.ONLINE);
                userRepository.save(u);
            }
        });
        broadcastOnlinePlayers();
    }

    private void broadcastOnlinePlayers() {
        List<LobbyPlayerDto> players = userRepository
                .findByStatusIn(List.of(UserStatus.ONLINE, UserStatus.IN_GAME))
                .stream()
                .map(u -> new LobbyPlayerDto(u.getId(), u.getUsername(), u.getStatus()))
                .toList();
        messagingTemplate.convertAndSend("/topic/lobby/players", players);
    }

    @Transactional
    public GameDto acceptGame(Long gameId, Long playerTwoId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        if (game.getStatus() != GameStatus.WAITING_FOR_PLAYER) {
            throw new IllegalStateException("Game is not waiting for a second player");
        }
        if (game.getPlayerOneId().equals(playerTwoId)) {
            throw new IllegalArgumentException("Player two cannot be the same as player one");
        }
        if (game.getInvitedPlayerId() != null && !game.getInvitedPlayerId().equals(playerTwoId)) {
            throw new IllegalArgumentException("Only the invited player can accept this challenge");
        }

        String secretWord = wordApiClient.fetchRandomWord();
        if (secretWord == null) {
            secretWord = "crane"; // fallback
        }
        int maxAttempts = Game.DEFAULT_MAX_ATTEMPTS;
        Long firstTurnPlayerId = ThreadLocalRandom.current().nextBoolean()
                ? game.getPlayerOneId()
                : playerTwoId;

        game.startGame(playerTwoId, secretWord, maxAttempts, firstTurnPlayerId);
        game = gameRepository.save(game);
        chatService.createRoomForGame(game.getId());
        setPlayersInGame(game.getPlayerOneId(), game.getPlayerTwoId());
        return toDto(game);
    }

    @Transactional(readOnly = true)
    public GameDto getGame(Long gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        return toDto(game);
    }

    @Transactional
    public GuessResult submitGuess(Long gameId, Long playerId, String guessWord) {
        if (guessWord == null || guessWord.isBlank()) {
            throw new IllegalArgumentException("Guess word is required");
        }
        guessWord = guessWord.toLowerCase().trim();

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        if (game.getStatus() != GameStatus.IN_PROGRESS) {
            throw new IllegalStateException("Game is not in progress");
        }
        if (!playerId.equals(game.getCurrentTurnPlayerId())) {
            throw new IllegalStateException("It is not your turn");
        }
        if (game.getWordLength() != null && guessWord.length() != game.getWordLength()) {
            throw new IllegalArgumentException("Guess must be " + game.getWordLength() + " letters");
        }
        if (!wordValidatorClient.isValidWord(guessWord)) {
            throw new IllegalArgumentException("\"" + guessWord.toUpperCase() + "\" is not a valid word");
        }

        long myGuessCount = guessRepository.findByGameIdOrderByAttemptNumberAsc(gameId).stream()
                .filter(g -> g.getPlayerId().equals(playerId))
                .count();
        if (myGuessCount >= game.getMaxAttempts()) {
            throw new IllegalStateException("No guesses remaining");
        }

        String secret = game.getWord();
        String result = WordleFeedback.compute(secret, guessWord);
        boolean correct = WordleFeedback.isCorrect(secret, guessWord);

        List<Guess> existing = guessRepository.findByGameIdOrderByAttemptNumberAsc(gameId);
        int attemptNumber = existing.size() + 1;

        Guess guess = new Guess(gameId, playerId, guessWord, result, attemptNumber);
        guessRepository.save(guess);

        if (correct) {
            game.setWinnerId(playerId);
            game.endGame(playerId);
            gameRepository.save(game);
            setPlayersOnline(game.getPlayerOneId(), game.getPlayerTwoId());
            return new GuessResult(result, true);
        }

        Long otherPlayerId = playerId.equals(game.getPlayerOneId()) ? game.getPlayerTwoId() : game.getPlayerOneId();
        game.setCurrentTurnPlayerId(otherPlayerId);
        long otherGuessCount = guessRepository.findByGameIdOrderByAttemptNumberAsc(gameId).stream()
                .filter(g -> g.getPlayerId().equals(otherPlayerId))
                .count();
        if (otherPlayerId != null && otherGuessCount >= game.getMaxAttempts()) {
            game.endGame(null);
            setPlayersOnline(game.getPlayerOneId(), game.getPlayerTwoId());
        }
        gameRepository.save(game);
        return new GuessResult(result, false);
    }

    @Transactional
    public GameDto declineGame(Long gameId, Long userId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        if (!Objects.equals(game.getInvitedPlayerId(), userId)) {
            throw new IllegalStateException("You cannot decline a challenge not sent to you.");
        }

        game.setStatus(GameStatus.DECLINED);
        game.setEndedAt(LocalDateTime.now());
        gameRepository.save(game);

        GameDto dto = toDto(game);
        userRepository.findById(game.getPlayerOneId()).ifPresent(challenger -> {
            messagingTemplate.convertAndSendToUser(
                    challenger.getUsername(),
                    "queue/challenges",
                    dto);
        });

        return dto;
    }

    private GameDto toDto(Game game) {
        List<GuessDto> guesses = guessRepository.findByGameIdOrderByAttemptNumberAsc(game.getId()).stream()
                .map(g -> new GuessDto(g.getPlayerId(), g.getGuessWord(), g.getResult(), g.getAttemptNumber()))
                .toList();
        String answer = game.getStatus() == GameStatus.COMPLETED ? game.getWord() : null;
        return new GameDto(
                game.getId(),
                game.getStatus().name(),
                game.getPlayerOneId(),
                game.getPlayerTwoId(),
                game.getCurrentTurnPlayerId(),
                game.getWordLength(),
                game.getMaxAttempts(),
                game.getWinnerId(),
                guesses,
                answer);
    }

    @Transactional
    public GameDto forfeitGame(Long gameId, Long playerId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        if (game.getStatus() != GameStatus.IN_PROGRESS) {
            throw new IllegalStateException("Can only forfeit a game that is in progress");
        }
        if (!playerId.equals(game.getPlayerOneId()) && !playerId.equals(game.getPlayerTwoId())) {
            throw new IllegalArgumentException("You are not a player in this game");
        }
        Long winnerId = playerId.equals(game.getPlayerOneId()) ? game.getPlayerTwoId() : game.getPlayerOneId();
        game.endGame(winnerId);
        gameRepository.save(game);
        setPlayersOnline(game.getPlayerOneId(), game.getPlayerTwoId());
        return toDto(game);
    }

    @Transactional
    public void abandonActiveGames(Long userId) {
        List<Game> activeGames = gameRepository.findActiveGamesForPlayer(userId, GameStatus.IN_PROGRESS);
        for (Game game : activeGames) {
            if (game.getStartedAt() != null &&
                    game.getStartedAt().isAfter(LocalDateTime.now().minusSeconds(15))) {
                continue;
            }
            Long winnerId = userId.equals(game.getPlayerOneId()) ? game.getPlayerTwoId() : game.getPlayerOneId();
            game.endGame(winnerId);
            gameRepository.save(game);
            GameDto dto = toDto(game);
            messagingTemplate.convertAndSend("/topic/game/" + game.getId(), dto);
            setPlayersOnline(game.getPlayerOneId(), game.getPlayerTwoId());
        }
    }

}
