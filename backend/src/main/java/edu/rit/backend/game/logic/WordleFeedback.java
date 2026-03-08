package edu.rit.backend.game.logic;

/**
 * Computes Wordle-style feedback: G (green = correct place), Y (yellow = in word, wrong place), X (gray = not in word).
 */
public final class WordleFeedback {

    private static final char GREEN = 'G';
    private static final char YELLOW = 'Y';
    private static final char GRAY = 'X';

    private WordleFeedback() {
    }

    /**
     * Returns a string of length wordLength where each char is G, Y, or X.
     *
     * @param secret lowercase secret word
     * @param guess  lowercase guess (must be same length as secret)
     * @return e.g. "GGYXX"
     */
    public static String compute(String secret, String guess) {
        if (secret == null || guess == null || secret.length() != guess.length()) {
            throw new IllegalArgumentException("Secret and guess must be same length");
        }
        int len = secret.length();
        char[] result = new char[len];
        int[] secretCounts = new int[26];

        for (int i = 0; i < len; i++) {
            secretCounts[secret.charAt(i) - 'a']++;
        }

        for (int i = 0; i < len; i++) {
            if (secret.charAt(i) == guess.charAt(i)) {
                result[i] = GREEN;
                secretCounts[secret.charAt(i) - 'a']--;
            }
        }

        for (int i = 0; i < len; i++) {
            if (result[i] == GREEN) continue;
            char c = guess.charAt(i);
            int idx = c - 'a';
            if (secretCounts[idx] > 0) {
                result[i] = YELLOW;
                secretCounts[idx]--;
            } else {
                result[i] = GRAY;
            }
        }

        return new String(result);
    }

    /**
     * Returns true if the guess exactly matches the secret (all green).
     */
    public static boolean isCorrect(String secret, String guess) {
        return secret != null && secret.equals(guess);
    }
}
