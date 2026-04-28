package edu.rit.backend.chat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.chat.model.ChatMessage;
import edu.rit.backend.chat.model.ChatRoom;
import edu.rit.backend.chat.model.ChatRoomType;
import edu.rit.backend.chat.repo.ChatMessageRepository;
import edu.rit.backend.chat.repo.ChatRoomRepository;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ChatService {

    private static final String CACHE_KEY_PREFIX = "chat:room:";
    private static final int CACHE_MAX_MESSAGES = 50;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public ChatService(ChatRoomRepository chatRoomRepository,
                       ChatMessageRepository chatMessageRepository,
                       UserRepository userRepository,
                       StringRedisTemplate redisTemplate,
                       ObjectMapper objectMapper) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ChatRoom createRoomForGame(Long gameId) {
        if (chatRoomRepository.findByTypeAndGameId(ChatRoomType.GAME, gameId).isPresent()) {
            throw new IllegalStateException("Chat room already exists for game " + gameId);
        }
        ChatRoom room = new ChatRoom(ChatRoomType.GAME, gameId);
        return chatRoomRepository.save(room);
    }

    @Transactional(readOnly = true)
    public Optional<ChatRoom> getRoomForGame(Long gameId) {
        return chatRoomRepository.findByTypeAndGameId(ChatRoomType.GAME, gameId);
    }

    /**
     * Gets or creates the single global lobby chat room (type LOBBY, gameId null).
     */
    @Transactional
    public ChatRoom getOrCreateLobbyRoom() {
        return chatRoomRepository.findByType(ChatRoomType.LOBBY)
                .orElseGet(() -> chatRoomRepository.save(new ChatRoom(ChatRoomType.LOBBY, null)));
    }

    /**
     * Send a message to the lobby chat room. Persists to DB and pushes to Redis cache.
     */
    @Transactional
    public ChatMessageDto sendLobbyMessage(Long userId, String username, String content) {
        ChatRoom room = getOrCreateLobbyRoom();
        return sendMessage(room.getId(), userId, username, content);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getRecentLobbyMessages(int limit) {
        ChatRoom room = chatRoomRepository.findByType(ChatRoomType.LOBBY).orElse(null);
        if (room == null) return List.of();
        return getRecentMessages(room.getId(), limit);
    }

    @Transactional
    public ChatMessageDto sendMessage(Long chatRoomId, Long userId, String username, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content is required");
        }
        Instant now = Instant.now();
        ChatMessage entity = new ChatMessage(chatRoomId, userId, content.trim(), now);
        entity = chatMessageRepository.save(entity);

        ChatMessageDto dto = new ChatMessageDto(username, content.trim(), now);
        pushToCache(chatRoomId, dto);
        return dto;
    }

    /**
     * Send a message to the game's chat room. Returns the DTO for broadcast.
     */
    @Transactional
    public ChatMessageDto sendGameMessage(Long gameId, Long userId, String username, String content) {
        ChatRoom room = getRoomForGame(gameId)
                .orElseThrow(() -> new IllegalArgumentException("No chat room for game " + gameId));
        return sendMessage(room.getId(), userId, username, content);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getRecentMessages(Long chatRoomId, int limit) {
        if (limit <= 0) limit = 50;
        if (limit > 100) limit = 100;

        List<ChatMessageDto> fromCache = getFromCache(chatRoomId, limit);
        if (!fromCache.isEmpty()) {
            return fromCache;
        }

        List<ChatMessage> entities = chatMessageRepository.findByChatRoomIdOrderBySentAtAsc(
                chatRoomId, PageRequest.of(0, limit));
        List<ChatMessageDto> result = new ArrayList<>();
        for (ChatMessage m : entities) {
            String username = userRepository.findById(m.getUserId())
                    .map(u -> u.getUsername())
                    .orElse("?");
            result.add(new ChatMessageDto(username, m.getMessage(), m.getSentAt()));
        }
        repopulateCache(chatRoomId, result);
        return result;
    }

    public List<ChatMessageDto> getRecentGameMessages(Long gameId, int limit) {
        ChatRoom room = getRoomForGame(gameId).orElse(null);
        if (room == null) return List.of();
        return getRecentMessages(room.getId(), limit);
    }

    private void pushToCache(Long roomId, ChatMessageDto dto) {
        try {
            String key = CACHE_KEY_PREFIX + roomId;
            String json = objectMapper.writeValueAsString(dto);
            redisTemplate.opsForList().rightPush(key, json);
            redisTemplate.opsForList().trim(key, -CACHE_MAX_MESSAGES, -1);
        } catch (JsonProcessingException e) {
            // skip cache
        } catch (Exception e) {
            // Redis unavailable – skip cache
        }
    }

    private List<ChatMessageDto> getFromCache(Long roomId, int limit) {
        try {
            String key = CACHE_KEY_PREFIX + roomId;
            List<String> range = redisTemplate.opsForList().range(key, -limit, -1);
            if (range == null || range.isEmpty()) return List.of();
            List<ChatMessageDto> result = new ArrayList<>();
            for (String json : range) {
                result.add(objectMapper.readValue(json, ChatMessageDto.class));
            }
            return result;
        } catch (Exception e) {
            return List.of();
        }
    }

    private void repopulateCache(Long roomId, List<ChatMessageDto> messages) {
        try {
            String key = CACHE_KEY_PREFIX + roomId;
            redisTemplate.delete(key);
            for (ChatMessageDto dto : messages) {
                String json = objectMapper.writeValueAsString(dto);
                redisTemplate.opsForList().rightPush(key, json);
            }
            redisTemplate.opsForList().trim(key, -CACHE_MAX_MESSAGES, -1);
        } catch (Exception e) {
            // skip
        }
    }
}
