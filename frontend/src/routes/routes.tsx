import React from "react";
import { Routes, Route } from "react-router-dom";

const routes = (
  <Routes>
    <Route path="/login" element={<div>Login</div>} />
    <Route path="/register" element={<div>Register</div>} />
    <Route path="/lobby" element={<div>Lobby</div>} />
    <Route path="/games/:gameId" element={<div>Game</div>} />
  </Routes>
);

export default routes;