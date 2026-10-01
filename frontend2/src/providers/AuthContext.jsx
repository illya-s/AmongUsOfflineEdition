import { createContext, useState, useEffect } from "react";
import { getUser, refreshToken } from "./authService";

function generateDeviceId() {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return "id-" + Math.random().toString(36).slice(2, 10);
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [accessToken, setAccessToken] = useState(() => {
		if (typeof window === "undefined") return null;
		
		return localStorage.getItem("access_token");
	});
	const [deviceId, setDeviceId] = useState(() => {
		if (typeof window === "undefined") return null;

		try {
			let id = localStorage.getItem("device_id");
			if (!id) {
				id = generateDeviceId();
				localStorage.setItem("device_id", id);
			}
			return id;
		} catch (e) {
			console.warn("Unable to write device_id to localStorage", e);
			return null;
		}
	});
	const [user, setUser] = useState(null);

	useEffect(() => {
		if (!accessToken) return;
		localStorage.setItem("access_token", accessToken)
		getUser(accessToken)
			.then((data) => setUser(data))
			.catch(async () => {
				const newToken = await refreshToken();
				if (newToken) setAccessToken(newToken);
			});
	}, [accessToken]);

	return (
		<AuthContext.Provider
			value={{ user, accessToken, setAccessToken, deviceId }}
		>
			{children}
		</AuthContext.Provider>
	);
}
