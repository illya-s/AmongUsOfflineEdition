import { Avatar, Button, Card, Progress } from "antd";
import { useEffect, useState } from "react";
import { sendWithAck } from "../../lib/api/sendWithAck";
import styles from "./MeetingScreen.module.css";

export function MeetingScreen({
    gameSocket,
    meeting,
    players,
    player,
    setShowResults,
    onMeetingEnd,
}) {
    const [timeRemaining, setTimeRemaining] = useState(meeting?.duration || 0);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    const playerVote = meeting?.votes?.find((v) => v.voter === player.id);
    const hasVoted = !!playerVote;

    useEffect(() => {
        if (!meeting || !meeting.is_started) return;

        const timer = setInterval(() => {
            const elapsed =
                (Date.now() - new Date(meeting.started_at).getTime()) / 1000;
            const remaining = Math.max(0, meeting.duration - elapsed);
            setTimeRemaining(Math.floor(remaining));

            if (remaining <= 0) {
                clearInterval(timer);
                onMeetingEnd?.();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [meeting, onMeetingEnd]);

    useEffect(() => {
        if (meeting?.is_active === false && meeting?.ended_at) {
            const timer = setTimeout(() => {
                setShowResults(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [meeting?.is_active, meeting?.ended_at, setShowResults]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleVote = async (votedForId = null) => {
        if (hasVoted) return;

        try {
            await sendWithAck(gameSocket, {
                action: "submit_vote",
                data: {
                    meeting_id: meeting.id,
                    voted_for_id: votedForId,
                },
            });
            // hasVoted will be updated via WebSocket broadcast
        } catch (error) {
            console.error("Failed to submit vote:", error);
        }
    };

    const alivePlayers = Array.isArray(players)
        ? players.filter((p) => p.is_alive && p.id !== player.id)
        : [];

    const meetingType =
        meeting?.type === "emergency"
            ? "Экстренное собрание"
            : "Обнаружение тела";

    const callerName = meeting?.called_by?.name || "Неизвестно";

    if (!meeting?.is_started) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <h1>{meetingType}</h1>
                    <p>Созвано: {callerName}</p>
                    {meeting?.reported_player && (
                        <p className={styles.reported}>
                            Тело: {meeting.reported_player.name}
                        </p>
                    )}
                </div>

                <div className={styles.waitingContainer}>
                    <h2>Пройдите в Командный центр</h2>
                    <p>Ожидание начала обсуждения...</p>
                    <div className={styles.waitingAnimation}>
                        <Progress
                            percent={100}
                            status="active"
                            showInfo={false}
                            strokeColor="#1890ff"
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (meeting?.is_active == false && meeting?.ended_at) {
        return (
            <VoteResults
                meeting={latestMeeting}
                players={players}
                onClose={() => setShowResults(false)}
            />
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1>{meetingType}</h1>
                <p>Созвано: {callerName}</p>
                {meeting?.reported_player && (
                    <p className={styles.reported}>
                        Тело: {meeting.reported_player.name}
                    </p>
                )}
            </div>

            <div className={styles.timer}>
                <Progress
                    type="circle"
                    percent={(timeRemaining / meeting.duration) * 100}
                    format={() => formatTime(timeRemaining)}
                    strokeColor={timeRemaining < 30 ? "#ff4d4f" : "#1890ff"}
                />
            </div>

            <div className={styles.votingSection}>
                <h2>Голосование</h2>
                {hasVoted ? (
                    <div className={styles.votedMessage}>
                        <p>✅ Вы проголосовали</p>
                        <p>
                            За:{" "}
                            {playerVote.voted_for
                                ? players.find(
                                      (p) => p.id === playerVote.voted_for,
                                  )?.name || "..."
                                : "Skip"}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.playerList}>
                            {alivePlayers.map((p) => (
                                <Card
                                    key={p.id}
                                    className={`${styles.playerCard} ${selectedPlayer === p.id ? styles.selected : ""}`}
                                    onClick={() => setSelectedPlayer(p.id)}
                                    hoverable
                                >
                                    <div className={styles.playerInfo}>
                                        <Avatar size="large">
                                            {p.name[0]}
                                        </Avatar>
                                        <span>{p.name}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className={styles.voteButtons}>
                            <Button
                                type="primary"
                                danger
                                size="large"
                                disabled={!selectedPlayer}
                                onClick={() => handleVote(selectedPlayer)}
                            >
                                Проголосовать за{" "}
                                {alivePlayers.find(
                                    (p) => p.id === selectedPlayer,
                                )?.name || "..."}
                            </Button>
                            <Button
                                size="large"
                                onClick={() => handleVote(null)}
                            >
                                Пропустить голосование
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
