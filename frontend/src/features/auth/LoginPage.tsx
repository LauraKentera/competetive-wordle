import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ErrorBanner from "../../components/ui/ErrorBanner";
import { isApiError } from "../../api/httpClient";

const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successMessage = (location.state as { message?: string } | null)?.message ?? null;

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await login({ username, password });
      navigate("/lobby");
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "48px auto", display: "grid", gap: "var(--spacing-md)" }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Login</h1>

      {successMessage && (
        <div
          style={{
            background: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            fontSize: 14,
          }}
        >
          {successMessage}
        </div>
      )}
      {errorMessage && <ErrorBanner message={errorMessage} />}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--spacing-sm)" }}>
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <Link to="/register">Need an account? Register</Link>
    </div>
  );
};

export default LoginPage;
