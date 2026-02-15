import { Result } from "antd";
import styles from "./WinScreen.module.css";

export function WinScreen({ game }) {
    const isCrewWin = game.winner === "crew";

    return (
        <div className={styles.wrapper}>
            <Result
                status={isCrewWin ? "success" : "error"}
                title={
                    isCrewWin ? "🎉 Победа Экипажа!" : "💀 Победа Предателей!"
                }
                subTitle={
                    game.reason === "all_tasks_completed" || game.reason === "all_imposters_ejected"
                        ? "Все задания выполнены!"
                        : game.reason === "outnumbered_crew"
                          ? "Предатели сравняли счет!"
                          : "Игра окончена!"
                }
            />
        </div>
    );
}
