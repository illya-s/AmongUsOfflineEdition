import moveCursor from "/cursor-tool.png";
import penCursor from "/pen-tool.png";

import { Section } from "../../elements/Section";
import styles from "./Controls.module.css";

export const Controls = ({
    currentTool,
    setCurrentTool,
    TOOLS,
    resetTransform,
    zoomIn,
    zoomOut,
    undo,
    redo,
    canUndo,
    canRedo,
}) => (
    <Section className={styles.tools}>
        <button
            type="button"
            className={`${styles.button} ${
                currentTool === TOOLS.MOVE ? styles.active : ""
            }`}
            onClick={() => setCurrentTool(TOOLS.MOVE)}
            title="Перемещать карту"
        >
            <img src={moveCursor} alt="Перемещение" />
        </button>

        <button
            type="button"
            className={`${styles.button} ${
                currentTool === TOOLS.PEN ? styles.active : ""
            }`}
            onClick={() => setCurrentTool(TOOLS.PEN)}
            title="Добавить точку задания"
        >
            <img src={penCursor} alt="Добавить точку" />
        </button>

        <div className={styles.divider} />

        <button type="button" onClick={undo} disabled={!canUndo} title="Отменить (Ctrl+Z)">
            ↶
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} title="Повторить (Ctrl+Y)">
            ↷
        </button>

        <div className={styles.divider} />

        <button type="button" onClick={zoomOut} title="Уменьшить">
            −
        </button>
        <button type="button" onClick={resetTransform} title="Показать всю карту">
            1:1
        </button>
        <button type="button" onClick={zoomIn} title="Увеличить">
            +
        </button>
    </Section>
);
