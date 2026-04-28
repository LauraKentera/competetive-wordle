package edu.rit.backend.auth.controller;

import edu.rit.backend.auth.dto.AuthResponse;
import edu.rit.backend.auth.dto.LoginRequest;
import edu.rit.backend.auth.dto.RegisterRequest;
import edu.rit.backend.auth.dto.RegistrationTokenResponse;
import edu.rit.backend.auth.service.AuthService;
import edu.rit.backend.auth.service.RegistrationTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final RegistrationTokenService registrationTokenService;

    public AuthController(AuthService auth, RegistrationTokenService registrationTokenService) {
        this.auth = auth;
        this.registrationTokenService = registrationTokenService;
    }

    @GetMapping("/registration-token")
    public RegistrationTokenResponse getRegistrationToken(HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        return registrationTokenService.createToken(clientIp, userAgent);
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        return auth.register(req.username(), req.password(), req.registrationToken(), clientIp, userAgent);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req.username(), req.password());
    }
}