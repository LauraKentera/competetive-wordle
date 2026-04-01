import React from "react";

const NavBar: React.FC = () => (
  <nav style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 var(--spacing-lg)",
    height: 52,
    background: "var(--color-surface)",
    borderBottom: "1px solid var(--color-border)",
  }}>
    <span style={{ fontWeight: 600, fontSize: 16 }}>Competitive Wordle</span>
  </nav>
);

export default NavBar;