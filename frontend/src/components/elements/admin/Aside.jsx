"use client";

import styles from "./Aside.module.css";

import React, { useState, useEffect } from "react";
import { Link } from "react-router";

import { GameLocations } from "@/components/game/GameLocations";
import { MapSvgLayer, TaskEndpoints, TaskRoute } from "@/components/game/TaskMarkers";

import { Avatar, CopyLink } from "@/components/ui";
import { AdminMusic } from "@/components/admin/game/AdminMusic";

import { sendWithAck } from "@/lib/api/sendWithAck";

import { MonitorIcon, TasksIcon, MapIcon } from "@/assets/icons";
import {
	DeleteFilled,
	PauseCircleFilled,
	PictureFilled,
	PlayCircleFilled,
} from "@ant-design/icons";

import { Badge, Button, Modal, Statistic, Upload } from "antd";

const Aside = ({ gameSocket, game }) => {
	const [isMapModalVisible, setIsMapModalVisible] = useState(false);
	const [isUploadingMap, setIsUploadingMap] = useState(false);
	const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		if (game?.game_map) {
			const img = new Image();
			img.src = game.game_map;
			img.onload = () => {
				setMapDimensions({
					width: img.naturalWidth,
					height: img.naturalHeight,
				});
			};
		}
	}, [game?.game_map]);

	const handleMapUpload = (file) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const base64 = e.target.result;
			setIsUploadingMap(true);
			sendWithAck(gameSocket, {
				action: "change_map",
				data: { game_map: base64 },
			})
				.then(() => {
					message.success("Карта успешно обновлена");
					setIsMapModalVisible(false);
				})
				.catch((err) => {
					message.error(`Ошибка: ${err.message}`);
				})
				.finally(() => {
					setIsUploadingMap(false);
				});
		};
		reader.readAsDataURL(file);
		return false;
	};

	const handleToggleGame = () => {
		sendWithAck(gameSocket, {
			action: "change_game",
			data: { value: !game?.active },
		}).catch((exc) => {
			console.error(`${exc.code}: ${exc.message}`);
		});
	};

	const handleRemoveGame = () => {
		api
			.delete(`games/${game?.code}/`)
			.then(() => {
				gameSocket.close();
				navigate("/admin/");
			})
			.catch((exc) => {
				console.error(exc);
			});
	};

	return (
		<div className={styles.aside}>
			<div className={styles["title-wrapper"]}>
				<Avatar text={String(game?.id)} size={40} />

				<div className={styles["title-content"]}>
					<h1 className={styles["title-title"]}>{game?.name}</h1>
					<p className={styles["title-code"]}>{game?.code}</p>
				</div>
			</div>

			<nav className={styles["nav"]}>
				<Button
					variant="solid"
					color={!game?.active ? "primary" : "green"}
					shape="circle"
					size="middle"
					icon={
						!game?.active ? <PlayCircleFilled size="large" /> : <PauseCircleFilled size="large" />
					}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						handleToggleGame();
					}}
				/>

				<Button
					icon={<PictureFilled />}
					onClick={() => setIsMapModalVisible(true)}
					disabled={game?.active}
					title="Изменить карту"
				/>

				<div>
					<Badge
						color={game?.active && !game?.is_ended ? "green" : "red"}
						text={game?.active ? (!game?.is_ended ? "Активна" : "Завершена") : "Не активна"}
					/>

					{game?.active && !game?.is_ended && (
						<Statistic.Timer type="countup" value={new Date(game?.start_time).getTime()} />
					)}
				</div>

				<Button
					variant="solid"
					color="danger"
					shape="circle"
					size="middle"
					icon={<DeleteFilled />}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						handleRemoveGame(game.code);
					}}
					disabled={game?.active}
				/>

				<Modal
					title="Изменить карту"
					open={isMapModalVisible}
					onCancel={() => setIsMapModalVisible(false)}
					footer={null}
					destroyOnHidden
				>
					<Upload.Dragger
						accept="image/*"
						beforeUpload={handleMapUpload}
						showUploadList={false}
						disabled={isUploadingMap}
					>
						<p className="ant-upload-drag-icon">
							<PictureFilled />
						</p>
						<p className="ant-upload-text">
							Нажмите или перетащите изображение для обновления карты
						</p>
					</Upload.Dragger>
				</Modal>
				<CopyLink href={`/admin/game/${game?.code}/monitor`}>
					<MonitorIcon />
				</CopyLink>

				<CopyLink href={`/admin/game/${game?.code}/tasks`}>
					<TasksIcon />
				</CopyLink>

				<CopyLink href={`/admin/game/${game?.code}/map`}>
					<MapIcon />
				</CopyLink>
			</nav>

			<AdminMusic game={game} />

			<Link to={`/admin/game/${game?.code}/map`} target="_blank">
				<svg
					style={{
						maxHeight: "500px",
					}}
					viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
				>
					<MapSvgLayer
						mapUrl={game?.game_map}
						width={mapDimensions.width}
						height={mapDimensions.height}
					/>
					<GameLocations locations={game?.locations} />

					{Array.isArray(game?.tasks) &&
						game?.tasks.map((task) => {
							if (!task) return null;
							return (
								<React.Fragment key={`svg_task_${task.id}`}>
									<TaskRoute
										task={task}
										mapUrl={game?.game_map}
										mapWidth={mapDimensions.width}
										mapHeight={mapDimensions.height}
									/>
									<TaskEndpoints task={task} />
								</React.Fragment>
							);
						})}
				</svg>
			</Link>
		</div>
	);
};

export default Aside;
