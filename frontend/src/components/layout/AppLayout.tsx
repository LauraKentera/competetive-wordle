import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

const AppLayout: React.FC = () => (
  <div className="app-shell">
    <NavBar />
    <main className="app-main">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
