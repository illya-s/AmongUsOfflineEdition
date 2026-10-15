import BaseLayout from "./layouts/BaseLayout.jsx";
import DesktopLayout from "./layouts/DesktopLayout.jsx";
import Admin from "./pages/admin/Admin.jsx";
import AdminGame from "./pages/admin/Game.jsx";
import AdminMonitor from "./pages/admin/Monitor.jsx";
import CompletedTasks from "./pages/admin/Tasks.jsx";
import Game from "./pages/game/Game.jsx";
import Ghost from "./pages/game/Ghost.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import Painter from "./pages/admin/Painter.jsx";

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
          {
            path: "monitor",
            element: <AdminMonitor />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
