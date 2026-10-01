import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams } from "react-router";
import List from "../components/admin/game/List";
import { Controls } from "../components/admin/painter/Controls";
import { GameTaskForm } from "../components/admin/painter/GameTaskForm";
import { Task } from "../components/admin/painter/Task";
import { Section } from "../components/elements/Section";
import { TaskMarkers } from "../components/game/TaskMarkers";
import { GameLocations } from "../components/game/GameLocations";
import { sendWithAck } from "../lib/api/sendWithAck";
import { useGameSocket } from "../lib/api/useGameSocket";
import styles from "./Painter.module.css";

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
    const { gameSocket, game, players, tasks, locations, availableTasks } =
        useGameSocket(code);

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
        setCurrentTaskId(id);
        setCurrentTool(TOOLS.PEN);
    };
    const currentTask = tasks?.find((t) => t.id === currentTaskId);
    const activePoints = currentTask?.points || [];

    useEffect(() => {
        setHistory([]);
        setRedoStack([]);
    }, [currentTaskId]);

    const getSvgPoint = (e) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    const undo = () => {
        if (
            !currentTaskId ||
            (activePoints.length === 0 && history.length === 0)
        )
            return;

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
        if (activePoints.length >= 2) return;

        setHistory((prev) => [...prev, activePoints]);
        setRedoStack([]);

        sendWithAck(gameSocket, {
            action: "update_zones",
            data: { id: taskId, points: [...activePoints, point] },
        });

        if (activePoints.length === 1) setCurrentTool(TOOLS.MOVE);
    };

    const removePoint = (index) => {
        if (!currentTaskId) return;
        const nextPoints = activePoints.filter(
            (_, pointIndex) => pointIndex !== index,
        );
        setHistory((prev) => [...prev, activePoints]);
        setRedoStack([]);
        sendWithAck(gameSocket, {
            action: "update_zones",
            data: { id: currentTaskId, points: nextPoints },
        });
        setCurrentTool(TOOLS.PEN);
    };

    const clearPoints = () => {
        if (!currentTaskId || activePoints.length === 0) return;
        setHistory((prev) => [...prev, activePoints]);
        setRedoStack([]);
        sendWithAck(gameSocket, {
            action: "update_zones",
            data: { id: currentTaskId, points: [] },
        });
        setCurrentTool(TOOLS.PEN);
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
            const canDrag =
                e.button === 1 ||
                (e.button === 0 && currentTool === TOOLS.MOVE);
            if (!canDrag) return;
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
                setMousePos({ x: p.x, y: p.y });
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

    useHotkeys("Delete", (e) => {
        e.preventDefault();
        if (activePoints.length > 0) removePoint(activePoints.length - 1);
    });

    const renderList = currentTaskId ? [currentTask] : tasks;

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles["sidebar-heading"]}>
                    <div>
                        <strong>Задания</strong>
                        <small>{tasks.length} на карте</small>
                    </div>
                    <button type="button" onClick={() => setIsOpenForm(true)}>
                        + Добавить
                    </button>
                </div>
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
                        />
                    )}
                />
            </aside>

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
                <div className={styles.inspector}>
                    {currentTask ? (
                        <>
                            <div className={styles["inspector-heading"]}>
                                <span className={styles["task-number"]}>
                                    {currentTask.sequence_number ?? currentTask.id}
                                </span>
                                <div>
                                    <strong>{currentTask.task.text}</strong>
                                    <small>{currentTask.location.name}</small>
                                </div>
                            </div>

                            <p className={styles.hint}>
                                {activePoints.length === 0 &&
                                    "Нажмите на карте, чтобы поставить точку задания."}
                                {activePoints.length === 1 &&
                                    "Начало задано. Добавьте место доставки или оставьте одну точку."}
                                {activePoints.length === 2 &&
                                    "Маршрут готов: стрелка идёт от начала к месту доставки."}
                            </p>

                            {activePoints.length > 0 && (
                                <div className={styles.points}>
                                    {activePoints.map((point, index) => (
                                        <button
                                            key={`${point.x}-${point.y}-${index}`}
                                            type="button"
                                            onClick={() => removePoint(index)}
                                            title="Удалить точку"
                                        >
                                            <span>
                                                {index === 0
                                                    ? "Начало"
                                                    : "Доставка"}
                                            </span>
                                            <small>
                                                {Math.round(point.x)}, {Math.round(point.y)} ×
                                            </small>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className={styles.clear}
                                        onClick={clearPoints}
                                    >
                                        Очистить
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className={styles.hint}>
                            Выберите задание слева, затем укажите его точку на карте.
                        </p>
                    )}
                </div>

                <svg
                    ref={svgRef}
                    id={styles.zones}
                    onWheel={handleWheel}
                    onClick={(e) => {
                        if (currentTool === TOOLS.PEN) {
                            if (currentTaskId) {
                                const point = getSvgPoint(e);
                                onDrawPoint(
                                    { x: point.x, y: point.y },
                                    currentTaskId,
                                );
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
                    <GameLocations locations={locations} />

                    {Array.isArray(renderList) &&
                        renderList.map((task) => {
                            if (!task) return null;
                            return (
                                <TaskMarkers
                                    key={`svg_task_${task.id}`}
                                    task={task}
                                />
                            );
                        })}

                    {currentTool === TOOLS.PEN &&
                        mousePos &&
                        activePoints.length < 2 && (
                            <>
                                {activePoints.length === 1 && (
                                    <line
                                        x1={
                                            activePoints[
                                                activePoints.length - 1
                                            ].x
                                        }
                                        y1={
                                            activePoints[
                                                activePoints.length - 1
                                            ].y
                                        }
                                        x2={mousePos.x}
                                        y2={mousePos.y}
                                        stroke="var(--ant-color-primary)"
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
                    undo={undo}
                    redo={redo}
                    canUndo={activePoints.length > 0 || history.length > 0}
                    canRedo={redoStack.length > 0}
                />
            </Section>
        </div>
    );
}
