import { LoadingOutlined, WarningOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "@/lib/router";
import { Section } from "../components/elements/Section";
import { GameContainer, GameLoading } from "../components/game/Game";
import { GameWaiting } from "../components/game/GameWaiting";
import { WinScreen } from "../components/game/WinScreen";
import { useGameSocket } from "../lib/api/useGameSocket";
import styles from "./Game.module.css";

export default function Game() {
    const { code } = useParams();
    const [searchParams] = useSearchParams();
    const spId = searchParams.get("pId");

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [pId, setPId] = useState(() =>
        spId
            ? spId
            : typeof window !== "undefined"
              ? localStorage.getItem(code)
              : null,
    );

    const [player, setPlayer] = useState(null);

    const { gameSocket, game, players, tasks } = useGameSocket(
        code,
        pId,
        setPlayer,
        setLoading,
    );

    useEffect(() => {
        console.log(game && !player?.id)
        
        if (game && !player?.id) {
            localStorage.removeItem(code)
            navigate("/");
        }
    }, [game, player]);

    useEffect(() => {
        if (players.length == 0) return;

        if (player && !players.some((p) => p.id == player.id)) {
            gameSocket.close();
            navigate("/");
        }
    }, [players]);

    const startTime = game?.start_time
        ? new Date(game.start_time).getTime()
        : 0;

    if (player && !player.is_alive) {
        navigate("/ghost");
    }

    if (game?.is_ended) {
        return <WinScreen game={game} players={players} />;
    }

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
    ) : game?.active ? (
        startTime > Date.now() ? (
            <GameWaiting
                player={player}
                players={players}
                startTime={startTime}
            />
        ) : (
            <GameContainer
                gameSocket={gameSocket}
                game={game}
                tasks={tasks}
                player={player}
                players={players}
            />
        )
    ) : (
        <GameLoading
            gameSocket={gameSocket}
            game={game}
            player={player}
            players={players}
        />
    );
}
