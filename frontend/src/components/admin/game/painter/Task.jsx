import { sendWithAck } from "../../../../lib/api/sendWithAck";
import styles from "./Task.module.css";
import { Avatar } from "antd";

export function Task({ task, gameSocket, isSelected, ...props }) {
    return (
        <div
            className={`${styles.task} ${isSelected ? styles.active : ""}`}
            {...props}
        >
            <Avatar>{task.id}</Avatar>

            <div className={styles.center}>
                <span className={styles.name} title={task.task.text}>{task.task.text}</span>
                <span className={styles.location}>{task.location.name}</span>
            </div>
        </div>
    );
}
