import { useNavigate } from "@/lib/router";
import { useAuth } from "../auth/useAuth";

export default function ProtectedRoute({ children }) {
	const navigate = useNavigate();
	const { user, loading } = useAuth();

	if (loading) return <div>Loading...</div>;
	return user ? children : navigate("/login");
}
