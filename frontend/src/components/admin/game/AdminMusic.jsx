import { useEffect, useRef, useState } from "react";
import { Section } from "../../elements/Section";
import { Button, Progress, Select } from "antd";
import {
    PauseOutlined,
    PlayCircleOutlined,
    StopOutlined,
} from "@ant-design/icons";

export function AdminMusic({ game }) {
    const audioRef = useRef(null);
    const [audioFile, setAudioFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [devices, setDevices] = useState([]);
    const [outputDeviceId, setOutputDeviceId] = useState("");

    const now = new Date();
    const activeMeeting = game?.meetings?.find((m) => m.is_active);

    // ----------------- Выбор аудио по событию -----------------
    useEffect(() => {
        let file = null;

        if (game?.is_ended) {
            if (game.reason === "all_imposters_ejected")
                file = "/sounds/as_end_game_crew_eject.wav";
            else if (game.reason === "all_tasks_completed")
                file = "/sounds/as_end_game_crew_tasks.wav";
            else if (game.reason === "outnumbered_crew")
                file = "/sounds/as_end_game_imposer_outnumbered.wav";
        }

        // if (game?.active && game.start_time && new Date(game.start_time) > now)
        //     file = "/sounds/as_pre_start.wav";
        // if (game?.active && game.start_time && new Date(game.start_time) <= now)
        //     file = "/sounds/as_start.mp3";

        // if (game?.active && activeMeeting) file = "/sounds/as_report.wav";

        // const emergencyBlocked = game?.emergency_meetings_blocked_until
        //     ? new Date(game.emergency_meetings_blocked_until) > now
        //     : false;
        // const tasksBlocked = game?.tasks_blocked_until
        //     ? new Date(game.tasks_blocked_until) > now
        //     : false;

        // if (emergencyBlocked) file = "/sounds/as_sabotage_emergency.wav";
        // else if (tasksBlocked) file = "/sounds/as_sabotage_tasks.wav";
        // else if (!emergencyBlocked && !tasksBlocked)
        //     file = "/sounds/as_sabotage_release.wav";

        setAudioFile(file);
    }, [game, activeMeeting]);

    // ----------------- Проигрывание аудио -----------------
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioFile) return;

        audio.src = audioFile;
        audio
            .play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.log("Audio play failed:", e));

        const updateProgress = () => setProgress(audio.currentTime);
        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", () =>
            setDuration(audio.duration),
        );

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
        };
    }, [audioFile]);

    // ----------------- Управление -----------------
    const handlePlay = () => {
        audioRef.current.play();
        setIsPlaying(true);
    };

    const handlePause = () => {
        audioRef.current.pause();
        setIsPlaying(false);
    };

    const handleStop = () => {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        audio.currentTime = e.target.value;
        setProgress(audio.currentTime);
    };

    // ----------------- Получение устройств вывода -----------------
    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then((devs) => {
                const outputs = devs.filter((d) => d.kind === "audiooutput");
                setDevices(outputs);
                if (outputs.length) setOutputDeviceId(outputs[0].deviceId);
            });
        }
    }, []);

    // ----------------- Смена устройства вывода -----------------
    useEffect(() => {
        const audio = audioRef.current;
        if (audio && outputDeviceId && audio.setSinkId) {
            audio
                .setSinkId(outputDeviceId)
                .catch((e) => console.log("setSinkId failed:", e));
        }
    }, [outputDeviceId]);

    return (
        <Section>
            <audio ref={audioRef} />
            <div>
                <strong>Текущий трек:</strong>{" "}
                {audioFile?.split("/").pop() || "Нет"}
            </div>
            <div>
                <Progress value={(duration / progress) * 100} />
                {/* <progress
                    value={}
                    max={duration}
                    style={{ width: "100%" }}
                />*/}
                <div>
                    {Math.floor(progress)} / {Math.floor(duration)} сек
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "row", gap: "10px", marginTop: "10px" }}>
                {isPlaying ? (
                    <Button onClick={handlePause} icon={<PauseOutlined />} />
                ) : (
                    <Button
                        onClick={handlePlay}
                        icon={<PlayCircleOutlined />}
                    />
                )}

                <Button onClick={handleStop} icon={<StopOutlined />} />

                <Select
                    options={devices.map((d) => {
                        return {
                            value: d.deviceId,
                            label: d.label || "Неизвестное устройство",
                        };
                    })}
                />
            </div>
        </Section>
    );
}
