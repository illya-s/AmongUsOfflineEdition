import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, lazyPlugins } from "vite-plus";

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
		fmt: {
			indentWidth: 4,
			useTabs: true,
		},
		lint: {
			jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
			rules: { "vite-plus/prefer-vite-plus-imports": "error" },
			options: { typeAware: true, typeCheck: true },
		},
		test: {
			// Vitest v4 compatibility: preserve mock call history.
			// Remove after tests no longer rely on calls from setup or earlier tests.
			// https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
			// https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
			clearMocks: false,
		},
		plugins: lazyPlugins(() => [react(), svgr(), tailwindcss()]),
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
