import styles from "./Forms.module.css";

import { Button, Input } from "antd";
import { useEffect } from "react";
import { useState } from "react";
import { useMessageApi } from "../../providers/MessageProvider";
import { api } from "../../providers/authService";
import { getGame } from "../requests/api_game";
import { sendWithAck } from "../../lib/api/sendWithAck";

export function GameConnectForm({ setGame }) {
    const message = useMessageApi();
    const [code, setCode] = useState("");

    useEffect(() => {
        if (code.length == 8) {
            handleGetGame();
        }
    }, [code]);

    const handleGetGame = async () => {
        if (!code) {
            message.warning("Введите код")
            return
        }

        const game = await getGame(code);

        if (!game) {
            message.error("Что-то пошло не так!");
        } else if (game?.active && !localStorage.getItem(code)) {
            message.warning("Игра уже стартовыла!");
            setCode("");
        } else {
            setGame(game);
            setCode("");
        }
    };

    return (
        <form className={styles.form}>
            <Input.OTP
                placeholder="Введите код..."
                formatter={(str) => str.toUpperCase()}
                length={8}
                value={code}
                onChange={(value) => setCode(value)}
                onKeyDown={(e) => e.key == "Enter" && handleGetGame()}
                size="large"
            />

            <Button
                block
                size="large"
                color="primary"
                variant="solid"
                onClick={handleGetGame}
            >
                Присоедениться
            </Button>
        </form>
    );
}

export function GameAddUserForm({ gameSocket, code, setPId, setPlayer }) {
    const message = useMessageApi();

    const [name, setName] = useState("");

    const handleAddGameUser = () =>
        sendWithAck(gameSocket, {
            action: "add_player",
            data: { name: name },
        })
            .then((res) => {
                const players = res.data.game.players;
                const player = players.find((p) => p.name == name);
                localStorage.setItem(code, player.id);
                setPId(player.id);
                setPlayer(player);
            })
            .catch((err) => {
                message.error(err.message);
                console.error(err.message);
            });

    return (
        <div className={styles.wrapper}>
            <form className={styles.form} onSubmit={handleAddGameUser}>
                <Input
                    placeholder="Введите имя..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key == "Enter" && handleAddGameUser()}
                    size="large"
                />

                <Button
                    block
                    size="large"
                    color="primary"
                    variant="solid"
                    onClick={handleAddGameUser}
                >
                    Присоедениться
                </Button>
            </form>
        </div>
    );
}
