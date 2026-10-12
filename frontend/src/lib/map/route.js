export function normalizeTaskPoints(points) {
    if (!Array.isArray(points)) return [];

    return points
        .filter(
            (point) =>
                point &&
                Number.isFinite(Number(point.x)) &&
                Number.isFinite(Number(point.y)),
        )
        .map((point) => ({
            x: Number(point.x),
            y: Number(point.y),
        }));
}

export function orderWaypointsByShortestRoute(points) {
    const normalized = normalizeTaskPoints(points);

    if (normalized.length <= 2) return normalized;

    const start = normalized[0];
    const end = normalized[normalized.length - 1];
    const middle = normalized.slice(1, -1);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const corridorLengthSquared = dx * dx + dy * dy || 1;

    const orderedMiddle = [...middle].sort((a, b) => {
        const projectionA =
            ((a.x - start.x) * dx + (a.y - start.y) * dy) /
            corridorLengthSquared;
        const projectionB =
            ((b.x - start.x) * dx + (b.y - start.y) * dy) /
            corridorLengthSquared;

        return (
            projectionA - projectionB ||
            Math.abs(a.x - start.x) - Math.abs(b.x - start.x) ||
            Math.abs(a.y - start.y) - Math.abs(b.y - start.y)
        );
    });

    return [start, ...orderedMiddle, end];
}

export function shortenedLine(from, to, radius) {
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

export function buildShortestRoute(points, radius = 0) {
    const ordered = orderWaypointsByShortestRoute(points);

    return ordered
        .slice(1)
        .map((point, index) => {
            const from = ordered[index];
            return shortenedLine(from, point, radius);
        })
        .filter(Boolean);
}
