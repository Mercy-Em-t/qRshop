import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
// Force Trigger: ShopQR Classic Restoration Sync v2
import App from "./App.jsx";
import ReloadPrompt from "./components/ReloadPrompt";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <ReloadPrompt />
    </BrowserRouter>
  </StrictMode>
);
