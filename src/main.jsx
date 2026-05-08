import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
// Force Trigger: ShopQR Classic Restoration Sync v2
import App from "./App.jsx";
import ReloadPrompt from "./components/ReloadPrompt";

// Robust dynamic import / chunk loading failure auto-reload with loop prevention
function handleChunkLoadError(reason) {
  console.warn(`Asset or chunk loading failure detected (${reason}). Coordinating auto-reload...`);
  try {
    const now = Date.now();
    const lastReload = parseInt(sessionStorage.getItem('tms_chunk_reload_time') || '0', 10);
    const reloadCount = parseInt(sessionStorage.getItem('tms_chunk_reload_count') || '0', 10);

    // If reload requested within 15 seconds of the last one, increment count
    if (now - lastReload < 15000) {
      if (reloadCount >= 3) {
        console.error('Auto-reload loop prevented. Stale cache or persistent network issue present.');
        return;
      }
      sessionStorage.setItem('tms_chunk_reload_count', (reloadCount + 1).toString());
    } else {
      sessionStorage.setItem('tms_chunk_reload_count', '1');
    }
    sessionStorage.setItem('tms_chunk_reload_time', now.toString());
    window.location.reload();
  } catch (e) {
    window.location.reload();
  }
}

// 1. Vite-specific preload error event
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  handleChunkLoadError('vite:preloadError');
});

// 2. Global script/module loading error catcher
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const isChunkError = 
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Expected a JavaScript-or-Wasm module script') ||
    (event.target && event.target.tagName === 'SCRIPT' && event.target.src && event.target.src.includes('/assets/'));
  
  if (isChunkError) {
    handleChunkLoadError('uncaught script/module error');
  }
}, true); // Listen in capture phase for script element failures

// 3. Unhandled promise rejection catcher (handles lazy loading promise rejections)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason) {
    const message = reason.message || String(reason);
    const isChunkError = 
      reason.name === 'ChunkLoadError' || 
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Expected a JavaScript-or-Wasm module script');
    
    if (isChunkError) {
      event.preventDefault();
      handleChunkLoadError('unhandled promise rejection');
    }
  }
});


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <ReloadPrompt />
    </BrowserRouter>
  </StrictMode>
);
