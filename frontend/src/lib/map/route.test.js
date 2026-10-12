/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { buildShortestRoute, orderWaypointsByShortestRoute } from "./route";

describe("route helpers", () => {
    it("keeps a two-point task as a direct route", () => {
        const points = [
            { x: 10, y: 10 },
            { x: 80, y: 30 },
        ];

        expect(orderWaypointsByShortestRoute(points)).toEqual(points);
        expect(buildShortestRoute(points, 8)).toHaveLength(1);
    });

    it("orders interior waypoints along the shortest corridor path", () => {
        const points = [
            { x: 0, y: 0 },
            { x: 60, y: 60 },
            { x: 10, y: 10 },
            { x: 100, y: 0 },
        ];

        expect(orderWaypointsByShortestRoute(points)).toEqual([
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 60, y: 60 },
            { x: 100, y: 0 },
        ]);
    });
});
