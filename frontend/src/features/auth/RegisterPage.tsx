import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { isApiError } from "../../api/httpClient";
import { useAuth } from "../../auth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import ErrorBanner from "../../components/ui/ErrorBanner";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const registrationToken = await authApi.getRegistrationToken();
      await register({ username, password, registrationToken: registrationToken.token });
      navigate("/login", { state: { message: "Registration successful. You can now log in." } });
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-register">
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
        <h2 className="auth-page-title">Register</h2>
        <p className="auth-subtitle">Create an account and start playing now!</p>

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
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </form>

        <Link to="/login" className="auth-link">
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
