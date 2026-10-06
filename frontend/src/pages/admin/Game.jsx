import "./Game.css";
import styles from "./Game.module.css";

import { useEffect, useState } from "react";

import { Progress } from "@/components/ui";
import Aside from "@/components/elements/admin/Aside";

import { RobotFilled, ToolFilled } from "@ant-design/icons";
import { Switch, theme } from "antd";

import QRCodeStyling from "qr-code-styling";
import { useParams } from "react-router";

import { useRef } from "react";
import List from "@/components/admin/game/List";
import Player from "@/components/admin/game/Player";
import Task from "@/components/admin/game/Task";
import { Section } from "@/components/elements/Section";
import { sendWithAck } from "@/lib/api/sendWithAck";
import { useGameSocket } from "@/lib/api/useGameSocket";
import { AdminMeeting } from "@/components/admin/game/AdminMeeting";

function QRCode({ code, image }) {
	const { token } = theme.useToken();
	const ref = useRef(null);

	useEffect(() => {
		ref.current.innerHTML = "";

		const qrCode = new QRCodeStyling({
			width: 300,
			height: 300,
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

export default function AdminGame() {
	const { code } = useParams();

	const { gameSocket, game, players, tasks } = useGameSocket(code);

	const [isLoadingAutoMode, setIsLoadingAutoMode] = useState(false);

	return (
		<div className={styles.wrapper}>
			<Aside gameSocket={gameSocket} game={game} />

			<div className={styles.content}>
				<Progress value={game?.progress} />

				<AdminMeeting gameSocket={gameSocket} game={game} />

				<Section className="admin-game-middle-container">
					<div className="admin-game-middle-top">
						<h2>Players</h2>

						<label
							className="top-edit-switch-wrapper"
							title="Авто / Ручное назначение ролей"
						>
							{game?.auto_assign_role ? (
								<span>Auto</span>
							) : (
								<span>Manual</span>
							)}

							<Switch
								value={game?.auto_assign_role}
								loading={isLoadingAutoMode}
								onChange={(checked) => {
									setIsLoadingAutoMode(true);
									sendWithAck(gameSocket, {
										action: "toggle_auto_assign_role",
										data: { value: checked },
									})
										.then((req) => {})
										.catch((err) => {})
										.finally(() => {
											setIsLoadingAutoMode(false);
										});
								}}
								unCheckedChildren={<ToolFilled />}
								checkedChildren={<RobotFilled />}
								disabled={game?.active}
							/>
						</label>
					</div>

					<List
						dataSource={players}
						renderItem={(player) => (
							<Player
								key={`player_${player.id}`}
								player={player}
								game={game}
								gameSocket={gameSocket}
								editable={!game?.auto_assign_role}
								delete
							/>
						)}
					/>
				</Section>

				<Section className="admin-game-middle-container">
					<div className="admin-game-middle-top">
						<h2>Tasks</h2>
					</div>

					<List
						className="admin-game-middle-task-list"
						dataSource={tasks}
						renderItem={(task) => (
							<Task key={`task_${task.id}`} task={task} />
						)}
					/>
				</Section>
			</div>
		</div>
	);
}
