import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Support for iOS 9.3.5 (Safari 9) and other legacy browsers
    legacy({
      targets: ["iOS >= 9", "Safari >= 9", "Chrome >= 49", "Firefox >= 52"],
      additionalLegacyPolyfills: [
        "regenerator-runtime/runtime",
        "core-js/stable",
      ],
      modernPolyfills: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2015",
    cssTarget: "safari9",
  },
}));
