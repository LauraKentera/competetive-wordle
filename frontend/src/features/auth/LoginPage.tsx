import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { isApiError } from "../../api/httpClient";

const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successMessage = (location.state as { message?: string } | null)?.message ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login({ username, password });
      navigate("/lobby");
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Login failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card fade-in">
        <div className="auth-wordmark">
          <span className="auth-wordmark-label">competitive</span>
          <span className="auth-wordmark-title">
            <span className="letter-correct">W</span>
            <span className="letter-present">O</span>
            <span className="letter-absent">R</span>
            <span className="letter-correct">D</span>
            <span className="letter-present">L</span>
            <span className="letter-absent">E</span>
          </span>
        </div>

        <div className="auth-heading">sign in</div>

        {successMessage && <div className="banner-info">{successMessage}</div>}
        {errorMessage && <div className="banner-error">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="input"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <input
            className="input"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ marginTop: 4 }}>
            {isLoading ? "signing in..." : "sign in →"}
          </button>
        </form>

        <Link to="/register" className="auth-link">
          no account? register here
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
