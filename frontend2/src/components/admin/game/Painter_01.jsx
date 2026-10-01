import styles from "./Painter.module.css";

import {
    AppstoreAddOutlined,
    EditOutlined,
    EyeOutlined,
    FileAddFilled,
} from "@ant-design/icons";
import {
    TransformWrapper,
    TransformComponent,
    useControls,
} from "react-zoom-pan-pinch";
import { Avatar, Button, Divider, Switch } from "antd";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Section } from "../../elements/Section";
import { GameTaskForm } from "./GameTaskForm";
import { useEffect } from "react";

const SNAP_RADIUS = 10;

export function Painter({ game, tasks = [], locations = [] }) {
    const [isOpenGameTaskForm, setIsOpenGameTaskForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [currentTool, setCurrentTool] = useState("move");

    useEffect(() => {
        if (isEditMode) {
            switch (currentTool) {
                case "move":
                    break;
                case "edit":
                    break;
            }
        }
    }, [isEditMode, currentTool]);

    const svgRef = useRef(null);
    const [viewBox, setViewBox] = useState({
        x: 0,
        y: 0,
        w: 1000,
        h: 800,
    });

    const { zoomIn, zoomOut, resetTransform } = useControls();

    const [mousePos, setMousePos] = useState(null);

    const [currentPoints, setCurrentPoints] = useState([]);

    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // const [zones, setZones] = useState(tasks);
    const [currentZone, setCurrentZone] = useState(null);

    const getSnappedPos = (x, y) => {
        let closest = null;
        let minDist = SNAP_RADIUS;

        currentPoints.forEach((p) => {
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist < minDist) {
                closest = p;
                minDist = dist;
            }
        });

        if (closest) return { x: closest.x, y: closest.y };
        return { x, y };
    };

    const addPoint = (point) => {
        console.log(point);

        setHistory([...history, currentPoints]);
        setRedoStack([]);
        setCurrentPoints([...currentPoints, point]);
    };

    // Undo
    const undo = () => {
        if (history.length === 0) return;
        const last = history[history.length - 1];
        setRedoStack([currentPoints, ...redoStack]);
        setCurrentPoints(last);
        setHistory(history.slice(0, history.length - 1));
    };

    // Redo
    const redo = () => {
        if (redoStack.length === 0) return;
        const [next, ...rest] = redoStack;
        setHistory([...history, currentPoints]);
        setCurrentPoints(next);
        setRedoStack(rest);
    };

    const getSvgPoint = (e) => {
        const svg = svgRef.current;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;

        return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    useHotkeys("Escape", () => {
        setCurrentZone(null);
    });

    useHotkeys("ctrl+z", (e) => {
        e.preventDefault();
        undo();
    });
    useHotkeys("ctrl+y, ctrl+shift+z", (e) => {
        e.preventDefault();
        redo();
    });

    return (
        <Section
            className={`${styles.wrapper} ${isEditMode ? styles.edit : ""}`}
        >
            <TransformWrapper
                initialScale={1}
                // Отключаем панорамирование (panning), если выбран инструмент "Edit"
                disabled={!isEditMode || currentTool === "edit"}
                limitToBounds={false}
                wheel={{ step: 0.2 }}
            >
                <div className={styles["top-wrapper"]}>
                    <h3 className={styles["top-title"]}>Карта</h3>

                    <Switch
                        checkedChildren={
                            <EditOutlined
                                size="default"
                                style={{ color: "white" }}
                            />
                        }
                        unCheckedChildren={
                            <EyeOutlined style={{ color: "white" }} />
                        }
                        onChange={(checked) => setIsEditMode(checked)}
                    />
                </div>

                <div className={styles.content}>
                    {isEditMode && (
                        <div className={styles.buttons}>
                            <Button
                                size="large"
                                variant="solid"
                                color="primary"
                                icon={
                                    <AppstoreAddOutlined
                                        style={{ fontSize: "20px" }}
                                    />
                                }
                                onClick={() => setIsOpenGameTaskForm(true)}
                            />

                            <Divider />

                            <Button
                                name="move"
                                size="large"
                                variant="solid"
                                color={
                                    "move" == currentTool
                                        ? "default"
                                        : "primary"
                                }
                                disabled={!currentZone}
                                icon={
                                    <img
                                        // src={moveCursor}
                                        className={styles["button-tool-icon"]}
                                    />
                                }
                                onClick={() => setCurrentTool("move")}
                            />

                            <Button
                                name="edit"
                                size="large"
                                variant="solid"
                                color={
                                    "edit" == currentTool
                                        ? "default"
                                        : "primary"
                                }
                                disabled={!currentZone}
                                icon={
                                    <img
                                        src={penCursor}
                                        className={styles["button-tool-icon"]}
                                    />
                                }
                                onClick={() => setCurrentTool("edit")}
                            />

                            <Divider />

                            <Button
                                size="large"
                                variant="solid"
                                color="primary"
                                icon={
                                    <FileAddFilled
                                        style={{ fontSize: "20px" }}
                                    />
                                }
                            />

                            <GameTaskForm
                                isOpen={isOpenGameTaskForm}
                                setIsOpen={setIsOpenGameTaskForm}
                                code={game?.code}
                                tasks={tasks}
                                locations={locations}
                            />

                            <Divider />

                            <Button onClick={() => zoomIn()}>+</Button>
                            <Button onClick={() => zoomOut()}>-</Button>
                            <Button onClick={() => resetTransform()}>R</Button>
                        </div>
                    )}

                    <div className={styles.map}>
                        <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            contentStyle={{ width: "100%", height: "100%" }}
                        >
                            <svg
                                ref={svgRef}
                                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                                id={styles.zones}
                                style={{
                                    cursor: `url(${currentTool == "edit" ? penCursor : moveCursor}), auto`,
                                }}
                                onMouseMove={(e) => {
                                    const p = getSvgPoint(e);
                                    setMousePos(getSnappedPos(p.x, p.y));
                                }}
                                onClick={(e) => {
                                    if (!isEditMode || currentTool !== "edit")
                                        return;
                                    if (!mousePos) return;

                                    addPoint(mousePos);
                                }}
                            >
                                <image
                                    href={game?.game_map}
                                    x="0"
                                    y="0"
                                />
                                {currentPoints.length >= 3 &&
                                    (() => {
                                        const first = currentPoints[0];
                                        const last =
                                            currentPoints[
                                                currentPoints.length - 1
                                            ];
                                        const dist = Math.hypot(
                                            first.x - last.x,
                                            first.y - last.y,
                                        );
                                        const isClosed = dist < SNAP_RADIUS;

                                        if (isClosed) {
                                            return (
                                                <polygon
                                                    points={currentPoints
                                                        .map(
                                                            (p) =>
                                                                `${p.x},${p.y}`,
                                                        )
                                                        .join(" ")}
                                                    fill="rgba(255,0,0,0.2)"
                                                    stroke="red"
                                                    strokeWidth={2}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}

                                {currentPoints.map((point, idx) => {
                                    if (idx < currentPoints.length - 1) {
                                        const next = currentPoints[idx + 1];
                                        return (
                                            <line
                                                key={idx}
                                                x1={point.x}
                                                y1={point.y}
                                                x2={next.x}
                                                y2={next.y}
                                                stroke="red"
                                                strokeWidth={2}
                                            />
                                        );
                                    }
                                    if (
                                        currentTool == "edit" &&
                                        idx === currentPoints.length - 1 &&
                                        mousePos
                                    ) {
                                        return (
                                            <line
                                                key={idx}
                                                x1={point.x}
                                                y1={point.y}
                                                x2={mousePos.x}
                                                y2={mousePos.y}
                                                stroke="red"
                                                strokeWidth={2}
                                                strokeDasharray="4"
                                            />
                                        );
                                    }
                                    return null;
                                })}

                                {currentPoints.map((p, idx) => (
                                    <circle
                                        key={`point_${idx}`}
                                        cx={p.x}
                                        cy={p.y}
                                        r={4}
                                        fill="red"
                                    />
                                ))}
                                {mousePos && (
                                    <circle
                                        cx={mousePos.x}
                                        cy={mousePos.y}
                                        r={3}
                                        fill="white"
                                        stroke="#0c8ce9"
                                        strokeWidth={1}
                                    />
                                )}
                            </svg>
                        </TransformComponent>
                    </div>
                </div>

                <div>
                    <span>
                        {mousePos ? (
                            <>
                                {mousePos.x.toFixed(2)} :{" "}
                                {mousePos.y.toFixed(2)}
                            </>
                        ) : (
                            <>&infin;:&infin;</>
                        )}
                    </span>
                </div>
            </TransformWrapper>
        </Section>
    );
}
