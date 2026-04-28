package edu.rit.backend.chat.model;

// Enum defining the different types of chat rooms in the system
public enum ChatRoomType {

    // Chat room used for general communication in the lobby
    LOBBY,

    // Chat room associated with a specific game session
    GAME,

    // Chat room for direct (private) messages between users
    DIRECT
}