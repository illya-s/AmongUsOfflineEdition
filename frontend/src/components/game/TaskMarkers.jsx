import { useEffect, useState } from "react";

import { colorFromNumber } from "@/lib/client/colorFromNumber";
import { buildMapAwareRoute, orderWaypointsByShortestRoute } from "@/lib/map/route";

function getOrderedPoints(task) {
	return orderWaypointsByShortestRoute(task?.points || []);
}

export function MapSvgLayer({ mapUrl, width, height }) {
	if (!mapUrl) return null;
	return (
		<image
			href={mapUrl}
			x="0"
			y="0"
			width={width || "100%"}
			height={height || "100%"}
			preserveAspectRatio="xMidYMid meet"
		/>
	);
}

export function TaskRoute({ task, mapUrl = null, mapWidth = 0, mapHeight = 0 }) {
	const [routePoints, setRoutePoints] = useState(null);

	useEffect(() => {
		let isMounted = true;
		const ordered = getOrderedPoints(task);

		if (!ordered.length) {
			setRoutePoints([]);
			return undefined;
		}

		if (!mapUrl || !mapWidth || !mapHeight) {
			setRoutePoints([]);
			return undefined;
		}

		setRoutePoints(null);
		void buildMapAwareRoute({
			points: ordered,
			mapUrl,
			width: mapWidth,
			height: mapHeight,
		}).then((result) => {
			if (isMounted) {
				setRoutePoints(result);
			}
		});

		return () => {
			isMounted = false;
		};
	}, [task, mapUrl, mapWidth, mapHeight]);

	const points = routePoints;
	if (!points || points.length < 2) return null;

	const color = colorFromNumber(task.id);
	const markerId = `task-arrow-${task.id}`;

	return (
		<g aria-label={`Маршрут задания ${task.sequence_number ?? task.id}`}>
			<defs>
				<marker
					id={markerId}
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="7"
					markerHeight="7"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
				</marker>
			</defs>

			<polyline
				points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
				stroke={color}
				strokeWidth="4"
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="none"
				markerEnd={`url(#${markerId})`}
			/>
		</g>
	);
}

export function TaskEndpoints({ task, editable = false, onPointPointerDown }) {
	const points = getOrderedPoints(task);
	if (points.length === 0) return null;

	const color = colorFromNumber(task.id);
	const size = Math.min(3, Math.max(0.5, Number(task.size) || 1));
	const markerRadius = 13 * size;
	const taskNumber = task.sequence_number ?? task.id;
	const start = points[0];
	const end = points[points.length - 1];

	return (
		<g aria-label={`Задание ${taskNumber}`} pointerEvents={editable ? "auto" : "none"}>
			{[start, end].map((point, index) => (
				<g key={`${task.id}-${index}`}>
					<circle
						cx={point.x}
						cy={point.y}
						r={markerRadius}
						fill={color}
						stroke="white"
						strokeWidth="2"
					/>
					<text
						x={point.x}
						y={point.y}
						fill="white"
						fontSize={11 * size}
						fontWeight="700"
						textAnchor="middle"
						dominantBaseline="central"
						onPointerDown={(event) => onPointPointerDown?.(event, task, index)}
						style={{ cursor: editable ? "pointer" : "default" }}
					>
						{taskNumber}
					</text>
				</g>
			))}
		</g>
	);
}

export function TaskMarkers(props) {
	return <TaskEndpoints {...props} />;
}
