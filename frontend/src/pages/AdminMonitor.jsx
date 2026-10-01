import { useParams } from "react-router";

import { Section } from "../components/elements/Section";
import { useGameSocket } from "../lib/api/useGameSocket";
import { Progress, Spin, theme } from "antd";
import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { Player } from "../components/game/Player";

import styles from "./AdminMonitor.module.css";
import { LoadingOutlined } from "@ant-design/icons";
import List from "../components/admin/game/List";
import { AliveIcon, GhostIcon } from "../assets/icons";
import { WinScreen } from "../components/game/WinScreen";

function QRCode({ code, image }) {
    const { token } = theme.useToken();
    const ref = useRef(null);

    useEffect(() => {
        ref.current.innerHTML = "";

        const qrCode = new QRCodeStyling({
            width: 512,
            height: 512,
            data: `${window.location.origin}/?game=${code}`,
            image: image,
            backgroundOptions: {
                color: "transparent",
            },
            dotsOptions: {
                color: token.colorPrimary,
                type: "rounded",
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 20,
            },
        });

        qrCode.append(ref.current);
    }, []);

    return <div ref={ref} />;
}

export default function AdminMonitor() {
    const { code } = useParams();
    const { game, players } = useGameSocket(code);

    if (game?.is_ended) {
        return <WinScreen game={game} players={players} />;
    }

    return !game?.active ? (
        <Section className={styles.wrapper}>
            <div className={styles["main-wrapper"]}>
                <div className={styles.title}>
                    <Spin
                        indicator={
                            <LoadingOutlined style={{ fontSize: 32 }} spin />
                        }
                    />

                    <span>Ожидпние старта игры</span>
                </div>

                <div className={styles["player-list"]}>
                    {players?.map((player) => (
                        <Player key={`player_${player.id}`} player={player} />
                    ))}
                </div>
            </div>

            <QRCode code={game?.code} />
        </Section>
    ) : (
        <Section className={styles["wrapper-start"]}>
            <Progress
                percent={game?.progress}
                status="active"
                size={[null, 30]}
                strokeColor={{ from: "#108ee9", to: "#87d068" }}
            />

            <List
                className={styles["start-player-list"]}
                dataSource={players}
                renderItem={(player) => (
                    <div className={styles.player}>
                        {player.is_alive ? <AliveIcon /> : <GhostIcon />}

                        {player.name}
                    </div>
                )}
            />
        </Section>
    );
}
