package edu.rit.backend.common.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller used to verify that JWT authentication is working correctly.
 * Returns a simple success message for any authenticated request.
 */
@RestController
public class ProtectedTestController {

    /**
     * Returns a confirmation message for authenticated users.
     * GET /api/protected
     *
     * @return a map containing {@code {"message": "you are authenticated"}}
     */
    @GetMapping("/api/protected")
    public Map<String, String> protectedHello() {
        return Map.of("message", "you are authenticated");
    }
}