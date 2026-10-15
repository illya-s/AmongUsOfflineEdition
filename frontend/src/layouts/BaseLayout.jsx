import { Outlet } from "react-router";
import styles from "./BaseLayout.module.css";

export default function BaseLayout() {
	return (
		<main id="scrollableDiv" className={styles.content}>
			<Outlet />
		</main>
	);
}
