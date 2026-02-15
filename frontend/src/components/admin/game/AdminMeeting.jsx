import { Button, Statistic } from "antd";
import { PlayCircleFilled } from "@ant-design/icons";
import { Section } from "../../elements/Section";
import styles from "./AdminMeeting.module.css";
import { useState } from "react";
import { sendWithAck } from "../../../lib/api/sendWithAck";
import { useMessageApi } from "../../../providers/MessageProvider";

export function AdminMeeting({ gameSocket, game }) {
    const message = useMessageApi();

    const activeMeeting = game?.meetings.find((m) => m.is_active);

    const [timeRemaining, setTimeRemaining] = useState(
        activeMeeting?.duration || 0,
    );

    if (!game?.active || !activeMeeting) {
        return <></>;
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return !activeMeeting.is_started ? (
        <Section className={styles.wrapper}>
            <div>
                <h2 style={{ margin: 0 }}>Активное собрание</h2>
                <p style={{ margin: 0, opacity: 0.7 }}>
                    Игроки ожидают в Командном центре
                </p>
            </div>

            <Button
                type="primary"
                danger
                size="large"
                icon={<PlayCircleFilled />}
                onClick={() => {
                    const activeMeeting = game.meetings.find(
                        (m) => m.is_active && !m.is_started,
                    );
                    if (activeMeeting) {
                        sendWithAck(gameSocket, {
                            action: "start_meeting_vote",
                            data: { meeting_id: activeMeeting.id },
                        })
                            .then(() => {
                                message.success("Голосование начато!");
                            })
                            .catch((err) => {
                                message.error("Ошибка: " + err.message);
                            });
                    }
                }}
            >
                Начать собрание
            </Button>
        </Section>
    ) : (
        <Section>
            <Statistic.Timer type="countdown" value={timeRemaining} />
            {formatTime(timeRemaining)}
        </Section>
    );
}
