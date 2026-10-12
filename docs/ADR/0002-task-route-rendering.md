# ADR 0002: Task routes follow walkable map corridors

- Status: Accepted
- Date: 2026-10-12

## Context
Straight lines between task endpoints crossed walls on the map. The route also needed to remain legible without showing every internal waypoint as a marker.

## Decision
We rasterize the map into a 6-pixel walkability grid, search each ordered waypoint segment with A*, and simplify the resulting path only where a clear line of sight exists. Diagonal movement cannot cut across blocked corners. The finer grid preserves narrow doorways that a coarser grid or added wall padding would incorrectly close. The shared map and route components are used in game and admin map views. Only the first and last task points receive endpoint markers; the route itself follows all ordered waypoint segments.

## Consequences
- Routes stay inside detected walkable areas and are smoothed without cutting through walls.
- Only start and end markers are displayed, keeping intermediate navigation points unobtrusive.
- Map analysis is cached per map and dimensions so tasks sharing a map reuse the same grid.
- If map pixels cannot be read or no safe route exists, the route is omitted rather than drawn as a line through a wall.
