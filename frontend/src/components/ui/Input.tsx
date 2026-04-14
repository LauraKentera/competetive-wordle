import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<Props> = ({ className = "", ...props }) => (
  <input className={`input ${className}`} {...props} />
);

export default Input;
