import styles from "./Home.module.css";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { Section } from "@/components/elements/Section";
import { GameAddUserForm, GameConnectForm } from "@/components/home/Forms";
import { getGame } from "@/components/requests/api_game";

export default function Home() {
	const navigate = useNavigate();

	const [searchParams] = useSearchParams();
	const qpGame = searchParams.get("game");

	const [game, setGame] = useState(null);
	const [player, setPlayer] = useState(null);

	useEffect(() => {
		const setQPGame = async (code) => {
			const game = await getGame(code);
			setGame(game);
		};

		if (qpGame) {
			void setQPGame(qpGame);
		}
	}, []);

	useEffect(() => {
		if (game && localStorage.getItem(game.code)) {
			void navigate(`game/${game.code}`);
		}

		console.log(game);
	}, [game]);

	useEffect(() => {
		if (player && game?.code && !game.active) {
			localStorage.setItem(game.code, player.id);
			void navigate(`game/${game.code}?pId=${player.id}`);
		}
	}, [player]);

	return (
		<Section className={styles.homeStartWrapper}>
			<div className={styles.homeStartTitleWrapper}>
				<h1>Among Us</h1>
				<span>
					{Array.from("Offline Edition").map((char, i) => (
						<div key={`char${i}_${char}`}>{char}</div>
					))}
				</span>
			</div>

			<div>
				{!game?.code ? (
					<GameConnectForm setGame={setGame} />
				) : (
					<GameAddUserForm code={game?.code} setPlayer={setPlayer} />
				)}
			</div>
		</Section>
	);
}
