import React, { useState } from "react";
import styles from "./Avatar.module.css";

// Вспомогательная функция для генерации стабильного цвета на основе строки
const getRandomColor = (str = "") => {
	const colors = [
		"#e53e3e",
		"#dd6b20",
		"#d69e2e",
		"#38a169",
		"#319795",
		"#3182ce",
		"#805ad5",
		"#d53f8c",
	];
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colors[Math.abs(hash) % colors.length];
};

// Функция для получения 1-2 инициалов из имени (напр. "Иван Иванов" -> "ИИ")
const getInitials = (text = "") => {
	if (!text) return "";
	const words = text.trim().split(/\s+/);
	if (words.length >= 2) {
		return `${words[0][0]}${words[1][0]}`;
	}
	return words[0].slice(0, 2);
};

export const Avatar = ({
	src,
	alt = "Avatar",
	text,
	size = 48,
	square = false,
	backgroundColor,
	className = "",
	style = {},
	...props
}) => {
	const [imageError, setImageError] = useState(false);

	// Формируем текст для отображения (fallback)
	const fallbackText = text ? getInitials(text) : "?";

	// Автоматический или переданный цвет фона
	const bgColor =
		backgroundColor || (text ? getRandomColor(text) : undefined);

	// Вычисляем размер шрифта пропорционально размеру аватарки
	const fontSize = Math.floor(size * 0.4);

	return (
		<div
			className={`${styles.avatar} ${square ? styles.square : ""} ${className}`}
			style={{
				width: `${size}px`,
				height: `${size}px`,
				backgroundColor: !src || imageError ? bgColor : undefined,
				...style,
			}}
			{...props}
		>
			{src && !imageError ? (
				<img
					src={src}
					alt={alt}
					className={styles.image}
					onError={() => setImageError(true)}
				/>
			) : (
				<span
					className={styles.fallback}
					style={{ fontSize: `${fontSize}px` }}
				>
					{fallbackText}
				</span>
			)}
		</div>
	);
};

export default Avatar;
