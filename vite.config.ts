import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    legacy({
      // On cible spécifiquement les très vieux navigateurs
      targets: ["ios >= 9", "safari >= 9"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
      renderLegacyChunks: true,
      polyfills: [
        'es.symbol',
        'es.array.filter',
        'es.promise',
        'es.object.assign',
        'es.map',
        'es.set',
        'es.array.for-each',
        'es.object.keys'
      ]
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es5", // On force la sortie en vieux JavaScript
    cssTarget: "chrome61", // Pour éviter les soucis de CSS modernes
  }
});