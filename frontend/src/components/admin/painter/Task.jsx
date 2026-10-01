import { sendWithAck } from "../../../lib/api/sendWithAck";
import styles from "./Task.module.css";
import { Avatar } from "antd";

export function Task({ task, gameSocket, isSelected, ...props }) {
    const pointsCount = Array.isArray(task.points) ? task.points.length : 0;
    const pointLabel =
        pointsCount === 2
            ? "Перенос"
            : pointsCount === 1
              ? "Точка задана"
              : "Без точки";

    return (
        <div
            className={`${styles.task} ${isSelected ? styles.active : ""}`}
            {...props}
        >
            <Avatar>{task.sequence_number ?? task.id}</Avatar>

            <div className={styles.center}>
                <span className={styles.name} title={task.task.text}>
                    {task.task.text}
                </span>
                <span className={styles.meta}>
                    <span className={styles.location}>{task.location.name}</span>
                    <span className={styles.status}>{pointLabel}</span>
                </span>
            </div>
        </div>
    );
}
