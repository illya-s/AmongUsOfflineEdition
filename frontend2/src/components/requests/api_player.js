import { api } from "../../providers/apiClient";

export async function getGamePlayers(code) {
    try {
        const res = await api.get(`game/${code}/players/`);
        return res.data;
    } catch {
        return [];
    }
}

export async function postGamePlayer(code) {
    try {
        const res = await api.get(`game/${code}/player/`);
        return res.data;
    } catch {
        return [];
    }
}


export async function getPlayer(id) {
    try {
        const res = await api.get(`players/${id}/`);
        return res.data;
    } catch {
        return null;
    }
}

export async function deletePlayer(id) {
    try {
        const res = await api.delete(`players/${id}/`);
        return res.data;
    } catch {
        return null;
    }
}

export const isPlayerExists = async (id) => {
    if (await getPlayer(id)) {
        return true
    } else {
        false
    }
}
