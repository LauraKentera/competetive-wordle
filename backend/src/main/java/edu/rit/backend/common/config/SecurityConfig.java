package edu.rit.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // We'll keep CSRF disabled for a REST API (especially while building)
                .csrf(csrf -> csrf.disable())

                // Enable CORS (so your CorsConfig is used)
                .cors(Customizer.withDefaults())

                // For now, allow health endpoint without auth
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health").permitAll()
                        .anyRequest().authenticated()
                )

                // Disable default login forms / basic prompts if you want:
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}