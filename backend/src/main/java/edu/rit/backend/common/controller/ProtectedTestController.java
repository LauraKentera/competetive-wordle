package edu.rit.backend.common.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProtectedTestController {

    @GetMapping("/api/protected")
    public Map<String, String> protectedHello() {
        return Map.of("message", "you are authenticated");
    }
}