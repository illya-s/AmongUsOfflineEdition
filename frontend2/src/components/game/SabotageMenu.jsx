import {
    MessageOutlined,
    ThunderboltOutlined
} from "@ant-design/icons";
import { Button, Statistic } from "antd";
import { sendWithAck } from "../../lib/api/sendWithAck";
import styles from "./SabotageMenu.module.css";

export function SabotageMenu({ gameSocket, game, player }) {
    const isCooldown =
        game.sabotage_cooldown_until &&
        new Date(game.sabotage_cooldown_until) > new Date();

    const handleTrigger = (type) => {
        if (isCooldown) return;

        sendWithAck(gameSocket, {
            action: "trigger_sabotage",
            data: { type },
        }).catch((err) => console.error("Failed to trigger sabotage:", err));
    };

    const sabotages = [
        {
            type: "comms",
            icon: <MessageOutlined />,
            label: "Связь",
            description: "Скрывает список задач",
        },
        {
            type: "reactor",
            icon: <ThunderboltOutlined />,
            label: "Реактор",
            description: "Блокирует собрания",
        },
    ];

    return (
        <div className={styles.container}>
            {isCooldown && (
                <Statistic.Timer
                    type="countdown"
                    title="Перезарядка..."
                    value={new Date(game.sabotage_cooldown_until).getTime()}
                />
            )}

            {sabotages.map((s) => (
                <Button
                    key={s.type}
                    type="primary"
                    danger
                    icon={s.icon}
                    disabled={isCooldown}
                    onClick={() => handleTrigger(s.type)}
                    className={styles.sabotageButton}
                >
                    {s.label}
                </Button>
            ))}
        </div>
    );
}
