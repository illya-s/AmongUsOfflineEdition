import BaseLayout from "./layouts/BaseLayout.jsx";
import DesktopLayout from "./layouts/DesktopLayout.jsx";
import Admin from "./pages/Admin.jsx";
import AdminGame from "./pages/AdminGame.jsx";
import AdminMonitor from "./pages/AdminMonitor.jsx";
import Auth from "./pages/Auth.jsx";
import CompletedTasks from "./pages/CompletedTasks.jsx";
import Game from "./pages/Game.jsx";
import Ghost from "./pages/Ghost.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import Painter from "./pages/Painter.jsx";

export const routes = [
    {
        path: "/",
        element: <BaseLayout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: "ghost",
                element: <Ghost />,
            },
            {
                path: "game/:code",
                children: [
                    {
                        index: true,
                        element: <Game />,
                    },
                    {
                        path: "monitor",
                        element: <AdminMonitor />,
                    },
                ],
            },
        ],
    },
    {
        path: "/admin",
        element: <DesktopLayout />,
        children: [
            {
                index: true,
                element: <Admin />,
            },
            {
                path: "game/:code",
                children: [
                    {
                        index: true,
                        element: <AdminGame />,
                    },
                    {
                        path: "map",
                        element: <Painter />,
                    },
                    {
                        path: "tasks",
                        element: <CompletedTasks />,
                    },
                ],
            },
        ],
    },
    {
        path: "/auth",
        element: <BaseLayout />,
        children: [
            {
                index: true,
                element: <Auth />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
];
