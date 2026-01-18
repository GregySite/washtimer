import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/legacy-fallback.css";

// Polyfill for older browsers
if (!Element.prototype.matches) {
  Element.prototype.matches = 
    (Element.prototype as any).webkitMatchesSelector ||
    (Element.prototype as any).msMatchesSelector;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
