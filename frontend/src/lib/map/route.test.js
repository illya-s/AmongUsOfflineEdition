/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
    buildShortestRoute,
    orderWaypointsByShortestRoute,
    simplifyGridPath,
} from "./route";

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

    it("keeps smoothed routes around walls", () => {
        const grid = Array.from({ length: 7 }, () => Array(5).fill(true));
        for (let row = 0; row < 5; row += 1) grid[row][2] = false;

        const path = [
            { row: 1, col: 1 },
            { row: 2, col: 1 },
            { row: 3, col: 1 },
            { row: 4, col: 1 },
            { row: 5, col: 1 },
            { row: 5, col: 2 },
            { row: 5, col: 3 },
            { row: 4, col: 3 },
            { row: 3, col: 3 },
            { row: 2, col: 3 },
            { row: 1, col: 3 },
        ];

        const smooth = simplifyGridPath(grid, path);
        expect(smooth).toHaveLength(4);
        expect(smooth[0]).toEqual(path[0]);
        expect(smooth.at(-1)).toEqual(path.at(-1));
        expect(smooth.some(({ row }) => row === 5)).toBe(true);
    });

    it("does not smooth diagonally through a blocked corner", () => {
        const grid = Array.from({ length: 3 }, () => Array(3).fill(true));
        grid[0][1] = false;
        const path = [
            { row: 0, col: 0 },
            { row: 1, col: 0 },
            { row: 2, col: 0 },
            { row: 2, col: 1 },
            { row: 2, col: 2 },
        ];

        expect(simplifyGridPath(grid, path)).toHaveLength(3);
    });
});
