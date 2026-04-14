import React from "react";

interface Props { message: string; }

const ErrorBanner: React.FC<Props> = ({ message }) => (
  <div className="banner-error">{message}</div>
);

export default ErrorBanner;
