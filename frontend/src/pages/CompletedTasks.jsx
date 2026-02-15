import { CloseIcon } from "../assets/icons/";
import styles from "./CompletedTasks.module.css";

import List from "../components/admin/game/List";
import { Section } from "../components/elements/Section";
import { useGameSocket } from "../lib/api/useGameSocket";

import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { sendWithAck } from "../lib/api/sendWithAck";

export default function CompletedTasks() {
    const { code } = useParams();
    const { gameSocket, tasks } = useGameSocket(code);

    const [selectedLocationId, setSelectedLocationId] = useState("all");

    const locations = useMemo(() => {
        const locMap = new Map();
        if (Array.isArray(tasks)) {
            tasks.forEach((task) => {
                if (task?.location) {
                    locMap.set(task.location.id, task.location.name);
                }
            });
        }
        return Array.from(locMap, ([id, name]) => ({ id, name }));
    }, [tasks]);

    const renderList = (Array.isArray(tasks) ? tasks : []).filter((task) => {
        if (!task) return false;
        const isFinished = task.is_completed;
        const matchesLocation =
            selectedLocationId === "all" ||
            task.location?.id === Number(selectedLocationId);
        return isFinished && matchesLocation;
    });

    return (
        <div className={styles.wrapper}>
            <Section>
                <label className={styles["location-select-wrapper"]}>
                    <span>Локация:</span>
                    <select
                        className={styles["location-select"]}
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                    >
                        <option value="all">Все локации</option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>
                </label>
            </Section>

            <List
                dataSource={renderList}
                renderItem={(task) => (
                    <div className={styles.task} key={`task_${task.id}`}>
                        <span>{task.task.text}</span>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();

                                sendWithAck(gameSocket, {
                                    action: "change_check_task",
                                    data: {
                                        id: task.id,
                                        value: !task.is_completed,
                                    },
                                });
                            }}
                            className={styles["task-complete-button"]}
                        >
                            <CloseIcon color="red" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
