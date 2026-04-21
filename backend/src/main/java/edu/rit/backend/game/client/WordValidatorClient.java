package edu.rit.backend.game.client;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Component
public class WordValidatorClient {

    private static final String DICT_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    private static final int CONNECT_TIMEOUT_MS = 2_000;
    private static final int READ_TIMEOUT_MS = 3_000;

    private final RestTemplate restTemplate;

    public WordValidatorClient(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofMillis(CONNECT_TIMEOUT_MS))
                .setReadTimeout(Duration.ofMillis(READ_TIMEOUT_MS))
                .build();
    }

    /**
     * Returns true if the word exists in the dictionary, false if not found.
     * Fails open (returns true) if the API is unreachable, so a network hiccup
     * never blocks a player from submitting a guess.
     */
    public boolean isValidWord(String word) {
        try {
            restTemplate.getForEntity(DICT_API_URL + word.toLowerCase(), Object.class);
            return true;
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                return false;
            }
            return true;
        } catch (Exception ex) {
            return true;
        }
    }
}
