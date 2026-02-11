import { api } from "../../providers/authService";


export async function getLocations() {
    try {
        const res = await api.get(`locations`)
        return res.data;
    } catch {
        return null;
    }
}