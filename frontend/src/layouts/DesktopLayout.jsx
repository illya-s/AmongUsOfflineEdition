import styles from "./DesktopLayout.module.css";

import { Outlet } from "react-router";

export default function DesktopLayout() {
  return (
    <main id="scrollableDiv" className={styles.content}>
      <Outlet />
    </main>
  );
}
