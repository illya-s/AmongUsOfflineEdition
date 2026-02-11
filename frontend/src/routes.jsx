// import MobileLayout from "./layouts/MobileLayout.jsx";
import { getGame } from "./components/requests/api_game.js";
import { getLocations } from "./components/requests/api_locations.js";
import { getGamePlayers } from "./components/requests/api_player.js";
import DesktopLayout from "./layouts/DesktopLayout.jsx";
import Admin from "./pages/Admin.jsx";
import AdminGame from "./pages/AdminGame.jsx";
import Auth from "./pages/Auth.jsx";
import CompletedTasks from "./pages/CompletedTasks.jsx";
import Game from "./pages/Game.jsx";

import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import Painter from "./pages/Painter.jsx";

// const Layout = isMobile ? MobileLayout : DesktopLayout;
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
                path: "game/:code",
                element: <Game />,
                loader: async ({ request, params }) => {
                    if (!params?.code) return null;

                    return {
                        initGame: await getGame(params.code),
                        initPlayers: await getGamePlayers(params.code),
                    };
                },
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
                                loader: async ({ params }) => {
                                    if (!params?.code) return null;

                                    return {
                                        initLocations:
                                            (await getLocations()) || [],
                                    };
                                },
                            },
                            {
                                path: "map",
                                element: <Painter />,
                                loader: async ({ params }) => {
                                    if (!params?.code) return null;

                                    return {
                                        initGame: await getGame(params.code),
                                        initLocations:
                                            (await getLocations()) || [],
                                    };
                                },
                            },
                            {
                                path: "tasks",
                                element: <CompletedTasks />,
                                loader: async ({ params }) => {
                                    if (!params?.code) return null;

                                    return {
                                        initLocations:
                                            (await getLocations()) || [],
                                    };
                                },
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
