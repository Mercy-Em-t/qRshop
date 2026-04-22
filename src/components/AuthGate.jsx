import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import LoadingSpinner from "./LoadingSpinner";
import { useState, useEffect } from "react";

/**
 * Strict Authentication Gate.
 * Ensures the user is logged in before accessing protected routes.
 * Redirects to /login if no active session is found.
 */
export default function AuthGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("AuthGate Security Error:", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <LoadingSpinner 
        showLogo={false} 
        message="Validating Secure Session..." 
        fullPage={true} 
      />
    );
  }

  if (!user) {
    console.warn("AuthGate: Unauthenticated access attempt blocked. Redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  return children;
}
