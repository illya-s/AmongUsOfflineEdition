export function GameLocations({
    locations,
    editable = false,
    selectedId = null,
    onPointerDown,
}) {
    if (!Array.isArray(locations)) return null;

    return locations.map((location) => {
        const size = Math.min(3, Math.max(0.5, Number(location.size) || 1));
        return (
        <g
            key={`location-${location.id}`}
            transform={`translate(${location.x} ${location.y})`}
            pointerEvents={editable ? "auto" : "none"}
            onPointerDown={(event) => onPointerDown?.(event, location)}
            style={{ cursor: editable ? "grab" : "default" }}
        >
            <circle
                r={7 * size}
                fill={selectedId === location.id ? "#1677ff" : "#111827"}
                stroke="white"
                strokeWidth="2"
            />
            <text
                y={-12 * size}
                fill="#111827"
                stroke="white"
                strokeWidth="3"
                paintOrder="stroke"
                fontSize={13 * size}
                fontWeight="700"
                textAnchor="middle"
            >
                {location.name}
            </text>
        </g>
        );
    });
}
