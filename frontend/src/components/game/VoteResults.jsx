import { Avatar, Card, Modal } from "antd";
import { useEffect, useState } from "react";
import styles from "./VoteResults.module.css";

export function VoteResults({ meeting, players, onClose }) {
	const [visible, setVisible] = useState(true);

	// Calculate vote counts
	const voteCounts = {};
	const votersByTarget = {};
	let skipCount = 0;
	const skipVoters = [];

	if (Array.isArray(meeting?.votes)) {
		meeting.votes.forEach(vote => {
			if (vote.voted_for) {
				const targetId = vote.voted_for.id || vote.voted_for;
				voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
				if (!votersByTarget[targetId]) votersByTarget[targetId] = [];
				votersByTarget[targetId].push(vote.voter);
			} else {
				skipCount++;
				skipVoters.push(vote.voter);
			}
		});
	}

	// Find player with most votes
	let ejectedPlayer = null;
	let maxVotes = 0;
	let isTie = false;

	Object.entries(voteCounts).forEach(([playerId, count]) => {
		if (count > maxVotes) {
			maxVotes = count;
			ejectedPlayer = players.find(p => p.id === parseInt(playerId));
			isTie = false;
		} else if (count === maxVotes) {
			isTie = true;
		}
	});

	// If tie, no one is ejected
	if (isTie) {
		ejectedPlayer = null;
	}

	const handleClose = () => {
		setVisible(false);
		setTimeout(() => onClose?.(), 300);
	};

	useEffect(() => {
		// Auto-close after 10 seconds
		const timer = setTimeout(handleClose, 10000);
		return () => clearTimeout(timer);
	}, []);

	return (
		<Modal
			open={visible}
			onCancel={handleClose}
			footer={null}
			centered
			className={styles.modal}
		>
			<div className={styles.wrapper}>
				<h1>Результаты голосования</h1>

				<div className={styles.voteList}>
					{Object.entries(voteCounts).map(([playerId, count]) => {
						const player = players.find(p => p.id === parseInt(playerId));
						if (!player) return null;

						return (
							<Card key={playerId} className={styles.voteCard}>
								<div className={styles.playerVote}>
									<Avatar size="large">{player.name[0]}</Avatar>
									<div className={styles.voteInfo}>
										<strong>{player.name}</strong>
										<span>{count} {count === 1 ? 'голос' : 'голосов'}</span>
									</div>
								</div>
							</Card>
						);
					})}

					{skipCount > 0 && (
						<Card className={styles.voteCard}>
							<div className={styles.playerVote}>
								<Avatar size="large">⏭️</Avatar>
								<div className={styles.voteInfo}>
									<strong>Пропустили</strong>
									<span>{skipCount} {skipCount === 1 ? 'голос' : 'голосов'}</span>
								</div>
							</div>
						</Card>
					)}
				</div>

				<div className={styles.result}>
					{ejectedPlayer ? (
						<>
							<h2 className={styles.ejected}>
								<span className={styles.ejectedIcon}>🚀</span>
								{ejectedPlayer.name} был изгнан!
							</h2>
							<p className={styles.role}>
								Роль: <strong>{ejectedPlayer.role === "imposter" ? "Предатель" : "Член экипажа"}</strong>
							</p>
						</>
					) : (
						<h2 className={styles.noEjection}>
							{isTie ? "Ничья! Никто не был изгнан." : "Недостаточно голосов. Никто не изгнан."}
						</h2>
					)}
				</div>
			</div>
		</Modal>
	);
}
