import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/",

    resolve: {
      alias: {
        "@": "/src",
      },
    },
    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",

        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "robots.txt",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/icon-512-maskable.png",
        ],

        manifest: {
          id: "/",
          name: "ระบบนิเทศน์ภายในสถานศึกษา",
          short_name: "THARAE INSPIRE",
          description:
            "ระบบนิเทศน์ภายในสถานศึกษา สำหรับโรงเรียนในสังกัด สพป.สน.1",

          lang: "th",
          dir: "ltr",

          start_url: "/",

          display: "standalone",
          orientation: "portrait",

          background_color: "#ffffff",
          theme_color: "#1976d2",

          icons: [
            {
              src: "/icons/icon-19-v2.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-51-v2.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icons/icon-51-v2.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },

        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,

          navigateFallback: "/index.html",

          globPatterns: [
            "**/*.{js,css,html,ico,png,jpg,jpeg,webp,avif,svg,woff2,json}",
          ],

          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "images",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === "font",
              handler: "CacheFirst",
              options: {
                cacheName: "fonts",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },

        devOptions: {
          enabled: mode === "development",
        },
      }),
    ],

    server: {
      host: "0.0.0.0",

      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://server:8000",
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: "../dist",

      emptyOutDir: true,

      sourcemap: false,

      assetsInlineLimit: 4096,
    },
  };
});
