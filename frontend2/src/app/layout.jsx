import "../components/base/Base.css";
import "../Theme.css";
import "../layouts/DesktopLayout.css";
import "../screens/Admin.css";
import "../screens/AdminGame.css";
import "../screens/Home.css";
import "../components/elements/Section.css";
import "../components/admin/AdminBlock.css";
import "../components/admin/LocationForm.css";
import "../components/admin/painter/GameTaskForm.css";

export const metadata = {
    title: "Among Us Offline Edition",
    description: "Offline party game companion",
};

export default function RootLayout({ children }) {
    return <html lang="ru"><body><div id="root">{children}</div></body></html>;
}
