import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), svgr(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '/api'),
            },
            '/ws': {
                target: 'ws://localhost',
                ws: true,
                changeOrigin: true,
            },
            '/static': {
                target: 'http://localhost',
                changeOrigin: true,
            },
            '/media': {
                target: 'http://localhost',
                changeOrigin: true,
            },
        },
    },
});
