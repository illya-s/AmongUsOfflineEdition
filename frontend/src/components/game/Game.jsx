import { CheckIcon } from "../../assets/icons/";

import { InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Popover, Progress, Spin, Statistic } from "antd";

import { sendWithAck } from "../../lib/api/sendWithAck";
import { Section } from "../elements/Section";
import gameContStyles from "./GameContainer.module.css";

import { Fragment, useEffect, useState } from "react";
import { AliveIcon, KnifeIcon } from "../../assets/icons";
import { colorFromNumber } from "../../lib/client/colorFromNumber";
import List from "../admin/game/List";
import gameLoadingStyles from "./GameLoading.module.css";
import { MeetingScreen } from "./MeetingScreen";
import { Player } from "./Player";
import { ReportButton } from "./ReportButton";
import { SabotageMenu } from "./SabotageMenu";
import { SelfKillButton } from "./SelfKillButton";
import { useMessageApi } from "../../providers/MessageProvider";

export function GameContainer({ gameSocket, game, tasks, player, players }) {
    const message = useMessageApi();

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

    const isImposter = player.role === "imposter";
    const activeMeeting = game?.meetings.find((m) => m.is_active);

    const handleStartEmergencyMeeting = () => {
        if (!player.is_alive) return;

        sendWithAck(gameSocket, {
            action: "start_emergency_meeting",
            data: {},
        }).catch((error) => {
            console.error("Failed to start emergency meeting:", error);
        });
    };

    const [showResults, setShowResults] = useState(activeMeeting);

    const activeSabotage = game?.last_sabotage_type;
    const isCommsSabotaged = activeSabotage === "comms";

    const cooldownTime = new Date(player.cooldown_until).getTime();
    const tasksBlockedTime = new Date(game.tasks_blocked_until).getTime();
    const maxTime = Math.max(cooldownTime, tasksBlockedTime);

    if (activeMeeting || showResults) {
        return (
            <MeetingScreen
                gameSocket={gameSocket}
                meeting={activeMeeting}
                players={players}
                player={player}
                setShowResults={setShowResults}
                onMeetingEnd={() => {
                    sendWithAck(gameSocket, {
                        action: "end_meeting",
                        data: { meeting_id: activeMeeting.id },
                    }).catch((err) =>
                        console.error("Auto-ending meeting failed:", err),
                    );
                }}
            />
        );
    }

    return (
        <div className={gameContStyles.wrapper}>
            <div className={gameContStyles["top-wrapper"]}>
                <Progress
                    percent={game?.progress}
                    status="active"
                    size={[null, 20]}
                    strokeColor={{ from: "#108ee9", to: "#87d068" }}
                />

                <Popover
                    content={
                        <div className={gameContStyles["role-wrapper"]}>
                            <div
                                className={
                                    player.role == "imposter"
                                        ? gameContStyles.imposter
                                        : gameContStyles.crew
                                }
                            >
                                {player?.role == "imposter" ? (
                                    <KnifeIcon style={{ width: 18 }} />
                                ) : (
                                    <AliveIcon style={{ width: 18 }} />
                                )}

                                <span>{player.role}</span>
                            </div>

                            {isImposter && (
                                <SabotageMenu
                                    gameSocket={gameSocket}
                                    game={game}
                                    player={player}
                                />
                            )}
                        </div>
                    }
                >
                    <Button shape="round" block>
                        <InfoCircleOutlined />
                    </Button>
                </Popover>
            </div>

            <div className={gameContStyles["main-buttons"]}>
                {!activeMeeting &&
                    game.emergency_meetings_blocked_until &&
                    new Date(game.emergency_meetings_blocked_until) >
                        new Date() && (
                        <Statistic.Timer
                            type="countdown"
                            title="Перезарядка..."
                            value={new Date(
                                game.emergency_meetings_blocked_until,
                            ).getTime()}
                        />
                    )}

                <ReportButton
                    onClick={handleStartEmergencyMeeting}
                    activeMeeting={activeMeeting}
                    blockedUntil={game.emergency_meetings_blocked_until}
                />

                {!isImposter && (
                    <SelfKillButton
                        onClick={() => {
                            sendWithAck(gameSocket, {
                                action: "kill_player",
                            });
                        }}
                    />
                )}
            </div>

            <svg viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}>
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

            <div>
                <Statistic.Timer type="countdown" value={maxTime} />
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
                            disabled={
                                isCooldown ||
                                isCommsSabotaged ||
                                task.is_completed
                            }
                            onClick={(e) => {
                                e.stopPropagation();

                                if (
                                    isCooldown ||
                                    isCommsSabotaged ||
                                    task.is_completed
                                )
                                    return;

                                sendWithAck(gameSocket, {
                                    action: "complete_task",
                                    data: {
                                        id: task.id,
                                    },
                                }).catch((error) => {
                                    console.error(
                                        "Failed to complete task:",
                                        error,
                                    );
                                });
                            }}
                            className={`${gameContStyles["task-complete-button"]} ${isCooldown || task.is_completed ? gameContStyles.disabled : ""}`}
                        >
                            <CheckIcon
                                color={task.is_completed ? "gray" : "green"}
                            />
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
                    {Array.isArray(players) &&
                        players.map((p) => (
                            <Player
                                key={`player_${p.id}`}
                                player={p}
                                active={p.id == player.id}
                            />
                        ))}
                </div>
            </div>
        </Section>
    );
}
