import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";

const routes = (
  <Routes>
    <Route path="/login" element={<div>Login</div>} />
    <Route path="/register" element={<div>Register</div>} />
    <Route element={<AppLayout />}>
      <Route path="/lobby" element={<div>Lobby</div>} />
      <Route path="/games/:gameId" element={<div>Game</div>} />
    </Route>
  </Routes>
);

export default routes;