import { Avatar } from "antd";
import styles from "./Player.module.css";

export function Player({ player, icon, active, size = "smal" }) {
  return (
    <div className={`${styles.player} ${active && styles.me} ${styles[size]}`}>
      {icon ? icon : <Avatar size="normal">{player?.id}</Avatar>}
      <span>{player?.name}</span>
    </div>
  );
}
