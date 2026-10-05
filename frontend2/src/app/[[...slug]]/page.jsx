"use client";

import { createCache, StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider } from "antd";
import { usePathname } from "next/navigation";
import BaseLayout from "@/layouts/BaseLayout";
import DesktopLayout from "@/layouts/DesktopLayout";
import Admin from "@/screens/Admin";
import AdminGame from "@/screens/AdminGame";
import AdminMonitor from "@/screens/AdminMonitor";
import CompletedTasks from "@/screens/CompletedTasks";
import Game from "@/screens/Game";
import Ghost from "@/screens/Ghost";
import Home from "@/screens/Home";
import NotFound from "@/screens/NotFound";
import Painter from "@/screens/Painter";
import { MessageProvider } from "@/providers/MessageProvider";
import { darkTheme } from "@/Theme";
import { RouteProvider } from "@/lib/router";

const cache = createCache({ hashPriority: "high" });

function CurrentRoute() {
    const parts = usePathname().split("/").filter(Boolean);
    let page = <NotFound />;
    let Layout = BaseLayout;
    let params = {};

    if (parts.length === 0) page = <Home />;
    else if (parts[0] === "ghost" && parts.length === 1) page = <Ghost />;
    else if (parts[0] === "game" && parts[1]) {
        params = { code: parts[1] };
        page = parts[2] === "monitor" ? <AdminMonitor /> : parts.length === 2 ? <Game /> : <NotFound />;
    } else if (parts[0] === "admin") {
        Layout = DesktopLayout;
        if (parts.length === 1) page = <Admin />;
        else if (parts[1] === "game" && parts[2]) {
            params = { code: parts[2] };
            if (parts.length === 3) page = <AdminGame />;
            else if (parts[3] === "map") page = <Painter />;
            else if (parts[3] === "tasks") page = <CompletedTasks />;
        }
    }

    return <RouteProvider params={params} outlet={page}><Layout /></RouteProvider>;
}

export default function AppPage() {
    return (
        <StyleProvider cache={cache}>
            <ConfigProvider theme={darkTheme}>
                <MessageProvider><CurrentRoute /></MessageProvider>
            </ConfigProvider>
        </StyleProvider>
    );
}
