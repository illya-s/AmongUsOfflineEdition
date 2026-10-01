export function GameLocations({ locations }) {
    if (!Array.isArray(locations)) return null;

    return locations.map((location) => (
        <g
            key={`location-${location.id}`}
            transform={`translate(${location.x} ${location.y})`}
            pointerEvents="none"
        >
            <circle r="5" fill="#111827" stroke="white" strokeWidth="2" />
            <text
                y="-10"
                fill="#111827"
                stroke="white"
                strokeWidth="3"
                paintOrder="stroke"
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
            >
                {location.name}
            </text>
        </g>
    ));
}
