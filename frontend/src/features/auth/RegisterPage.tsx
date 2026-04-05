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
    <div style={{ maxWidth: 360, margin: "48px auto", display: "grid", gap: "var(--spacing-md)" }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Register</h1>

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
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>

      <Link to="/login">Already have an account? Login</Link>
    </div>
  );
};

export default RegisterPage;
