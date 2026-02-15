import "./components/base/Base.css";

import { createCache, StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";

import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { MessageProvider } from "./providers/MessageProvider.jsx";
import { routes } from "./routes.jsx";

import { AuthProvider } from "./providers/AuthContext.jsx";
import { darkTheme } from "./Theme.jsx";

import { config } from "./config";

const router = createBrowserRouter(routes);
const cache = createCache({ hashPriority: "high" });

console.log("Environment Config:", config);

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

createRoot(document.getElementById("root")).render(<Root />);
