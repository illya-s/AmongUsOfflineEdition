import { Outlet } from "react-router";
import { Layout } from "antd";
import styles from "./BaseLayout.module.css"

export default function BaseLayout() {
    return (
        <main id="scrollableDiv" className={styles.content}>
            <Outlet />
        </main>
    );
}
