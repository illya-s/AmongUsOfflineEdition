export function normalizeTaskPoints(points) {
  if (!Array.isArray(points)) return [];

  return points
    .filter(
      (point) => point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)),
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
    const projectionA = ((a.x - start.x) * dx + (a.y - start.y) * dy) / corridorLengthSquared;
    const projectionB = ((b.x - start.x) * dx + (b.y - start.y) * dy) / corridorLengthSquared;

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

function gridToPoint(row, col, cellSize) {
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  };
}

function getNeighbors(grid, row, col) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const neighbors = [];

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;

      const nextRow = row + dy;
      const nextCol = col + dx;
      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
        continue;
      }

      // Prevent diagonal movement through the corner of a wall.
      if (dx !== 0 && dy !== 0 && (!grid[nextRow]?.[col] || !grid[row]?.[nextCol])) continue;

      neighbors.push({
        row: nextRow,
        col: nextCol,
        cost: dx === 0 || dy === 0 ? 1 : 1.414,
      });
    }
  }

  return neighbors;
}

function findPathOnGrid(grid, start, end) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  if (!rows || !cols) return [];

  const open = [{ ...start, f: 0, g: 0 }];
  const cameFrom = new Map();
  const gScore = new Map([[`${start.row}:${start.col}`, 0]]);

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    const currentKey = `${current.row}:${current.col}`;

    if (current.row === end.row && current.col === end.col) {
      const path = [];
      let cursor = current;
      while (cursor) {
        path.push({ row: cursor.row, col: cursor.col });
        const prevKey = `${cursor.row}:${cursor.col}`;
        const parent = cameFrom.get(prevKey);
        cursor = parent || null;
      }
      return path.reverse();
    }

    for (const neighbor of getNeighbors(grid, current.row, current.col)) {
      if (!grid[neighbor.row]?.[neighbor.col]) continue;

      const nextKey = `${neighbor.row}:${neighbor.col}`;
      const tentative = (gScore.get(currentKey) ?? Infinity) + neighbor.cost;

      if (tentative < (gScore.get(nextKey) ?? Infinity)) {
        cameFrom.set(nextKey, { row: current.row, col: current.col });
        gScore.set(nextKey, tentative);

        const rowDistance = Math.abs(neighbor.row - end.row);
        const colDistance = Math.abs(neighbor.col - end.col);
        const heuristic =
          Math.max(rowDistance, colDistance) +
          (Math.SQRT2 - 1) * Math.min(rowDistance, colDistance);

        open.push({
          ...neighbor,
          g: tentative,
          f: tentative + heuristic,
        });
      }
    }
  }

  return [];
}

export function buildWalkableGrid({ width, height, cellSize, image }) {
  const cols = Math.max(1, Math.ceil(width / cellSize));
  const rows = Math.max(1, Math.ceil(height / cellSize));

  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, cols, rows);

  const data = ctx.getImageData(0, 0, cols, rows).data;
  const grid = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const index = (row * cols + col) * 4;
      const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;

      return brightness >= 220;
    }),
  );

  // Keep the raster close to the actual map geometry. A whole-cell
  // clearance removed valid narrow doorways on the supplied maps.
  return { grid, rows, cols };
}

function hasLineOfSight(grid, from, to) {
  const dx = to.col - from.col;
  const dy = to.row - from.row;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const samples = Math.max(1, Math.ceil(steps * 2));
  let previousCol = from.col;
  let previousRow = from.row;
  for (let step = 0; step <= samples; step += 1) {
    const ratio = step / samples;
    const col = Math.round(from.col + dx * ratio);
    const row = Math.round(from.row + dy * ratio);
    if (!grid[row]?.[col]) return false;
    if (
      col !== previousCol &&
      row !== previousRow &&
      (!grid[previousRow]?.[col] || !grid[row]?.[previousCol])
    ) {
      return false;
    }
    previousCol = col;
    previousRow = row;
  }
  return true;
}

