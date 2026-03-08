package edu.rit.backend.game.service;

import edu.rit.backend.chat.service.ChatService;
import edu.rit.backend.game.client.WordApiClient;
import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.game.dto.GuessDto;
import edu.rit.backend.game.dto.GuessResult;
import edu.rit.backend.game.logic.WordleFeedback;
import edu.rit.backend.game.model.Game;
import edu.rit.backend.game.model.GameStatus;
import edu.rit.backend.game.model.Guess;
import edu.rit.backend.game.repo.GameRepository;
import edu.rit.backend.game.repo.GuessRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GuessRepository guessRepository;
    private final WordApiClient wordApiClient;
    private final ChatService chatService;

    public GameService(GameRepository gameRepository, GuessRepository guessRepository,
                       WordApiClient wordApiClient, ChatService chatService) {
        this.gameRepository = gameRepository;
        this.guessRepository = guessRepository;
        this.wordApiClient = wordApiClient;
        this.chatService = chatService;
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
            return new GuessResult(result, true);
        }

        Long otherPlayerId = playerId.equals(game.getPlayerOneId()) ? game.getPlayerTwoId() : game.getPlayerOneId();
        game.setCurrentTurnPlayerId(otherPlayerId);
        long otherGuessCount = guessRepository.findByGameIdOrderByAttemptNumberAsc(gameId).stream()
                .filter(g -> g.getPlayerId().equals(otherPlayerId))
                .count();
        if (otherPlayerId != null && otherGuessCount >= game.getMaxAttempts()) {
            game.endGame(null); // draw
        }
        gameRepository.save(game);
        return new GuessResult(result, false);
    }

    private GameDto toDto(Game game) {
        List<GuessDto> guesses = guessRepository.findByGameIdOrderByAttemptNumberAsc(game.getId()).stream()
                .map(g -> new GuessDto(g.getPlayerId(), g.getGuessWord(), g.getResult(), g.getAttemptNumber()))
                .toList();
        return new GameDto(
                game.getId(),
                game.getStatus().name(),
                game.getPlayerOneId(),
                game.getPlayerTwoId(),
                game.getCurrentTurnPlayerId(),
                game.getWordLength(),
                game.getMaxAttempts(),
                game.getWinnerId(),
                guesses
        );
    }
}
