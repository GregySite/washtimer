import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // C'est ce plugin qui va traduire le code moderne pour le vieil iPad
    legacy({
      targets: ['defaults', 'not IE 11', 'iOS >= 9'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Force la compilation CSS pour être plus compatible
  build: {
    target: "es2015",
    cssTarget: "chrome61", // Support CSS safe
  }
});