export function simplifyGridPath(grid, pathCells) {
  if (!Array.isArray(pathCells) || pathCells.length < 3) return pathCells || [];
  const simplified = [pathCells[0]];
  let anchorIndex = 0;
  while (anchorIndex < pathCells.length - 1) {
    let nextIndex = pathCells.length - 1;
    while (
      nextIndex > anchorIndex + 1 &&
      !hasLineOfSight(grid, pathCells[anchorIndex], pathCells[nextIndex])
    ) {
      nextIndex -= 1;
    }
    simplified.push(pathCells[nextIndex]);
    anchorIndex = nextIndex;
  }
  return simplified;
}

function pathWaypointsFromCells(pathCells, cellSize) {
  if (!Array.isArray(pathCells) || pathCells.length === 0) return [];
  return pathCells.map((cell) => gridToPoint(cell.row, cell.col, cellSize));
}

const mapGridCache = new Map();

function loadWalkableGrid({ mapUrl, width, height, cellSize }) {
  const key = `${mapUrl}:${width}:${height}:${cellSize}`;
  if (mapGridCache.has(key)) return mapGridCache.get(key);

  const gridPromise = new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        resolve(
          image.width && image.height
            ? buildWalkableGrid({ width, height, cellSize, image })
            : null,
        );
      } catch {
        // If canvas cannot read this map, do not draw an unsafe route.
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = mapUrl;
  });

  mapGridCache.set(key, gridPromise);
  return gridPromise;
}

export async function buildMapAwareRoute({ points, mapUrl, width, height, cellSize = 6 }) {
  const normalized = normalizeTaskPoints(points);
  if (normalized.length < 2) {
    return orderWaypointsByShortestRoute(normalized);
  }
  if (!mapUrl || !width || !height) return [];

  if (typeof window === "undefined" || !window.Image) return [];

  const mapGrid = await loadWalkableGrid({ mapUrl, width, height, cellSize });
  if (!mapGrid) return [];
  const { grid, rows, cols } = mapGrid;

  const route = [];

  for (let index = 0; index < normalized.length - 1; index += 1) {
    const from = normalized[index];
    const to = normalized[index + 1];

    const fromCell = {
      row: Math.min(rows - 1, Math.max(0, Math.floor(from.y / cellSize))),
      col: Math.min(cols - 1, Math.max(0, Math.floor(from.x / cellSize))),
    };
    const toCell = {
      row: Math.min(rows - 1, Math.max(0, Math.floor(to.y / cellSize))),
      col: Math.min(cols - 1, Math.max(0, Math.floor(to.x / cellSize))),
    };

    const nearestWalkableCell = (cell) => {
      if (grid[cell.row]?.[cell.col]) return cell;
      const limit = Math.ceil(48 / cellSize);
      for (let distance = 1; distance <= limit; distance += 1) {
        for (let dy = -distance; dy <= distance; dy += 1) {
          for (let dx = -distance; dx <= distance; dx += 1) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== distance) continue;
            const row = cell.row + dy;
            const col = cell.col + dx;
            if (grid[row]?.[col]) return { row, col };
          }
        }
      }
      return null;
    };

    const safeFromCell = nearestWalkableCell(fromCell);
    const safeToCell = nearestWalkableCell(toCell);
    if (!safeFromCell || !safeToCell) return [];

    let segment;
    if (safeFromCell.row === safeToCell.row && safeFromCell.col === safeToCell.col) {
      if (!grid[fromCell.row]?.[fromCell.col] || !grid[toCell.row]?.[toCell.col]) {
        return [];
      }
      // Keep very short routes visible when both endpoints share a
      // walkable cell (A* would otherwise return only one point).
      segment = [from, to];
    } else {
      const pathCells = findPathOnGrid(grid, safeFromCell, safeToCell);
      if (pathCells.length === 0) return [];
      const simplifiedCells = simplifyGridPath(grid, pathCells);
      segment = pathWaypointsFromCells(simplifiedCells, cellSize);
    }

    if (route.length > 0 && segment.length > 0) {
      segment.shift();
    }

    route.push(...segment);
  }

  if (route.length === 0) {
    return orderWaypointsByShortestRoute(normalized);
  }

  return route;
}
