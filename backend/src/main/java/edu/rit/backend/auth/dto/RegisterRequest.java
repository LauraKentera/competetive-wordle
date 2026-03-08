package edu.rit.backend.auth.dto;

public record RegisterRequest(String username, String password, String registrationToken) {}