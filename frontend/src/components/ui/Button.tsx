import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "amber";
}

const Button: React.FC<Props> = ({ variant = "primary", className = "", children, ...props }) => (
  <button className={`btn btn-${variant} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
