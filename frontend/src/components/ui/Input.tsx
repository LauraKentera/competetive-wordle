import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<Props> = (props) => (
  <input style={{
    padding: "8px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    width: "100%",
    color: "var(--color-text)",
    background: "var(--color-surface)",
  }} {...props} />
);

export default Input;