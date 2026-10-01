import { useEffect, useRef, useState } from "react";
import { Section } from "../../elements/Section";
import { Button, Slider } from "antd";
import {
    MuteIcon,
    NextIcon,
    PauseIcon,
    PlayIcon,
    PrevIcon,
    StopIcon,
    UnMuteIcon,
} from "../../../assets/icons";

const BG_TRACKS = [
    "/sounds/background/Music Track Abby - Nancy Drew Message in a Haunted Mansion.wav",
    "/sounds/background/Music Track Attic - Nancy Drew Message in a Haunted Mansion.wav",
    "/sounds/background/Music Track Chinese - Nancy Drew Message in a Haunted Mansion.wav",
    "/sounds/background/Music Track DiningStudy - Nancy Drew Message in a Haunted Mansion.wav",
    "/sounds/background/Music Track Entry - Nancy Drew Message in a Haunted Mansion.wav",
    "/sounds/background/Music Track Excite - Nancy Drew Secrets Can Kill REMASTERED.wav",
    "/sounds/background/Music Track Fear Dang - Nancy Drew Secrets Can Kill REMASTERED.wav",
    "/sounds/background/Music Track Ind Dang - Nancy Drew Secrets Can Kill REMASTERED.wav",
    "/sounds/background/Music Track MHM - Nancy Drew Message in a Haunted Mansion.wav",
    "/sounds/background/Music Track Myst Heavy - Nancy Drew Secrets Can Kill REMASTERED.wav",
    "/sounds/background/Music Track Myst Light - Nancy Drew Secrets Can Kill REMASTERED.wav",
    "/sounds/background/Music Track Parlor - Nancy Drew Message in a Haunted Mansion.wav",
    "/sounds/background/Nancy Drew - The Final Scene (Music Theater).wav",
    "/sounds/background/Nancy Drew Ghost Dogs of Moon Lake - Ghosts.wav",
    "/sounds/background/Nancy Drew Ghost Dogs of Moon Lake - Night.wav",
    "/sounds/background/Nancy Drew Ghost Dogs of Moon Lake - Tunnel.wav",
    "/sounds/background/Nancy Drew Soundtracks Ghost of Thornton Hall Ambient_SFX.wav",
    "/sounds/background/Nancy Drew Soundtracks Ghost of Thornton Hall Creep_SFX.wav",
    "/sounds/background/Nancy Drew Soundtracks Ghost of Thornton Hall Rhyme_SFX.wav",
    "/sounds/background/Nancy Drew Soundtracks Warnings at Waverly Academy BlackCat_SFX.wav",
    "/sounds/background/Nancy Drew Soundtracks Warnings at Waverly Academy Hallowell_SFX.wav",
    "/sounds/background/Nancy Drew Soundtracks Warnings at Waverly Academy Waverly_SFX.wav",
];

