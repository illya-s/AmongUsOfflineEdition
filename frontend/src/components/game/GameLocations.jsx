export function GameLocations({
    locations,
    editable = false,
    selectedId = null,
    onPointerDown,
}) {
    if (!Array.isArray(locations)) return null;

    return locations.map((location) => {
        const fontSize = Math.min(
            200,
            Math.max(6, Number(location.font_size) || 13),
        );
        const rotation = Number(location.rotation) || 0;
        const textAnchor = {
            left: "start",
            center: "middle",
            right: "end",
        }[location.text_align || "center"];
        const dominantBaseline = {
            top: "hanging",
            middle: "central",
            bottom: "text-after-edge",
        }[location.vertical_align || "middle"];
        const lines = String(location.name).split("\n");
        const lineHeight = Number(location.line_height) || fontSize * 1.2;
        return (
            <text
                key={`location-${location.id}`}
                x={location.x}
                y={location.y}
                transform={`rotate(${rotation} ${location.x} ${location.y})`}
                pointerEvents={editable ? "auto" : "none"}
                onPointerDown={(event) => onPointerDown?.(event, location)}
                style={{
                    cursor: editable ? "grab" : "default",
                    userSelect: "none",
                }}
                fill={selectedId === location.id ? "#1677ff" : "#111827"}
                stroke="white"
                strokeWidth="3"
                paintOrder="stroke"
                fontSize={fontSize}
                letterSpacing={Number(location.letter_spacing) || 0}
                fontWeight="700"
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
            >
                {lines.map((line, index) => (
                    <tspan
                        key={`${line}-${index}`}
                        x={location.x}
                        dy={index === 0 ? 0 : lineHeight}
                    >
                        {line}
                    </tspan>
                ))}
            </text>
        );
    });
}
