import React from "react";

interface Props {
  message: string;
}

const ErrorBanner: React.FC<Props> = ({ message }) => (
  <div style={{
    background: "var(--color-error-bg)",
    color: "var(--color-error)",
    border: "1px solid var(--color-error)",
    borderRadius: "var(--radius)",
    padding: "var(--spacing-sm) var(--spacing-md)",
    fontSize: 14,
  }}>
    {message}
  </div>
);

export default ErrorBanner;