export function AdminMusic({ game }) {
    const bgRef = useRef(null);
    const sfxRef = useRef(null);

    /* ------------------- volume ------------------- */

    const [masterVol, setMasterVol] = useState(() =>
        Number(localStorage.getItem("vol_master") ?? 0.7),
    );
    const [bgVol, setBgVol] = useState(() =>
        Number(localStorage.getItem("vol_bg") ?? 0.5),
    );
    const [sfxVol, setSfxVol] = useState(() =>
        Number(localStorage.getItem("vol_sfx") ?? 1),
    );

    const [muted, setMuted] = useState(false);

    /* ------------------- bg playlist ------------------- */

    const [trackIndex, setTrackIndex] = useState(0);

    /* ------------------- helpers ------------------- */

    const realVol = (v) => (muted ? 0 : v * masterVol);

    const applyVolumes = () => {
        if (bgRef.current) bgRef.current.volume = realVol(bgVol);
        if (sfxRef.current) sfxRef.current.volume = realVol(sfxVol);
    };

    useEffect(() => {
        applyVolumes();

        localStorage.setItem("vol_master", masterVol);
        localStorage.setItem("vol_bg", bgVol);
        localStorage.setItem("vol_sfx", sfxVol);
    }, [masterVol, bgVol, sfxVol, muted]);

    /* ------------------- fade ------------------- */

    const fade = (audio, target, time = 800) => {
        if (!audio) return;

        const steps = 20;
        const stepTime = time / steps;
        const start = audio.volume;
        const end = realVol(target);
        const diff = (end - start) / steps;

        let i = 0;
        const id = setInterval(() => {
            i++;
            audio.volume += diff;
            if (i >= steps) {
                audio.volume = end;
                clearInterval(id);
            }
        }, stepTime);
    };

    /* ------------------- bg controls ------------------- */

    const playTrack = (i) => {
        const bg = bgRef.current;
        if (!bg) return;

        const next = (i + BG_TRACKS.length) % BG_TRACKS.length;

        fade(bg, 0, 400);

        setTimeout(() => {
            bg.src = BG_TRACKS[next];
            bg.play();
            bg.volume = 0;
            fade(bg, bgVol, 800);
            setTrackIndex(next);
        }, 400);
    };

    const nextTrack = () => playTrack(trackIndex + 1);
    const prevTrack = () => playTrack(trackIndex - 1);

    /* ------------------- autoplay bg ------------------- */

    useEffect(() => {
        const bg = bgRef.current;
        if (!bg) return;

        if (game?.active && !game?.is_ended) {
            playTrack(trackIndex);

            const onEnd = () => nextTrack();
            bg.addEventListener("ended", onEnd);

            return () => bg.removeEventListener("ended", onEnd);
        }
    }, [game?.active, game?.is_ended]);

    /* ------------------- end game sfx ------------------- */

    useEffect(() => {
        if (!game?.is_ended) return;

        let file = null;

        if (game.reason === "all_imposters_ejected")
            file = "/sounds/as_end_game_crew_eject.wav";
        else if (game.reason === "all_tasks_completed")
            file = "/sounds/as_end_game_crew_tasks.wav";
        else if (game.reason === "outnumbered_crew")
            file = "/sounds/as_end_game_imposer_outnumbered.wav";

        if (!file) return;

        fade(bgRef.current, 0, 900);

        setTimeout(() => {
            const sfx = sfxRef.current;
            sfx.src = file;
            sfx.play();
        }, 900);
    }, [game?.is_ended]);

    /* ===================================================== */

    return (
        <Section>
            <audio ref={bgRef} />
            <audio ref={sfxRef} />

            {/* ---------- playlist ---------- */}

            <div style={{ marginBottom: 8 }}>
                🎵 {BG_TRACKS[trackIndex].split("/").pop()}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button
                    onClick={() => sfxRef.current.play()}
                    icon={<PlayIcon />}
                />
                <Button
                    onClick={() => sfxRef.current.pause()}
                    icon={<PauseIcon />}
                />
                <Button
                    onClick={() => {
                        const a = sfxRef.current;
                        a.pause();
                        a.currentTime = 0;
                    }}
                    icon={<StopIcon />}
                />

                <Button onClick={prevTrack} icon={<PrevIcon />} />
                <Button onClick={nextTrack} icon={<NextIcon />} />
                <Button
                    onClick={() => setMuted((m) => !m)}
                    icon={muted ? <MuteIcon /> : <UnMuteIcon />}
                />
            </div>

            {/* ---------- volumes ---------- */}

            <div style={{ marginTop: 15 }}>
                Master
                <Slider
                    min={0}
                    max={100}
                    value={masterVol * 100}
                    onChange={(v) => setMasterVol(v / 100)}
                />
            </div>

            <div>
                Background
                <Slider
                    min={0}
                    max={100}
                    value={bgVol * 100}
                    onChange={(v) => setBgVol(v / 100)}
                />
            </div>

            <div>
                SFX
                <Slider
                    min={0}
                    max={100}
                    value={sfxVol * 100}
                    onChange={(v) => setSfxVol(v / 100)}
                />
            </div>
        </Section>
    );
}
