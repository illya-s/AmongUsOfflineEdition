import { useRef } from "react";
import { KnifeIcon } from "../../assets/icons";
import { useMessageApi } from "../../providers/MessageProvider";
import styles from "./SelfKillButton.module.css";
import { useState } from "react";

export function SelfKillButton({ onClick }) {
    const message = useMessageApi();

    const [isHolding, setIsHolding] = useState(false);
    const [completed, setCompleted] = useState(false);

    const timerRef = useRef(null);

    const HOLD_TIME = 2000;
    const RESET_TIME = 2000;

    const startHold = () => {
        if (completed) return;

        setIsHolding(true);

        timerRef.current = setTimeout(() => {
            setIsHolding(false);
            setCompleted(true);
            handleAction();

            setTimeout(() => {
                setCompleted(false);
            }, RESET_TIME);
        }, HOLD_TIME);
    };

    const stopHold = () => {
        if (completed) return;
        setIsHolding(false);
        clearTimeout(timerRef.current);
    };

    const handleAction = () => {
        message.warning("Активировано!");
        onClick();
    };

    return (
        <div className={styles["button-container"]}>
            <button
                className={styles.button}
                onMouseDown={startHold}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={startHold}
                onTouchEnd={stopHold}
            >
                <KnifeIcon />
            </button>

            <div className={styles["progress-container"]}>
                <div
                    className={styles["progress-fill"]}
                    style={{
                        height: isHolding ? "100%" : completed ? "100%" : "0%",
                        transition: isHolding
                            ? `height ${HOLD_TIME}ms linear`
                            : "height 0.2s ease-out",
                    }}
                ></div>
            </div>
        </div>
    );
}
