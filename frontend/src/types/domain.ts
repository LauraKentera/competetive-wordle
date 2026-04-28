/** User authorization roles used throughout the app. */
export enum Role {
  /** Regular authenticated player account. */
  USER = "USER",
  /** Elevated account with administrative capabilities. */
  ADMIN = "ADMIN",
}

/** Presence and activity state reported for a user. */
export enum UserStatus {
  /** User is currently connected and available. */
  ONLINE = "ONLINE",
  /** User is not currently connected. */
  OFFLINE = "OFFLINE",
  /** User is currently participating in a game. */
  IN_GAME = "IN_GAME",
}