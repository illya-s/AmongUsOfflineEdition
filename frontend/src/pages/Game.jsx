import styles from "./Game.module.css";

import { WarningOutlined, LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Section } from "../components/elements/Section";
import { GameContainer, GameLoading } from "../components/game/Game";
import { GameAddUserForm } from "../components/home/Forms";
import { useGameSocket } from "../lib/api/useGameSocket";

export default function Game() {
    const { code } = useParams();

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [pId, setPId] = useState(() =>
        typeof window !== "undefined" ? localStorage.getItem(code) : null,
    );

    const [player, setPlayer] = useState(null);

    const { gameSocket, game, players, tasks } = useGameSocket(
        code,
        pId,
        setPlayer,
        setLoading,
    );

    useEffect(() => {
        if (players.length == 0) return;

        if (player && !players.some((p) => p.id == player.id)) {
            gameSocket.close();
            navigate("/");
        }

        // const pId = localStorage.getItem(code);
        // const p = players.find((p) => p.id == pId);
        // if (!p) localStorage.removeItem(code);
        // setPlayer(p);
    }, [players]);

    return loading || loading === null ? (
        <Section className={styles.loading}>
            {loading === null ? (
                <>
                    <WarningOutlined />
                    &nbsp;
                    <span>Сервер отклонил соединение проверьте код</span>
                </>
            ) : (
                <>
                    <Spin
                        indicator={
                            <LoadingOutlined style={{ fontSize: 32 }} spin />
                        }
                    />
                    &nbsp;
                    <span>Соединение с сервером..</span>
                </>
            )}
        </Section>
    ) : !player ? (
        <GameAddUserForm
            gameSocket={gameSocket}
            code={code}
            setPId={setPId}
            setPlayer={setPlayer}
        />
    ) : game?.active ? (
        <GameContainer
            gameSocket={gameSocket}
            game={game}
            tasks={tasks}
            player={player}
            players={players}
        />
    ) : (
        <GameLoading
            gameSocket={gameSocket}
            game={game}
            player={player}
            players={players}
        />
    );
}
