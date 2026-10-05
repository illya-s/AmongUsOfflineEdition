import styles from "./Forms.module.css";

import { Button, Input } from "antd";
import { useEffect } from "react";
import { useState } from "react";
import { useMessageApi } from "../../providers/MessageProvider";
import { api } from "../../providers/apiClient";
import { getGame } from "../requests/api_game";

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
            message.warning("Введите код");
            return;
        }

        api.get(`games/${code}/`).then((res) => {
            const game = res.data;

            console.log(game);
            if (game?.active) {
                message.warning("Игра уже стартовыла!");
                setCode("");
            } else {
                setGame(game);
                setCode("");
            }
        });
        // const game = await getGame(code)?.data;

        // if (!game) {
        //     message.error("Что-то пошло не так!");
        // } else if (game?.active && !localStorage.getItem(code)) {
        //     message.warning("Игра уже стартовыла!");
        //     setCode("");
        // } else {

        // }
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

export function GameAddUserForm({ code, setPlayer }) {
    const message = useMessageApi();

    const [name, setName] = useState("");

    const handleAddGameUser = (e) => {
        e.preventDefault();

        api.post(`game/${code}/player/`, { name: name })
            .then((res) => {
                setPlayer(res.data);
            })
            .catch((err) => {
                // message.error(err);
                console.error(err);
            });
    };

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
