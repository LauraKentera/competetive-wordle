package edu.rit.backend.auth.controller;

import edu.rit.backend.auth.dto.AuthResponse;
import edu.rit.backend.auth.dto.LoginRequest;
import edu.rit.backend.auth.dto.RegisterRequest;
import edu.rit.backend.auth.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest req) {
        return auth.register(req.username(), req.password());
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest req) {
        return auth.login(req.username(), req.password());
    }
}