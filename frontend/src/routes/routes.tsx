import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../auth/ProtectedRoute";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import LobbyPage from "../features/lobby/LobbyPage";
import GamePage from "../features/game/GamePage";
import ProfilePage from "../features/profile/ProfilePage";

/**
 * Application route configuration
 *
 * Defines all available routes in the application with nested routing
 * and authentication protection layers.
 */
const routes = (
    <Routes>
        {/* Root path redirects to login - serves as entry point for unauthenticated users */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public authentication routes - accessible without login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected route wrapper - all child routes require authentication */}
        <Route element={<ProtectedRoute />}>
            {/* AppLayout wrapper - provides consistent UI structure (sidebar, header, etc.) */}
            <Route element={<AppLayout />}>
                {/* Main game lobby - shows available games, rooms, and players */}
                <Route path="/lobby" element={<LobbyPage />} />

                {/* Dynamic game route - :gameId parameter identifies specific game session */}
                <Route path="/games/:gameId" element={<GamePage />} />

                {/* User profile route - :userId parameter displays user-specific information */}
                <Route path="/profile/:userId" element={<ProfilePage />} />
            </Route>
        </Route>
    </Routes>
);

export default routes;