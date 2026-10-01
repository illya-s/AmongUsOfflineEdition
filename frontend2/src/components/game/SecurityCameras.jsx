import { Button, Modal, Space } from "antd";
import { useState } from "react";
import styles from "./SecurityCameras.module.css";

const CAMERA_LOCATIONS = [
	{ name: "Hallway (Left)", x: 25, y: 50, zoom: 3 },
	{ name: "Hallway (Right)", x: 75, y: 50, zoom: 3 },
	{ name: "Cafeteria", x: 50, y: 25, zoom: 2.5 },
	{ name: "Medbay", x: 30, y: 30, zoom: 4 },
	{ name: "Security", x: 20, y: 70, zoom: 4 },
	{ name: "Navigation", x: 90, y: 50, zoom: 3.5 },
];

export function SecurityCameras({ game, visible, onClose }) {
	const [currentCamIndex, setCurrentCamIndex] = useState(0);
	const cam = CAMERA_LOCATIONS[currentCamIndex];

	const handleNext = () => setCurrentCamIndex((currentCamIndex + 1) % CAMERA_LOCATIONS.length);
	const handlePrev = () => setCurrentCamIndex((currentCamIndex - 1 + CAMERA_LOCATIONS.length) % CAMERA_LOCATIONS.length);

	return (
		<Modal
			title="Система видеонаблюдения"
			open={visible}
			onCancel={onClose}
			footer={null}
			width={800}
			className={styles.modal}
		>
			<div className={styles.cameraContainer}>
				<div className={styles.overlay}>
					<div className={styles.camName}>CAMERA: {cam.name.toUpperCase()}</div>
					<div className={styles.recDot}>● REC</div>
					<div className={styles.static}></div>
				</div>

				<div
					className={styles.feed}
					style={{
						backgroundImage: `url(${game.game_map})`,
						backgroundPosition: `${cam.x}% ${cam.y}%`,
						backgroundSize: `${cam.zoom * 100}%`
					}}
				></div>
			</div>

			<div className={styles.controls}>
				<Space>
					<Button onClick={handlePrev}>Предыдущая</Button>
					<Button type="primary" onClick={handleNext}>Следующая</Button>
				</Space>
			</div>
		</Modal>
	);
}
