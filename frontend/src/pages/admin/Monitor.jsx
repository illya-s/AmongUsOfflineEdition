import { useParams } from "react-router";

import { useGameSocket } from "@/lib/api/useGameSocket";
import { Spin } from "antd";

import { Progress } from "@/components/ui";

import { Player } from "@/components/game/Player";
import GameQRCode from "@/components/ui/GameQRCode";

import styles from "./Monitor.module.css";

import { LoadingOutlined } from "@ant-design/icons";
import List from "@/components/admin/game/List";
import { AliveIcon, GhostIcon } from "@/assets/icons";
import { WinScreen } from "@/components/game/WinScreen";

export default function AdminMonitor() {
	const { code } = useParams();
	const { game, players } = useGameSocket(code);

	if (game?.is_ended) {
		return <WinScreen game={game} players={players} />;
	}

	return !game?.active ? (
		<div className={styles.wrapper}>
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

			<GameQRCode code={game?.code} size={512} />
		</div>
	) : (
		<div className={styles["wrapper-start"]}>
			<Progress value={game?.progress} />

			<div className={styles["player-list"]}>
				{players.map((player) => (
					<Player
						key={`player_${player.id}`}
						player={player}
						size="large"
						icon={player.is_alive ? <AliveIcon /> : <GhostIcon />}
					/>
				))}
			</div>
		</div>
	);
}
