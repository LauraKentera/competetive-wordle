package edu.rit.backend.user.dto;

import edu.rit.backend.user.model.Role;

public record UserResponse(Long id, String username, Role role) {}