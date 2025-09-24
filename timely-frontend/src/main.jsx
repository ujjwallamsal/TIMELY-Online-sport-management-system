import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled promise rejection:', event.reason);
  }
  // In production, you might want to log this to an error service
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
