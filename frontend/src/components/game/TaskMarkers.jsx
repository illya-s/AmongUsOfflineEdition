import { colorFromNumber } from "@/lib/client/colorFromNumber";
import { buildShortestRoute, orderWaypointsByShortestRoute } from "@/lib/map/route";

export function TaskMarkers({ task, editable = false, onPointPointerDown }) {
    const points = orderWaypointsByShortestRoute(task?.points || []);
    if (points.length === 0) return null;

    const color = colorFromNumber(task.id);
    const size = Math.min(3, Math.max(0.5, Number(task.size) || 1));
    const markerRadius = 13 * size;
    const taskNumber = task.sequence_number ?? task.id;
    const markerId = `task-arrow-${task.id}`;
    const route = buildShortestRoute(points, markerRadius);

    return (
        <g
            aria-label={`Задание ${taskNumber}`}
            pointerEvents={editable ? "auto" : "none"}
        >
            {route.length > 0 && (
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
                    {route.map((segment, index) => (
                        <line
                            key={`route-${task.id}-${index}`}
                            {...segment}
                            stroke={color}
                            strokeWidth="4"
                            strokeLinecap="round"
                            markerEnd={
                                index === route.length - 1
                                    ? `url(#${markerId})`
                                    : undefined
                            }
                        />
                    ))}
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
