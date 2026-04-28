import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import * as tokenStorage from "./tokenStorage";

/**
 * A route guard component that restricts access to authenticated users only.
 * If no token is found in storage, the user is redirected to the login page.
 * Otherwise, renders the matched child route via Outlet.
 *
 * Intended to be used as a wrapper in the router configuration around
 * routes that require authentication.
 */
const ProtectedRoute: React.FC = () => {
  if (tokenStorage.getToken() === null) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
