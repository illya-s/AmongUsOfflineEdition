import DesktopLayout from "./layouts/DesktopLayout.jsx";
import Admin from "./pages/Admin.jsx";
import AdminGame from "./pages/AdminGame.jsx";
import Auth from "./pages/Auth.jsx";
import CompletedTasks from "./pages/CompletedTasks.jsx";
import Game from "./pages/Game.jsx";
import Ghost from "./pages/Ghost.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import Painter from "./pages/Painter.jsx";

const Layout = DesktopLayout;

export const routes = [
    {
        path: "/",
        element: <Layout />,
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
                ],
            },
            {
                path: "/admin",
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
        ],
    },
];
