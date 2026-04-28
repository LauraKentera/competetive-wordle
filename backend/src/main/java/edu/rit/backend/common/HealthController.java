package edu.rit.backend.common;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller that exposes a simple health check endpoint.
 * Used to verify that the application is running and reachable.
 */
@RestController
public class HealthController {

    /**
     * Returns the current health status of the application.
     * GET /api/health
     *
     * @return a map containing a single entry: {@code {"status": "ok"}}
     */
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}