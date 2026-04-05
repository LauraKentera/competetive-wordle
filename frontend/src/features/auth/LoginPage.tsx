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
    <div className="auth-page">
      <div className="auth-card auth-card-login">
        <h1 className="auth-brand-title">
          Competitive{" "}
          <span className="wordle-title">
            <span className="wordle-w">W</span>
            <span className="wordle-o">O</span>
            <span className="wordle-r">R</span>
            <span className="wordle-d">D</span>
            <span className="wordle-l">L</span>
            <span className="wordle-e">E</span>
          </span>
        </h1>
        <h2 className="auth-page-title">Login</h2>
        <p className="auth-subtitle">Welcome back! Log in to continue playing.</p>

        {successMessage && <div className="auth-info-banner">{successMessage}</div>}
        {errorMessage && <ErrorBanner message={errorMessage} />}

        <form onSubmit={handleSubmit} className="auth-form">
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
          <Button type="submit" disabled={isLoading} className="auth-submit-button">
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <Link to="/register" className="auth-link">
          Need an account? Register
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
