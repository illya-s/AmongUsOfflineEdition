import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost";
    const proxy = {
        "^/(user|games|players|locations|tasks|health|schema|docs)(/|$)": {
            target: proxyTarget,
            changeOrigin: true,
        },
        "^/game/[^/]+/(toggle|players|player|game-task)/": {
            target: proxyTarget,
            changeOrigin: true,
        },
        "/ws": {
            target: proxyTarget,
            ws: true,
            changeOrigin: true,
        },
        "/static": {
            target: proxyTarget,
            changeOrigin: true,
        },
        "/media": {
            target: proxyTarget,
            changeOrigin: true,
        },
    };

    return {
        plugins: [react(), svgr(), tailwindcss()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            host: "0.0.0.0",
            port: 5173,
            proxy,
        },
        preview: {
            host: "0.0.0.0",
            port: 5173,
            proxy,
        },
        build: {
            sourcemap: true,
        },
    };
});
