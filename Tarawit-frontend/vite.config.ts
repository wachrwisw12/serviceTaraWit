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
          "favicon.png",
          "apple-touch-icon.png",
          "robots.txt",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/icon-512-maskable.png",
        ],

        manifest: {
          id: "/",
          name: "ระบบบริหารจัดการโรงเรียน",
          short_name: "TARAWIT",
          description:
            "ระบบบริหารจัดการโรงเรียนท่าแร่วิทยา — ลงเวลาปฏิบัติงาน ประเมินบุคลากร ข้อมูลบุคลากร และตั้งค่าระบบ",

          lang: "th",
          dir: "ltr",

          start_url: "/",

          display: "standalone",
          orientation: "portrait",

          background_color: "#ffffff",
          theme_color: "#1f3e57",

          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icons/icon-512-maskable.png",
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
          importScripts: ["sw-force-refresh-v1.js"],

          // โลโก้จริงมีขนาด ~2.1 MB เกินค่า default 2 MiB ต้องขยาย limit ให้ precache ได้
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,

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

      rollupOptions: {
        output: {
          manualChunks(id) {
            // Heavy charting library (only used by pptx-preview)
            if (id.includes("node_modules/echarts")) {
              return "vendor-echarts";
            }
            // Shared zip library (used by docx-preview & pptx-preview)
            if (id.includes("node_modules/jszip")) {
              return "vendor-jszip";
            }
            // React + MUI ecosystem (tightly coupled, avoid circular chunks)
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/@mui") ||
              id.includes("node_modules/react-router") ||
              id.includes("node_modules/@emotion")
            ) {
              return "vendor-react";
            }
            // Other large vendor libraries
            if (id.includes("node_modules/lodash")) {
              return "vendor-lodash";
            }
            if (id.includes("node_modules/leaflet")) {
              return "vendor-leaflet";
            }
          },
        },
      },
    },
  };
});
