import { Progress } from "antd";
import { useMemo, useEffect, useState, memo } from "react";
import { Player } from "./Player";
import { AliveIcon, KnifeIcon } from "../../assets/icons";
import styles from "./GameWaiting.module.css";
import { useRef } from "react";

const Countdown = ({ startTime, onFinish }) => {
    const [left, setLeft] = useState(
        Math.max(0, (startTime - Date.now()) / 1000),
    );
    const requestRef = useRef();
    const initialLeft = useMemo(
        () => Math.max(1, (startTime - Date.now()) / 1000),
        [startTime],
    );

    useEffect(() => {
        const update = () => {
            const now = Date.now();
            const remaining = Math.max(0, (startTime - now) / 1000);

            setLeft(remaining);

            if (remaining <= 0) {
                onFinish?.();
                cancelAnimationFrame(requestRef.current);
            } else {
                requestRef.current = requestAnimationFrame(update);
            }
        };

        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, [startTime, onFinish]);

    const percent = (left / initialLeft) * 100;

    const format = () => {
        const m = Math.floor(left / 60);
        const s = Math.ceil(left % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    return (
        <Progress
            type="circle"
            percent={percent}
            format={format}
            size={180}
            strokeColor={{
                "0%": "#ff4d4f",
                "100%": left < 30 ? "#ff4d4f" : "#1890ff",
            }}
        />
    );
};

export function GameWaiting({ player, players, startTime, onFinish }) {
    return (
        <div
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 20,
            }}
        >
            <div style={{ fontSize: 18 }}>Старт через…</div>

            <Countdown startTime={startTime} onFinish={onFinish} />

            <div className={styles["player-info"]}>
                <span>Ваша роль:</span>

                {player?.role === "imposter" ? (
                    <KnifeIcon style={{ width: 16, color: "#FFF" }} />
                ) : (
                    <AliveIcon style={{ width: 16, color: "#FFF" }} />
                )}

                <span className={styles["player-info-name"]}>
                    {player?.role}
                </span>
            </div>

            {player?.role === "imposter" && (
                <div>
                    {players
                        ?.filter(
                            (p) => p.role === "imposter" && p.id !== player.id,
                        )
                        .map((p) => (
                            <Player
                                key={`player_${p.id}`}
                                player={p}
                                active={p.id === player.id}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}
