import { CheckIcon } from "../../assets/icons/";

import { LoadingOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Avatar, Button, Popover, Progress, Spin, Statistic } from "antd";

import gameContStyles from "./GameContainer.module.css";
import { Section } from "../elements/Section";
import { sendWithAck } from "../../lib/api/sendWithAck";

import gameLoadingStyles from "./GameLoading.module.css";
import { Fragment, useState } from "react";
import { useEffect } from "react";
import { colorFromNumber } from "../../lib/client/colorFromNumber";
import List from "../admin/game/List";
import Task from "../admin/game/Task";
import { EmergencyMeetingButton } from "./EmergencyMeetingButton";

export function GameContainer({ gameSocket, game, tasks, player, players }) {
    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

    const [currentTaskId, setCurrentTaskId] = useState(null);
    const handleSelectTask = (id) => {
        setCurrentTaskId((prev) => (prev === id ? null : id));
    };
    const currentTask = tasks?.find((t) => t.id === currentTaskId);

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

    const renderList = currentTaskId ? [currentTask] : player.tasks;
    const isCooldown =
        player.cooldown_until && new Date(player.cooldown_until) > new Date();

    return (
        <div className={gameContStyles.wrapper}>
            <div className={gameContStyles["top-wrapper"]}>
                <Progress
                    value={game?.progress}
                    className={gameContStyles["ant-progress"]}
                    size={[null, 32]}
                />

                <Popover
                    content={
                        <div className={gameContStyles["role-wrapper"]}>
                            <div
                                className={
                                    player.role == "imposter"
                                        ? gameContStyles["imposter-avatar"]
                                        : gameContStyles["crew-avatar"]
                                }
                            ></div>
                            <span
                                className={
                                    player.role == "imposter"
                                        ? gameContStyles.imposter
                                        : gameContStyles.crew
                                }
                            >
                                {player.role}
                            </span>
                        </div>
                    }
                >
                    <Button shape="round" block>
                        <InfoCircleOutlined />
                    </Button>
                </Popover>
            </div>

            <div className={gameContStyles["main-buttons"]}>
                <EmergencyMeetingButton
                    onClick={() => console.log("EmergencyMeeting pressed !")}
                />
            </div>

            <svg
                viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                style={{
                    transformOrigin: "0 0",
                    willChange: "transform",
                }}
            >
                <image href={game?.game_map} width="100%" height="100%" />
                {renderList.map((task) => {
                    const points = task.points;
                    const color1 = colorFromNumber(task.id);
                    const color2 = colorFromNumber(task.id, 0.4);
                    return (
                        <Fragment key={`svg_task_${task.id}`}>
                            {points?.length > 0 && (
                                <polyline
                                    points={points
                                        .map((p) => `${p.x},${p.y}`)
                                        .join(" ")}
                                    fill={color2}
                                    stroke={color1}
                                    strokeWidth={2}
                                />
                            )}
                            {points?.map((p, i) => (
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

            <div>
                <Statistic.Timer
                    type="countdown"
                    value={new Date(player.cooldown_until).getTime()}
                />
            </div>

            <List
                emptyMessage={"Ты сделал все задания!"}
                dataSource={player.tasks}
                renderItem={(task) => (
                    <div
                        key={`task_${task.id}`}
                        className={`${gameContStyles.task} ${currentTaskId === task.id ? gameContStyles.active : ""}`}
                        onClick={() => handleSelectTask(task.id)}
                    >
                        <span>{task.task.text}</span>

                        <button
                            disabled={isCooldown}
                            onClick={(e) => {
                                e.stopPropagation();

                                if (isCooldown) return;

                                sendWithAck(gameSocket, {
                                    action: "change_check_task",
                                    data: {
                                        id: task.id,
                                        value: !task.is_completed,
                                    },
                                });
                            }}
                            className={`${gameContStyles["task-complete-button"]} ${isCooldown ? gameContStyles.disabled : ""}`}
                        >
                            <CheckIcon color="green" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}

export function GameLoading({ gameSocket, game, player, players }) {
    const handleExit = () => {
        gameSocket.close();
        localStorage.removeItem(game.code);
        sendWithAck(gameSocket, {
            action: "delete_player",
            data: { id: player?.id },
        })
            .then((res) => {
                navigate("/");
            })
            .catch((err) => {
                console.error(err.message);
            });
    };

    return (
        <Section className={gameLoadingStyles.wrapper}>
            <div className={gameLoadingStyles["top-wrapper"]}>
                <span className="space"></span>

                <Button variant="solid" color="danger" onClick={handleExit}>
                    Выйти
                </Button>
            </div>

            <div className={gameLoadingStyles.content}>
                <div className={gameLoadingStyles.title}>
                    <Spin
                        indicator={
                            <LoadingOutlined style={{ fontSize: 32 }} spin />
                        }
                    />

                    <span>Ожидпние старта игры</span>
                </div>

                <div className={gameLoadingStyles["player-list"]}>
                    {players.map((p) => (
                        <div
                            key={`player_${p.id}`}
                            className={`${gameLoadingStyles.player} ${p.id == player.id && gameLoadingStyles.me}`}
                        >
                            <Avatar size="large">{p.id}</Avatar>
                            <span>{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}
