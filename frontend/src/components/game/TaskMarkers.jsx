import { colorFromNumber } from "../../lib/client/colorFromNumber";

function shortenedLine(from, to, radius) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (!distance) return null;

    const ux = dx / distance;
    const uy = dy / distance;
    return {
        x1: from.x + ux * radius,
        y1: from.y + uy * radius,
        x2: to.x - ux * (radius + 5),
        y2: to.y - uy * (radius + 5),
    };
}

export function TaskMarkers({ task, editable = false, onPointPointerDown }) {
    const points = Array.isArray(task?.points) ? task.points.slice(0, 2) : [];
    if (points.length === 0) return null;

    const color = colorFromNumber(task.id);
    const size = Math.min(3, Math.max(0.5, Number(task.size) || 1));
    const markerRadius = 13 * size;
    const taskNumber = task.sequence_number ?? task.id;
    const markerId = `task-arrow-${task.id}`;
    const line =
        points.length === 2
            ? shortenedLine(points[0], points[1], markerRadius)
            : null;

    return (
        <g
            aria-label={`Задание ${taskNumber}`}
            pointerEvents={editable ? "auto" : "none"}
        >
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
                        onPointerDown={(event) =>
                            onPointPointerDown?.(event, task, index)
                        }
                        style={{ cursor: editable ? "pointer" : "default" }}
                    >
                        {taskNumber}
                    </text>
                </g>
            ))}
        </g>
    );
}
