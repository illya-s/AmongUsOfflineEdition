import { useEffect, useRef, useState } from "react";
import { handleSocketMessage, initSocketHandlers } from "./sendWithAck";

export const useGameSocket = (code, pId = null, setPlayer = null, setLoading) => {
    const [gameSocket, setGameSocket] = useState(null);
    const [game, setGame] = useState(null);
    const [players, setPlayers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [locations, setLocations] = useState([]);
    const [availableTasks, setAvailableTasks] = useState([]);

    const reconnectAttempts = useRef(0);

    useEffect(() => {
        initSocketHandlers({
            pId,
            setPlayer,
            setGame,
            setTasks,
            setPlayers,
            setLocations,
            setAvailableTasks,
        });
    }, [pId, setPlayer, setGame, setTasks, setPlayers, setLocations, setAvailableTasks]);

    useEffect(() => {
        let ws;
        let timerId;
        let isMounted = true;

        const init = async () => {
            const token = localStorage.getItem("access_token");

            const connect = () => {
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                const host = window.location.host;
                ws = new WebSocket(
                    `${protocol}//${host}/ws/game/${code}/?access_token=${token}&pId=${pId}`,
                );

                ws.onopen = () => {
                    console.log("WS Connected");
                    reconnectAttempts.current = 0;
                    setGameSocket(ws);
                };

                ws.onclose = (e) => {
                    console.log("WS Disconnected");

                    if (e.code === 1000 || !isMounted) {
                        setLoading?.(null);
                        return;
                    }

                    if (reconnectAttempts.current < 10) {
                        setLoading?.(true);
                        reconnectAttempts.current++;
                        const timeout = 1000 * reconnectAttempts.current;
                        console.log(`Reconnecting in ${timeout}ms...`);
                        timerId = setTimeout(() => {
                            if (isMounted) connect();
                        }, timeout);
                    } else {
                        setLoading?.(null);
                        console.warn("Max reconnect attempts reached");
                    }
                };

                ws.onerror = (err) => {
                    console.error("WS error:", err);
                    ws.close();
                };

                ws.onmessage = handleSocketMessage;
            };

            connect();
        };

        init();

        return () => {
            isMounted = false;
            clearTimeout(timerId);
            if (ws) ws.close(1000);
        };
    }, [code]);

    return { gameSocket, game, players, tasks, locations, availableTasks };
};
