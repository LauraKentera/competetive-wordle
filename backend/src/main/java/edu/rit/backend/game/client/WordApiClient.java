package edu.rit.backend.game.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Fetches a random 5-letter word from an external API so both players
 * in the same game session get the same word (chosen once when the game starts).
 */
@Component
public class WordApiClient {

    private static final int WORD_LENGTH = 5;
    private static final int CONNECT_TIMEOUT_MS = 3_000;
    private static final int READ_TIMEOUT_MS = 5_000;

    private final RestTemplate restTemplate;
    private final String wordApiUrl;

    public WordApiClient(
            RestTemplateBuilder builder,
            @Value("${app.word-api.url:https://random-word-api.herokuapp.com/word?length=5}") String wordApiUrl) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofMillis(CONNECT_TIMEOUT_MS))
                .setReadTimeout(Duration.ofMillis(READ_TIMEOUT_MS))
                .build();
        this.wordApiUrl = wordApiUrl;
    }

    /**
     * Returns a random 5-letter word from the configured API.
     * Used when starting a game so both players share the same secret word.
     *
     * @return lowercase 5-letter word, or null if the API call fails
     */
    public String fetchRandomWord() {
        try {
            ResponseEntity<String[]> response = restTemplate.getForEntity(wordApiUrl, String[].class);
            if (response.getBody() != null && response.getBody().length > 0) {
                String word = response.getBody()[0];
                if (word != null) {
                    word = word.toLowerCase().trim();
                    if (word.length() == WORD_LENGTH && word.matches("[a-z]+")) {
                        return word;
                    }
                }
            }
        } catch (Exception e) {
            // Log and fall through to fallback
        }
        return getFallbackWord();
    }

    /**
     * Fallback when the external API is unavailable (e.g. rate limit or network).
     * Uses a small fixed set so we never fail to start a game.
     */
    private static String getFallbackWord() {
        List<String> fallbacks = List.of("apple", "bread", "crane", "draft", "earth", "flame", "grape", "horse", "ideal", "jelly");
        return fallbacks.get(ThreadLocalRandom.current().nextInt(fallbacks.size()));
    }
}
