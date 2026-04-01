import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

const AppLayout: React.FC = () => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <NavBar />
    <main style={{ flex: 1, padding: "var(--spacing-lg)" }}>
      <Outlet />
    </main>
  </div>
);

export default AppLayout;