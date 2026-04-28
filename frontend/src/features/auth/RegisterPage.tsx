import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { isApiError } from "../../api/httpClient";
import { useAuth } from "../../auth";

/**
 * RegistrationPage component
 * 
 * Handles user account creation by collecting credentials and sending them
 * to the backend API. After successful registration, the user is redirected
 * to the login page with a success message.
 */
const RegisterPage: React.FC = () => {
  // Hook used for navigation after successful registration
  const navigate = useNavigate();
  // Custom authentication hook providing register function and loading state
  const { register, isLoading } = useAuth();
  // Local state for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Stores error messages to display to the user
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Handles form submission
   * 
   * Prevents default form behavior
   * Requests a registration token from the backend
   * Sends user credentials along with the token to register the account
   * Redirects to login page on success
   * Displays message if registration fails
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();// Prevent page reload
    setErrorMessage(null);// Reset previous error
    try {
      // Retrieve registration token (used for validation/security on backend)
      const regToken = await authApi.getRegistrationToken();
      // Register user with provided credentials and token
      await register({ username, password, registrationToken: regToken.token });
      // Redirect to login page with success message
      navigate("/login", { state: { message: "Registration successful. Sign in to play." } });
    } catch (err) {
      // Handle API errors or fallback message
      setErrorMessage(isApiError(err) ? err.message : "Registration failed");
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
        <div className="auth-heading">create account</div>

        {/* Conditional error message for failed registration */}
        {errorMessage && <div className="banner-error">{errorMessage}</div>}

        {/* Registration form */}
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
          {/* Submit button (disabled while request is in progress) */}
          <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ marginTop: 4 }}>
            {isLoading ? "registering..." : "register →"}
          </button>
        </form>

        {/* Navigation link to login page */}
        <Link to="/login" className="auth-link">
          already have an account? sign in
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
