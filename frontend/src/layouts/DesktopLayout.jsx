import "./DesktopLayout.css";

import { LogoIcon } from "../assets/icons";

import { Outlet } from "react-router";

import { Layout } from "antd";

export default function DesktopLayout() {
	return (
		<Layout className="layout-wrapper">
			<main id="scrollableDiv" className="content">
				<Outlet />
			</main>
		</Layout>
	);
}
