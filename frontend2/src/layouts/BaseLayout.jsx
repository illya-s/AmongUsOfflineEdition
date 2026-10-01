import { Outlet } from "@/lib/router";
import { Layout } from "antd";
import styles from "./BaseLayout.module.css"

export default function BaseLayout() {
    return (
        <Layout className={styles["layout-wrapper"]}>
            <main id="scrollableDiv" className={styles.content}>
                <Outlet />
            </main>
        </Layout>
    );
}
