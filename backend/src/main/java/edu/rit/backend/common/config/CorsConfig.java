package edu.rit.backend.common.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring MVC and Spring Security CORS configuration.
 * Reads allowed origins from the {@code app.cors.allowed-origins} property
 * and applies them to both the MVC layer and the Security filter chain.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final List<String> allowedOrigins;

    /**
     * Constructs a CorsConfig by parsing the comma-separated list of allowed origins.
     *
     * @param rawAllowedOrigins comma-separated string of allowed origin URLs,
     *                          defaults to {@code http://localhost:3000,http://localhost:5173}
     */
    public CorsConfig(@Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}") String rawAllowedOrigins) {
        this.allowedOrigins = Arrays.stream(rawAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }

    /**
     * Registers a {@link CorsConfigurationSource} bean used by Spring Security.
     * Ensures preflight (OPTIONS) requests receive correct CORS headers
     * even when rejected by authentication filters.
     *
     * @return a configured {@link CorsConfigurationSource} applied to all paths
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Registers CORS mappings at the Spring MVC layer for all endpoints.
     * Mirrors the configuration in {@link #corsConfigurationSource()} to ensure
     * consistent behavior across both the MVC and Security filter chains.
     *
     * @param registry the Spring MVC CORS registry
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
