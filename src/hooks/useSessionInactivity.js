import { useEffect, useRef, useCallback } from "react";
import { logout } from "../services/auth-service";

/**
 * Custom hook to log out the user after a period of inactivity.
 * @param {number} timeoutMinutes - Minutes of inactivity before logout.
 */
export function useSessionInactivity(timeoutMinutes = 30) {
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const timerRef = useRef(null);

  const handleLogout = useCallback(() => {
    console.log(`Session Inactivity: Logging out after ${timeoutMinutes} minutes.`);
    logout();
    window.location.href = "/login?reason=inactivity";
  }, [timeoutMinutes]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [handleLogout, timeoutMs]);

  useEffect(() => {
    // Only set up if we are actually in a session (can't easily check here, but events will only trigger if page is open)
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    const handleEvent = () => resetTimer();

    events.forEach((event) => window.addEventListener(event, handleEvent));
    
    // Initialize timer
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, handleEvent));
    };
  }, [resetTimer]);
}
