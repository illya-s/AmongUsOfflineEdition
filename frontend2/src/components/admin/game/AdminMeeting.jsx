import { Avatar, Button, Statistic } from "antd";
import { PlayCircleFilled } from "@ant-design/icons";
import { Section } from "../../elements/Section";
import styles from "./AdminMeeting.module.css";
import { sendWithAck } from "../../../lib/api/sendWithAck";
import { useMessageApi } from "../../../providers/MessageProvider";
import { WarningIcon } from "../../../assets/icons";
import List from "./List";

export function AdminMeeting({ gameSocket, game }) {
    const message = useMessageApi();

    const activeMeeting = game?.meetings.find((m) => m.is_active);
    const activeMeetingId = activeMeeting?.id;

    return (
        <Section className={styles.wrapper}>
            <div className={styles["top-wrapper"]}>
                <h2 className={styles["top-wrapper-title"]}>Meetings</h2>

                <Statistic.Timer
                    type="countdown"
                    value={game?.meeting_cooldown_until}
                />

                <button
                    className={`${styles["emergency-button"]} ${
                        !game?.active ||
                        (game?.meeting_cooldown_until &&
                            new Date(game.meeting_cooldown_until).getTime() >
                                Date.now())
                            ? styles.disabled
                            : ""
                    }`}
                    onClick={() => {
                        sendWithAck(gameSocket, {
                            action: "start_emergency_meeting",
                        });
                    }}
                    disabled={
                        !game?.active ||
                        (game?.meeting_cooldown_until &&
                            new Date(game.meeting_cooldown_until).getTime() >
                                Date.now())
                    }
                >
                    <WarningIcon />
                </button>
            </div>

            <List
                dataSource={game?.meetings}
                renderItem={(meeting) => (
                    <div
                        key={`meeting_${meeting.id}`}
                        className={styles.meeting}
                    >
                        <Avatar>{meeting.id}</Avatar>

                        <span>{meeting.type}</span>
                        <span>
                            {meeting.id == activeMeetingId ? (
                                <Statistic.Timer
                                    type="countup"
                                    value={meeting.started_at}
                                />
                            ) : (
                                <Statistic.Timer
                                    type="countdown"
                                    value={meeting.started_at}
                                />
                            )}
                        </span>

                        <div className={styles["meeting-start-wrapper"]}>
                            {meeting.id == activeMeetingId ? (
                                <button
                                    className={styles["meeting-start-button"]}
                                    onClick={() => {
                                        const activeMeeting =
                                            game.meetings.find(
                                                (m) =>
                                                    m.is_active &&
                                                    !m.is_started,
                                            );
                                        if (activeMeeting) {
                                            sendWithAck(gameSocket, {
                                                action: "start_meeting_vote",
                                                data: {
                                                    meeting_id:
                                                        activeMeeting.id,
                                                },
                                            }).catch((err) => {
                                                message.error(
                                                    "Ошибка: " + err.message,
                                                );
                                            });
                                        }
                                    }}
                                    disabled={meeting.id != activeMeetingId}
                                >
                                    <PlayCircleFilled />
                                </button>
                            ) : (
                                <div></div>
                            )}

                            <span className={styles["meeting-start-status"]}>
                                {meeting.ended_at
                                    ? "Окончено"
                                    : meeting.is_started
                                      ? "Начато"
                                      : "Не начато"}
                            </span>
                        </div>
                    </div>
                )}
            />
        </Section>
    );

    return !activeMeeting.is_started ? (
        <Section className={styles.wrapper}>
            <div>
                <h2 style={{ margin: 0 }}>Активное собрание</h2>
                <p style={{ margin: 0, opacity: 0.7 }}>
                    Игроки ожидают в Командном центре
                </p>
            </div>
        </Section>
    ) : (
        <Section></Section>
    );
}
