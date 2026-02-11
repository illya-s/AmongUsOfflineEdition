import "./AdminGame.css";

import { Fragment, useEffect, useState } from "react";

import {
    DeleteFilled,
    PauseCircleFilled,
    PlayCircleFilled,
    RobotFilled,
    ToolFilled,
} from "@ant-design/icons";
import {
    Avatar,
    Badge,
    Button,
    Progress,
    Statistic,
    Switch,
    theme,
} from "antd";
import QRCodeStyling from "qr-code-styling";
import { Link, useLoaderData, useNavigate, useParams } from "react-router";

import { api } from "../providers/authService";

import { useRef } from "react";
import { Section } from "../components/elements/Section";
import {
    handleSocketMessage,
    initSocketHandlers,
    sendWithAck,
} from "../lib/api/sendWithAck";
import { ClientOnly } from "../lib/client/ClientOnly";
import { useMessageApi } from "../providers/MessageProvider";
import { useAuth } from "../providers/useAuth";
import Task from "../components/admin/game/Task";
import List from "../components/admin/game/List";
import Player from "../components/admin/game/Player";
import { useGameSocket } from "../lib/api/useGameSocket";
import { colorFromNumber } from "../lib/client/colorFromNumber";

function QRCode({ code, image }) {
    const { token } = theme.useToken();
    const ref = useRef(null);

    console.log(`${window.location.origin}/game/${code}/`)
    
    useEffect(() => {
        ref.current.innerHTML = "";

        const qrCode = new QRCodeStyling({
            width: 300,
            height: 300,
            data: `${window.location.origin}/game/${code}/`,
            image: image,
            backgroundOptions: {
                color: "transparent",
            },
            dotsOptions: {
                color: token.colorPrimary,
                type: "rounded",
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 20,
            },
        });

        qrCode.append(ref.current);
    }, []);

    return <div ref={ref} />;
}

export default function AdminGame() {
    const { code } = useParams();

    const message = useMessageApi();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { gameSocket, game, players, tasks, locations } = useGameSocket(code);

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

    const [isLoadingAutoMode, setIsLoadingAutoMode] = useState(false);

    const handleToggleGame = () => {
        sendWithAck(gameSocket, {
            action: "change_game",
            data: { value: !game?.active },
        }).catch((exc) => {
            console.error(`${exc.code}: ${exc.message}`);
        });
    };

    const handleRemoveGame = () => {
        api.delete(`games/${game?.code}/`)
            .then((res) => {
                gameSocket.close();
                navigate("/admin/");
            })
            .catch((exc) => {
                console.error(exc);
            });
    };

    return (
        <div className="admin-game-wrapper">
            <Section className="admin-game-top">
                <Avatar size="large">{game?.id}</Avatar>

                <div className="admin-game-top-middle">
                    <h1>{game?.name}</h1>
                    <p>{game?.code}</p>
                </div>

                <Button
                    variant="solid"
                    color={!game?.active ? "primary" : "green"}
                    // shape="circle"

                    size="middle"
                    icon={
                        !game?.active ? (
                            <PlayCircleFilled size="large" />
                        ) : (
                            <PauseCircleFilled size="large" />
                        )
                    }
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleGame();
                    }}
                />

                {game?.active ? (
                    <div>
                        <Badge color="green" text="Активна" />

                        <Statistic.Timer
                            type="countup"
                            value={new Date(game?.start_time).getTime()}
                        />
                    </div>
                ) : (
                    <Badge color="red" text="Не активна" />
                )}

                <Button
                    variant="solid"
                    color="danger"
                    size="middle"
                    icon={<DeleteFilled />}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveGame(game.code);
                    }}
                    disabled={game?.active}
                />
            </Section>

            <Progress
                percent={game?.progress}
                status="active"
                size={[null, 20]}
                strokeColor={{ from: "#108ee9", to: "#87d068" }}
            />

            <div className="admin-game-middle">
                <Section className="admin-game-middle-container">
                    <div className="admin-game-middle-top">
                        <h2>Players</h2>

                        <label
                            className="top-edit-switch-wrapper"
                            title="Авто / Ручное назначение ролей"
                        >
                            {game?.auto_assign_role ? (
                                <span>Auto</span>
                            ) : (
                                <span>Manual</span>
                            )}

                            <Switch
                                value={game?.auto_assign_role}
                                loading={isLoadingAutoMode}
                                onChange={(checked) => {
                                    setIsLoadingAutoMode(true);
                                    sendWithAck(gameSocket, {
                                        action: "toggle_auto_assign_role",
                                        data: { value: checked },
                                    })
                                        .then((req) => {})
                                        .catch((err) => {})
                                        .finally(() => {
                                            setIsLoadingAutoMode(false);
                                        });
                                }}
                                unCheckedChildren={<ToolFilled />}
                                checkedChildren={<RobotFilled />}
                                disabled={game?.active}
                            />
                        </label>
                    </div>

                    <List
                        dataSource={players}
                        renderItem={(player) => (
                            <Player
                                key={`player_${player.id}`}
                                player={player}
                                game={game}
                                gameSocket={gameSocket}
                                editable={!game?.auto_assign_role}
                                delete
                            />
                        )}
                    />
                </Section>
                <Section className="admin-game-middle-qr">
                    <ClientOnly>
                        <QRCode code={code} />
                    </ClientOnly>
                </Section>

                <Section className="admin-game-middle-container">
                    <div className="admin-game-middle-top">
                        <h2>Tasks</h2>
                    </div>

                    <List
                        className="admin-game-middle-task-list"
                        dataSource={tasks}
                        renderItem={(task) => (
                            <Task key={`task_${task.id}`} task={task} />
                        )}
                    />
                </Section>
                <Section className="admin-game-middle-img">
                    {/* <Link to={`/admin/game/${code}/map`}>
                    </Link>*/}
                    <svg
                        className="zones"
                        viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                        style={{
                            transformOrigin: "0 0",
                            willChange: "transform",
                        }}
                    >
                        <image
                            href={game?.game_map}
                            width="100%"
                            height="100%"
                        />
                        {tasks.map((task) => {
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
                </Section>
            </div>
            {/* <Painter game={game} tasks={tasks} locations={initLocations} />*/}
        </div>
    );
}
