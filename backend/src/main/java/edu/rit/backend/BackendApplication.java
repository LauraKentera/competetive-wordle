package edu.rit.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Competitive Wordle Spring Boot application.
 *
 * <p>Bootstraps the entire Spring context, including JPA, Security, WebSocket,
 * and Redis configuration defined across the application's component packages.
 */
@SpringBootApplication
public class BackendApplication {

	/**
	 * Starts the application.
	 *
	 * @param args command-line arguments passed to the Spring context
	 */
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
