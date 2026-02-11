import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";
import { renderToString } from "react-dom/server";
import {
    createStaticHandler,
    createStaticRouter,
    StaticRouterProvider,
} from "react-router";
import { darkTheme } from "./Theme.jsx";
import { AuthProvider } from "./providers/AuthContext.jsx";
import { routes } from "./routes.jsx";

export async function render(req, _url) {
    const handler = createStaticHandler(routes, { location: _url });
    const request = new Request(`http://localhost:5173${String(_url)}`, {
        method: "GET",
        headers: new Headers(req.headers),
    });
    const context = await handler.query(request);
    const router = createStaticRouter(handler.dataRoutes, context);

    const cache = createCache({ hashPriority: "high" });
    const html = renderToString(
        <StyleProvider cache={cache}>
            <ConfigProvider theme={darkTheme}>
                <AuthProvider>
                    <StaticRouterProvider
                        router={router}
                        context={context}
                        nonce="the-nonce"
                    />
                </AuthProvider>
            </ConfigProvider>
        </StyleProvider>,
    );
    return { html, head: extractStyle(cache) };
}
