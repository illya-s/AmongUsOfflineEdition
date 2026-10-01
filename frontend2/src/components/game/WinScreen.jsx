import { Result } from "antd";
import styles from "./WinScreen.module.css";
import { Player } from "./Player";

export function WinScreen({ game, players }) {
    const isCrewWin = game.winner === "crew";

    return (
        <div className={styles.wrapper}>
            <Result
                status={isCrewWin ? "success" : "error"}
                title={
                    isCrewWin ? "🎉 Победа Экипажа!" : "💀 Победа Предателей!"
                }
                subTitle={
                    game.reason === "all_tasks_completed" ||
                    game.reason === "all_imposters_ejected"
                        ? "Все задания выполнены!"
                        : game.reason === "outnumbered_crew"
                          ? "Предатели сравняли счет!"
                          : "Игра окончена!"
                }
            />

            <div className={styles["player-list"]}>
                {Array.isArray(players) &&
                    players
                        ?.filter((p) => p.role == game.winner)
                        .map((p) => (
                            <Player key={`player_${p.id}`} player={p} />
                        ))}
            </div>
        </div>
    );
}
