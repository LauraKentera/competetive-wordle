package edu.rit.backend.auth.service;

import edu.rit.backend.auth.dto.AuthResponse;
import edu.rit.backend.auth.security.JwtService;
import edu.rit.backend.user.model.Role;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.repo.UserRepository;
import edu.rit.backend.user.service.UserService;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthService(UserService userService,
                       UserRepository userRepository,
                       PasswordEncoder encoder,
                       JwtService jwtService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(String username, String password) {
        String passwordHash = encoder.encode(password);
        User user = userService.createUser(username, passwordHash, Role.USER);

        String token = jwtService.generateAccessToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationSeconds(), user.getUsername(), user.getRole());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtService.generateAccessToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationSeconds(), user.getUsername(), user.getRole());
    }
}