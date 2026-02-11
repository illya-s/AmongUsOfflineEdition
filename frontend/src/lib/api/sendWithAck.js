let player_id = null;
let updatePlayer = null;
let updateGame = null;
let updateTasks = null;
let updatePlayers = null;
let updateLocations = null;

export function initSocketHandlers({
    pId,
    setPlayer,
    setGame,
    setTasks,
    setPlayers,
    setLocations,
}) {
    player_id = pId;
    updatePlayer = setPlayer;
    updateGame = setGame;
    updateTasks = setTasks;
    updatePlayers = setPlayers;
    updateLocations = setLocations;
}

let pendingRequests = {};

export function sendWithAck(socket, payload) {
    return new Promise((resolve, reject) => {
        const id = Date.now() + Math.random();
        payload.request_id = id;

        if (player_id) {
            payload.player_id = player_id;
        }

        pendingRequests[id] = { resolve, reject };

        socket.send(JSON.stringify(payload));

        setTimeout(() => {
            if (pendingRequests[id]) {
                reject(new Error("Timeout waiting for server"));
                delete pendingRequests[id];
            }
        }, 5000);
    });
}

export function handleSocketMessage(event) {
    const msg = JSON.parse(event.data);

    if (msg.request_id && pendingRequests[msg.request_id]) {
        const { resolve, reject } = pendingRequests[msg.request_id];

        if (msg.action === "error" || msg.status === "error") {
            reject(new Error(msg.message || "Server error"));
        } else {
            resolve(msg);
        }

        delete pendingRequests[msg.request_id];
    }

    switch (msg.action) {
        case "init":
        case "update":
            updateGame?.(msg.data.game);
            updateTasks?.(msg.data.game.tasks);
            updatePlayers?.(msg.data.game.players);
            updatePlayer?.(msg.player)
            // updateLocations?.()
            break;

        case "error":
            console.error(`${msg.code}: ${msg.message}`);
            break;
    }
}
