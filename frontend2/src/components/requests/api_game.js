import { api } from "../../providers/authService";

export async function getGame(code) {
    try {
        const res = await api.get(`games/${code}/`)
        return res.data;
    } catch {
        return null;
    }
}
