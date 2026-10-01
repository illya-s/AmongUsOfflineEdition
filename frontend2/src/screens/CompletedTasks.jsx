import { CloseIcon } from "../assets/icons";
import styles from "./CompletedTasks.module.css";

import List from "../components/admin/game/List";
import { Section } from "../components/elements/Section";
import { useGameSocket } from "../lib/api/useGameSocket";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams } from "@/lib/router";
import { sendWithAck } from "../lib/api/sendWithAck";
import { colorFromNumber } from "../lib/client/colorFromNumber";

export default function CompletedTasks() {
    const { code } = useParams();
    const { game, gameSocket, tasks } = useGameSocket(code);

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

    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (game?.game_map) {
            const img = new Image();
            img.src = game.game_map;
            img.onload = () => {
                setMapDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
        }
    }, [game?.game_map]);

    const [currentTaskId, setCurrentTaskId] = useState(null);
    const handleSelectTask = (id) => {
        setCurrentTaskId((prev) => (prev === id ? null : id));
    };
    const currentTask = tasks?.find((t) => t.id === currentTaskId);

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

            <svg
                className="zones"
                viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                style={{
                    maxHeight: "500px",
                    transformOrigin: "0 0",
                    willChange: "transform",
                }}
            >
                <image href={game?.game_map} width="100%" height="100%" />
                {Array.isArray(renderList) &&
                    renderList.map((task) => {
                        if (!task) return null;
                        const points = task.points;
                        const color1 = colorFromNumber(task.id);
                        const color2 = colorFromNumber(task.id, 0.4);
                        return (
                            <Fragment key={`svg_task_${task.id}`}>
                                {Array.isArray(points) && points.length > 0 && (
                                    <polyline
                                        points={points
                                            .map((p) => `${p.x},${p.y}`)
                                            .join(" ")}
                                        fill={color2}
                                        stroke={color1}
                                        strokeWidth={2}
                                    />
                                )}
                                {Array.isArray(points) &&
                                    points.map((p, i) => (
                                        <circle
                                            key={i}
                                            cx={p.x}
                                            cy={p.y}
                                            r="3"
                                            fill={color1}
                                        />
                                    ))}
                            </Fragment>
                        );
                    })}
            </svg>

            <List
                dataSource={renderList}
                renderItem={(task) => (
                    <div
                        className={styles.task}
                        key={`task_${task.id}`}
                        onClick={() => handleSelectTask(task.id)}
                    >
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
