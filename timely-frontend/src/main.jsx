import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./styles/tailwind.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./components/NotificationSystem.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <NotificationProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </NotificationProvider>
  </BrowserRouter>
);
