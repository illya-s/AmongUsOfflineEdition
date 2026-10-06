import { useState } from "react";

import { Copy, LinkIcon } from "@/assets/icons"

import styles from "./CopyLink.module.css";

const CopyLink = ({ href, children }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async (e) => {
		e.preventDefault();

		const fullUrl = `${window.location.origin}${href}`;

		try {
			await navigator.clipboard.writeText(fullUrl);
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
