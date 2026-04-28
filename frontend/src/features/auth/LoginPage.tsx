import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { isApiError } from "../../api/httpClient";

/**
 * LoginPage component
 * 
 * Responsible for handling user authentication with a login form.
 * Collets the user credentials, calls the authentication API, and upon successful login sends the players to the lobby.
 */
const LoginPage: React.FC = () => {
  // React Router hook to access navigation state (used for passing messages between pages)
  const location = useLocation();
  // Hook used to navigate to another route after login
  const navigate = useNavigate();
  // Custom authentication hook providing login function and loading state
  const { login, isLoading } = useAuth();
  // Local state for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Extracts optional success message from navigation state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successMessage = (location.state as { message?: string } | null)?.message ?? null;

  /**
   * Handles form submission
   * 
   * Prevents default form behavior, attempts login using provided credentials,
   * and navigates to the lobby page if successful.
   * If an error occurs, it displays an error message.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();// Prevent page reload
    setErrorMessage(null);// Reset previous error state
    try {
      // Attempt login via authentication API
      await login({ username, password });
      // Redirect user to lobby after successful login
      navigate("/lobby");
    } catch (err) {
      // Check if error is API-related and extract message, otherwise fallback
      setErrorMessage(isApiError(err) ? err.message : "Login failed");
    }
  };

  return (
  
    <div className="auth-shell">
      {/*Card container for the login UI. Applies visual styling such as padding, shadow, and entry animation.*/}
      <div className="auth-card fade-in">
        {/* Application branding / wordmark */}
        <div className="auth-wordmark">
          <span className="auth-wordmark-label">competitive</span>
          <span className="auth-wordmark-title">
            {/* Styled letters speelign otu WORDLE */}
            <span className="letter-correct">W</span>
            <span className="letter-present">O</span>
            <span className="letter-absent">R</span>
            <span className="letter-correct">D</span>
            <span className="letter-present">L</span>
            <span className="letter-absent">E</span>
          </span>
        </div>

        {/* Page heading */}
        <div className="auth-heading">sign in</div>

        {/* Conditional success message */}
        {successMessage && <div className="banner-info">{successMessage}</div>}
        {/* Conditional error message for failed login attempts */}
        {errorMessage && <div className="banner-error">{errorMessage}</div>}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username input */}
          <input
            className="input"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          {/* Password input */}
          <input
            className="input"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* Submit button (disabled while login is in progress) */}
          <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ marginTop: 4 }}>
            {isLoading ? "signing in..." : "sign in →"}
          </button>
        </form>

        {/* Navigation link to registration page */}
        <Link to="/register" className="auth-link">
          no account? register here
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
