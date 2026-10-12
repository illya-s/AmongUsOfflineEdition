import { useState } from "react";

import { Copy, LinkIcon } from "@/assets/icons"

import styles from "./CopyLink.module.css";

const copyText = async (text) => {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return;
		} catch {
			// Clipboard API can be present but unavailable due to browser permissions.
		}
	}

	const textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.setAttribute("readonly", "");
	textArea.style.position = "fixed";
	textArea.style.left = "-9999px";
	document.body.appendChild(textArea);
	textArea.select();
	textArea.setSelectionRange(0, text.length);

	try {
		if (!document.execCommand("copy")) {
			throw new Error("Браузер не поддерживает копирование в буфер обмена");
		}
	} finally {
		textArea.remove();
	}
};

const CopyLink = ({ href, children }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async (e) => {
		e.preventDefault();

		const fullUrl = `${window.location.origin}${href}`;

		try {
			await copyText(fullUrl);
			setCopied(true);

			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Ошибка при копировании:", err);
		}
	};

	return (
		<button
			className={styles.link}
			onClick={handleCopy}
			title={copied ? "Скопировано!" : "Скопировать ссылку"}
		>
			{!copied ? children : (<Copy />)}
		</button>
	);
};

export default CopyLink;
