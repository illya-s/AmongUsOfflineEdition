import { DeleteFilled } from "@ant-design/icons";
import { Avatar, Button, Popconfirm, Select } from "antd";
import { useState } from "react";
import { sendWithAck } from "../../../lib/api/sendWithAck";
import styles from "./Player.module.css";
import { AliveIcon, GhostIcon, KnifeIcon } from "../../../assets/icons";

export default function Player({ player, game, gameSocket, editable = false }) {
    const [isLoading, setIsLoading] = useState(false);

    const updatePlayerRole = (value) => {
        setIsLoading(true);
        sendWithAck(gameSocket, {
            action: "change_player_role",
            data: { id: player.id, value: value == "null" ? null : value },
        }).finally(() => {
            setIsLoading(false);
        });
    };

    const roleValue = player.role ?? "null";

    const handleDeletePlayer = async () => {
        sendWithAck(gameSocket, {
            action: "delete_player",
            data: { id: player.id },
        }).catch((err) => {
            console.error(err.message);
        });
    };

    return (
        <div className={styles.block}>
            {player?.is_alive ? (
                player?.role == "imposter" ? (
                    <KnifeIcon style={{ width: 32, color: "#FFF" }} />
                ) : (
                    <AliveIcon style={{ width: 32, color: "#FFF" }} />
                )
            ) : (
                <GhostIcon style={{ width: 32, color: "#FFF" }} />
            )}

            <div className={styles.middle}>
                <h3>{player.name}</h3>

                <span>
                    #{player.id} Роль:&nbsp;
                    {game?.active ? (
                        <span>
                            {Array.isArray(player.roleList) &&
                                player.roleList.find(
                                    (role) => role.value == roleValue,
                                )?.name}
                        </span>
                    ) : (
                        <Select
                            value={roleValue}
                            onChange={updatePlayerRole}
                            options={[
                                { value: "null", label: "Не назначено" },
                                ...(Array.isArray(player.roleList)
                                    ? player.roleList
                                    : []
                                ).map((role) => {
                                    return {
                                        value: role.value,
                                        label: role.name,
                                    };
                                }),
                            ]}
                            disabled={!editable}
                        />
                    )}
                </span>
            </div>

            {game?.active && player.is_alive && (
                <Popconfirm
                    title={`Убить игрока ${player.name}?`}
                    onConfirm={() => {
                        sendWithAck(gameSocket, {
                            action: "kill_player",
                            data: { target_id: player.id },
                        }).catch((err) => {
                            console.error(err.message);
                        });
                    }}
                >
                    <Button
                        size="middle"
                        danger
                        shape="circle"
                        style={{ marginRight: "10px" }}
                    >
                        🔪
                    </Button>
                </Popconfirm>
            )}

            <Popconfirm
                title="Вы действительно хотите удалить игрока?"
                onConfirm={handleDeletePlayer}
            >
                <Button
                    size="middle"
                    variant="solid"
                    color="danger"
                    shape="circle"
                    icon={<DeleteFilled size="large" />}
                />
            </Popconfirm>
        </div>
    );
}
