import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { isApiError } from "../../api/httpClient";
import { useAuth } from "../../auth";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const regToken = await authApi.getRegistrationToken();
      await register({ username, password, registrationToken: regToken.token });
      navigate("/login", { state: { message: "Registration successful. Sign in to play." } });
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Registration failed");
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

        <div className="auth-heading">create account</div>

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
            {isLoading ? "registering..." : "register →"}
          </button>
        </form>

        <Link to="/login" className="auth-link">
          already have an account? sign in
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
