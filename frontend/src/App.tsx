import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth";
import routes from "./routes/routes";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {routes}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;