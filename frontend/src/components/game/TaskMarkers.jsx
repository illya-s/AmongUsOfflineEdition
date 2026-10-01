import { colorFromNumber } from "../../lib/client/colorFromNumber";

const MARKER_RADIUS = 13;

function shortenedLine(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (!distance) return null;

    const ux = dx / distance;
    const uy = dy / distance;
    return {
        x1: from.x + ux * MARKER_RADIUS,
        y1: from.y + uy * MARKER_RADIUS,
        x2: to.x - ux * (MARKER_RADIUS + 5),
        y2: to.y - uy * (MARKER_RADIUS + 5),
    };
}

export function TaskMarkers({ task }) {
    const points = Array.isArray(task?.points) ? task.points.slice(0, 2) : [];
    if (points.length === 0) return null;

    const color = colorFromNumber(task.id);
    const taskNumber = task.sequence_number ?? task.id;
    const markerId = `task-arrow-${task.id}`;
    const line =
        points.length === 2 ? shortenedLine(points[0], points[1]) : null;

    return (
        <g aria-label={`Задание ${taskNumber}`} pointerEvents="none">
            {line && (
                <>
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
                    <line
                        {...line}
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        markerEnd={`url(#${markerId})`}
                    />
                </>
            )}

            {points.map((point, index) => (
                <g key={`${point.x}-${point.y}-${index}`}>
                    <circle
                        cx={point.x}
                        cy={point.y}
                        r={MARKER_RADIUS}
                        fill={color}
                        stroke="white"
                        strokeWidth="2"
                    />
                    <text
                        x={point.x}
                        y={point.y}
                        fill="white"
                        fontSize="11"
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="central"
                    >
                        {taskNumber}
                    </text>
                </g>
            ))}
        </g>
    );
}
