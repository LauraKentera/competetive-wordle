import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../auth/ProtectedRoute";
import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import LobbyPage from "../features/lobby/LobbyPage";
import GamePage from "../features/game/GamePage";
import ProfilePage from "../features/profile/ProfilePage";

const routes = (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/games/:gameId" element={<GamePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Route>
    </Route>
  </Routes>
);

export default routes;
