import "./AdminGame.css";

import { Fragment, useEffect, useState } from "react";

import { RobotFilled, ToolFilled } from "@ant-design/icons";
import { Progress, Switch, theme } from "antd";
import QRCodeStyling from "qr-code-styling";
import { Link, useNavigate, useParams } from "react-router";

import { useRef } from "react";
import { AdminTopContainer } from "../components/admin/game/AdminTopContainer";
import List from "../components/admin/game/List";
import Player from "../components/admin/game/Player";
import Task from "../components/admin/game/Task";
import { Section } from "../components/elements/Section";
import { sendWithAck } from "../lib/api/sendWithAck";
import { useGameSocket } from "../lib/api/useGameSocket";
import { ClientOnly } from "../lib/client/ClientOnly";
import { colorFromNumber } from "../lib/client/colorFromNumber";
import { useMessageApi } from "../providers/MessageProvider";
import { useAuth } from "../providers/useAuth";
import { AdminMeeting } from "../components/admin/game/AdminMeeting";
import { AdminMusic } from "../components/admin/game/AdminMusic";

function QRCode({ code, image }) {
    const { token } = theme.useToken();
    const ref = useRef(null);

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

    return (
        <div className="admin-game-wrapper">
            <AdminTopContainer gameSocket={gameSocket} game={game} />

            <Progress
                percent={game?.progress}
                status="active"
                size={[null, 20]}
                strokeColor={{ from: "#108ee9", to: "#87d068" }}
            />

            <AdminMeeting gameSocket={gameSocket} game={game} />

            <AdminMusic game={game} />

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
                <Link
                    className="admin-game-middle-img"
                    to={`/admin/game/${code}/map`}
                >
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
                        {Array.isArray(tasks) &&
                            tasks.map((task) => {
                                if (!task) return null;
                                const points = task.points;
                                const color1 = colorFromNumber(task.id);
                                const color2 = colorFromNumber(task.id, 0.4);
                                return (
                                    <Fragment key={`svg_task_${task.id}`}>
                                        {Array.isArray(points) &&
                                            points.length > 0 && (
                                                <polyline
                                                    points={points
                                                        .map(
                                                            (p) =>
                                                                `${p.x},${p.y}`,
                                                        )
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
                </Link>
            </div>
        </div>
    );
}
