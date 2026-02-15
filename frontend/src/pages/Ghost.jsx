import { GhostIcon } from "../assets/icons";
import { Section } from "../components/elements/Section";
import styles from "./Ghost.module.css";

export default function Ghost() {
    return (
        <Section className={styles["ghost-overlay"]}>
            <span className={styles["ghost-text"]}>
                <GhostIcon style={{ width: 32, color: "grey" }} /> Призрак
            </span>
            <p>
                Вы мертвы. Вы можете наблюдать за игрой. <br />
                Незабывайте вы можете ходить только с поднятой рукой!
            </p>
        </Section>
    );
}
