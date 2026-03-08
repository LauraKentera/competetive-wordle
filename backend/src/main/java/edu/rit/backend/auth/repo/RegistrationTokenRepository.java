package edu.rit.backend.auth.repo;

import edu.rit.backend.auth.model.RegistrationToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationTokenRepository extends JpaRepository<RegistrationToken, Long> {

    Optional<RegistrationToken> findByToken(String token);
}
