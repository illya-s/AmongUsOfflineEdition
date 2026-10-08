import baseStyles from "./components/base/Base.module.css";
import themeStyles from "./Theme.module.css";

import { createCache, StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";

import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import { MessageProvider } from "./providers/MessageProvider.jsx";
import { routes } from "./routes.jsx";

import { darkTheme } from "./Theme.jsx";

import { config } from "./config";

const router = createBrowserRouter(routes);
const cache = createCache({ hashPriority: "high" });

console.log("Environment Config:", config);

function Root() {
    return (
        <StyleProvider cache={cache}>
            <ConfigProvider theme={darkTheme}>
                <MessageProvider>
                    <RouterProvider router={router} />
                </MessageProvider>
            </ConfigProvider>
        </StyleProvider>
    );
}

const rootElement = document.getElementById("root");
rootElement.className = `${baseStyles.root} ${themeStyles.themeScope}`;

createRoot(rootElement).render(<Root />);
