import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import * as tokenStorage from "./tokenStorage";

const ProtectedRoute: React.FC = () => {
  if (tokenStorage.getToken() === null) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
