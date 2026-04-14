package edu.rit.backend.user.repo;

import edu.rit.backend.user.model.User;
import edu.rit.backend.user.model.UserStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findByStatus(UserStatus status);
    List<User> findByStatusIn(List<UserStatus> statuses);
}