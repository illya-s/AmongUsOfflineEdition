import "./components/base/Base.css";

import { createCache, StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";

import { hydrateRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { MessageProvider } from "./providers/MessageProvider.jsx";
import { routes } from "./routes.jsx";

import { darkTheme } from "./Theme.jsx";
import { AuthProvider } from "./providers/AuthContext.jsx";

const router = createBrowserRouter(routes);
const cache = createCache({ hashPriority: "high" });

function Root() {
    return (
        <StyleProvider cache={cache}>
            <ConfigProvider theme={darkTheme}>
                <AuthProvider>
                    <MessageProvider>
                        <RouterProvider router={router} />
                    </MessageProvider>
                </AuthProvider>
            </ConfigProvider>
        </StyleProvider>
    );
}

hydrateRoot(document.getElementById("root"), <Root />);
