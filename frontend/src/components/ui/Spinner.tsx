import React from "react";

const Spinner: React.FC = () => (
  <div style={{
    width: 20,
    height: 20,
    border: "2px solid var(--color-border)",
    borderTop: "2px solid var(--color-primary)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Spinner;