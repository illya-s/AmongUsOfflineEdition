import { Avatar } from "antd";
import styles from "./Player.module.css"

export function Player({ player, active }) {
    return (
        <div className={`${styles.player} ${active && styles.me}`}>
            <Avatar size="large">{player?.id}</Avatar>
            <span>{player?.name}</span>
        </div>
    );
}
