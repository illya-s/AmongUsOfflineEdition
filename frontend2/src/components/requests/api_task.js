import { api } from "../../providers/authService";


export async function getTasks() {
    try {
        const res = await api.get(`tasks/`)
        return res.data;
    } catch {
        return null;
    }
}

export async function getGameTasks(code) {
    try {
        const res = await api.get(`game/${code}/game-task/`)
        return res.data;
    } catch {
        return null;
    }
}
