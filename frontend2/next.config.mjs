const backendUrl = process.env.PROXY_TARGET || "http://localhost:8000";

const nextConfig = {
    output: "standalone",
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            resourceQuery: /react/,
            use: ["@svgr/webpack"],
        });
        return config;
    },
    async rewrites() {
        return {
            beforeFiles: [
                { source: "/ws/:path*", destination: `${backendUrl}/ws/:path*` },
                { source: "/media/:path*", destination: `${backendUrl}/media/:path*` },
                { source: "/static/:path*", destination: `${backendUrl}/static/:path*` },
                {
                    source: "/:api(user|games|players|locations|tasks|health|schema|docs)/:path*",
                    destination: `${backendUrl}/:api/:path*`,
                },
                {
                    source: "/game/:code/:action(toggle|players|player|game-task)/:path*",
                    destination: `${backendUrl}/game/:code/:action/:path*`,
                },
            ],
        };
    },
};

export default nextConfig;
