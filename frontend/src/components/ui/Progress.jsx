import React from "react";
import styles from "./Progress.module.css";

export const Progress = ({ value = 0, max = 100, showLabel = true }) => {
	const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
	const isFull = percentage === 100;

	return (
		<div
			className={styles.progressContainer}
			role="progressbar"
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={max}
		>
			<div
				className={`${styles.progressBar} ${isFull ? styles.full : ""}`}
				style={{ width: `${percentage}%` }}
			/>
			{showLabel && (
				<span className={styles.progressText}>
					{Math.round(percentage)}%
				</span>
			)}
		</div>
	);
};

export default Progress;
