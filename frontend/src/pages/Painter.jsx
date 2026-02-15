import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams } from "react-router";
import List from "../components/admin/game/List";
import { Controls } from "../components/admin/painter/Controls";
import { GameTaskForm } from "../components/admin/painter/GameTaskForm";
import { Task } from "../components/admin/painter/Task";
import { Section } from "../components/elements/Section";
import { sendWithAck } from "../lib/api/sendWithAck";
import { useGameSocket } from "../lib/api/useGameSocket";
import { colorFromNumber } from "../lib/client/colorFromNumber";
import styles from "./Painter.module.css";

const SNAP_RADIUS = 5;

const TOOLS = {
    MOVE: "move",
    PEN: "pen",
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const ZOOM_SPEED = 0.0015;
const PAN_SPEED = 1;

export default function Painter() {
    const { code } = useParams();
    const { gameSocket, game, players, tasks, locations, availableTasks } = useGameSocket(code);

    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (game?.game_map) {
            const img = new Image();
            img.src = game.game_map;
            img.onload = () => {
                setMapDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
        }
    }, [game?.game_map]);

    const [currentTool, setCurrentTool] = useState(TOOLS.MOVE);
    const [visualIsDragging, setVisualIsDragging] = useState(false);
    const [mousePos, setMousePos] = useState(null);

    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const [isOpenForm, setIsOpenForm] = useState(false);

    useEffect(() => {
        setIsOpenForm(tasks.length == 0);
    }, [tasks]);

    const transform = useRef({ scale: 1, x: 0, y: 0 });
    const wrapperRef = useRef(null);
    const svgRef = useRef(null);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const [currentTaskId, setCurrentTaskId] = useState(null);
    const handleSelectTask = (id) => {
        setCurrentTaskId((prev) => (prev === id ? null : id));
    };
    const currentTask = tasks?.find((t) => t.id === currentTaskId);
    const activePoints = currentTask?.points || [];

    useEffect(() => {
        setHistory([]);
        setRedoStack([]);
    }, [currentTaskId]);

    const getSnappedPos = ({ x, y }) => {
        let closest = null;
        let minDist = SNAP_RADIUS;
        const origin = activePoints.at(-1);

        activePoints.forEach((p) => {
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist < minDist) {
                closest = p;
                minDist = dist;
            }
        });

        if (closest) return { x: closest.x, y: closest.y, isSnapped: true };

        if (origin) {
            const dx = x - origin.x;
            const dy = y - origin.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            const threshold = SNAP_RADIUS;

            if (absDy < threshold) return { x, y: origin.y, isSnapped: true };

            if (absDx < threshold) return { x: origin.x, y, isSnapped: true };

            if (Math.abs(absDx - absDy) < threshold) {
                const side = (absDx + absDy) / 2;
                return {
                    x: origin.x + Math.sign(dx) * side,
                    y: origin.y + Math.sign(dy) * side,
                    isSnapped: true,
                };
            }
        }

        return { x, y, isSnapped: false };
    };

    const getSvgPoint = (e) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    const undo = () => {
        if (!currentTaskId || activePoints.length === 0) return;

        if (history.length == 0) {
            const nextPoints = activePoints.slice(0, -1);

            setRedoStack((prev) => [activePoints, ...prev]);

            sendWithAck(gameSocket, {
                action: "update_zones",
                data: { id: currentTaskId, points: nextPoints },
            });
        } else {
            const prevState = history[history.length - 1];
            setRedoStack((prev) => [activePoints, ...prev]);
            setHistory((prev) => prev.slice(0, -1));

            sendWithAck(gameSocket, {
                action: "update_zones",
                data: { id: currentTaskId, points: prevState },
            });
        }
    };

    const redo = () => {
        if (redoStack.length === 0 || !currentTaskId) return;

        const nextState = redoStack[0];
        setRedoStack((prev) => prev.slice(1));
        setHistory((prev) => [...prev, activePoints]);

        sendWithAck(gameSocket, {
            action: "update_zones",
            data: { id: currentTaskId, points: nextState },
        });
    };

    const onDrawPoint = (point, taskId) => {
        setHistory((prev) => [...prev, activePoints]);
        setRedoStack([]);

        sendWithAck(gameSocket, {
            action: "update_zones",
            data: { id: taskId, points: [...activePoints, point] },
        });
    };

    const updateDOM = useCallback(() => {
        if (!svgRef.current) return;
        const { x, y, scale } = transform.current;
        svgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }, []);

    const getCursor = () => {
        if (visualIsDragging) {
            return "grabbing";
        }
        if (currentTool === TOOLS.MOVE)
            return `url(/cursor-tool.png) 8 8, grab`;
        if (currentTool === TOOLS.PEN) return `url(/pen-tool.png), crosshair`;
        return "default";
    };

    const adjustZoom = (factor) => {
        if (!wrapperRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const prevScale = transform.current.scale;
        let nextScale = prevScale * factor;

        nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));

        const actualRatio = nextScale / prevScale;

        transform.current.x =
            centerX - (centerX - transform.current.x) * actualRatio;
        transform.current.y =
            centerY - (centerY - transform.current.y) * actualRatio;
        transform.current.scale = nextScale;

        updateDOM();
    };

    const zoomIn = () => adjustZoom(1.2);
    const zoomOut = () => adjustZoom(0.8);

    const handleWheel = (e) => {
        e.preventDefault();
        const rect = wrapperRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.ctrlKey) {
            const delta = -e.deltaY * ZOOM_SPEED;
            const prevScale = transform.current.scale;
            let nextScale = prevScale * (1 + delta);
            nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));

            const ratio = nextScale / prevScale;

            transform.current.x =
                mouseX - (mouseX - transform.current.x) * ratio;
            transform.current.y =
                mouseY - (mouseY - transform.current.y) * ratio;
            transform.current.scale = nextScale;
        } else {
            transform.current.x -=
                (e.shiftKey ? e.deltaY : e.deltaX) * PAN_SPEED;
            transform.current.y -= (!e.shiftKey ? e.deltaY : 0) * PAN_SPEED;
        }
        updateDOM();
    };

    useEffect(() => {
        const container = wrapperRef.current;
        if (!container) return;

        const onMouseDown = (e) => {
            if (e.button !== 1) return;
            isDragging.current = true;
            setVisualIsDragging(true);
            lastPos.current = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e) => {
            if (isDragging.current) {
                const dx = e.clientX - lastPos.current.x;
                const dy = e.clientY - lastPos.current.y;

                transform.current.x += dx;
                transform.current.y += dy;
                lastPos.current = { x: e.clientX, y: e.clientY };

                updateDOM();
            } else if (currentTool === TOOLS.PEN) {
                const p = getSvgPoint(e);
                setMousePos(getSnappedPos({ x: p.x, y: p.y }));
            }
        };

        const onMouseUp = () => {
            isDragging.current = false;
            setVisualIsDragging(false);
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        container.addEventListener("mousedown", onMouseDown);

        return () => {
            container.removeEventListener("wheel", handleWheel);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            container.removeEventListener("mousedown", onMouseDown);
        };
    }, [updateDOM, currentTool, activePoints]);

    const resetTransform = () => {
        transform.current = { scale: 1, x: 0, y: 0 };
        updateDOM();
    };

    useHotkeys("Escape", () => {
        setCurrentTaskId(null);
    });

    useHotkeys("ctrl+z", (e) => {
        e.preventDefault();
        undo();
    });
    useHotkeys("ctrl+y, ctrl+shift+z", (e) => {
        e.preventDefault();
        redo();
    });

    // const handleDeleteTask = (id) => {
    //     sendWithAck(gameSocket, {
    //         action: "delete_task",
    //         data: { id: id },
    //     }).then(() => {});
    // };

    const renderList = currentTaskId ? [currentTask] : tasks;

    return (
        <div className={styles.container}>
            <List
                className={styles["task-list"]}
                dataSource={tasks}
                renderItem={(task) => (
                    <Task
                        key={`task_${task.id}`}
                        task={task}
                        gameSocket={gameSocket}
                        isSelected={currentTaskId === task.id}
                        onClick={() => handleSelectTask(task.id)}
                    // onKeyDown={(e) =>
                    //     e.key === "Delete" && handleDeleteTask(task.id)
                    // }
                    />
                )}
            />

            <GameTaskForm
                gameSocket={gameSocket}
                isOpen={isOpenForm}
                setIsOpen={setIsOpenForm}
                code={code}
                locations={locations}
                tasks={availableTasks}
            />

            <Section
                className={styles.wrapper}
                ref={wrapperRef}
                style={{ cursor: getCursor() }}
            >
                <svg
                    ref={svgRef}
                    id={styles.zones}
                    onWheel={handleWheel}
                    onClick={(e) => {
                        if (currentTool === TOOLS.PEN) {
                            if (currentTaskId) {
                                const p = getSnappedPos(getSvgPoint(e));
                                onDrawPoint({ x: p.x, y: p.y }, currentTaskId);
                            } else {
                                setIsOpenForm(true);
                            }
                        }
                    }}
                    viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                    style={{
                        transformOrigin: "0 0",
                        willChange: "transform",
                    }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <image
                        href={game?.game_map}
                        width={mapDimensions.width}
                        height={mapDimensions.height}
                    />

                    {Array.isArray(renderList) && renderList.map((task) => {
                        if (!task) return null;
                        const points = task.points;
                        const color1 = colorFromNumber(task.id);
                        const color2 = colorFromNumber(task.id, 0.4);
                        return (
                            <Fragment key={`svg_task_${task.id}`}>
                                {Array.isArray(points) && points.length > 0 && (
                                    <polyline
                                        points={points
                                            .map((p) => `${p.x},${p.y}`)
                                            .join(" ")}
                                        fill={color2}
                                        stroke={color1}
                                        strokeWidth={2}
                                    />
                                )}
                                {Array.isArray(points) && points.map((p, i) => (
                                    <circle
                                        key={i}
                                        cx={p.x}
                                        cy={p.y}
                                        r="3"
                                        fill={color1}
                                    />
                                ))}
                            </Fragment>
                        );
                    })}

                    {currentTool === TOOLS.PEN && mousePos && (
                        <>
                            {activePoints.length > 0 && (
                                <line
                                    x1={activePoints[activePoints.length - 1].x}
                                    y1={activePoints[activePoints.length - 1].y}
                                    x2={mousePos.x}
                                    y2={mousePos.y}
                                    stroke={
                                        mousePos.isSnapped
                                            ? "var(--ant-color-warning)"
                                            : "var(--ant-color-primary)"
                                    }
                                    strokeWidth={2}
                                />
                            )}
                            <circle
                                cx={mousePos.x}
                                cy={mousePos.y}
                                r={2}
                                fill="white"
                                stroke="var(--ant-color-primary)"
                                strokeWidth={1}
                            />
                        </>
                    )}
                </svg>

                <Controls
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    TOOLS={TOOLS}
                    resetTransform={resetTransform}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                />
            </Section>
        </div>
    );
}
