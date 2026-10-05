import "./DesktopLayout.css";

import { LogoIcon } from "../assets/icons";

import { Outlet } from "react-router";

import { Layout } from "antd";

export default function DesktopLayout() {
	return (
		<Layout className="layout-wrapper">
			<header>
				<LogoIcon />

				<h2>Among Us Offline Edition</h2>

			</header>

			<main id="scrollableDiv" className="content">
				<Outlet />
			</main>
		</Layout>
	);
}
