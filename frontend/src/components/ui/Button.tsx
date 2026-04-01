import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button: React.FC<Props> = ({ children, ...props }) => (
  <button style={{
    padding: "8px 16px",
    background: "var(--color-primary)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    fontSize: 14,
    cursor: "pointer",
    opacity: props.disabled ? 0.6 : 1,
  }} {...props}>
    {children}
  </button>
);

export default Button;