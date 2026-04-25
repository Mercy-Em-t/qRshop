import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import LoadingSpinner from "./LoadingSpinner";
import { useState, useEffect, useMemo } from "react";

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

  const isDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true' || localStorage.getItem('tms_debug') === 'true';
  }, []);

  if (loading) {
    return (
      <LoadingSpinner 
        showLogo={true} 
        message={isDebug ? "Validating Secure Session..." : "Securing Connection..."} 
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
