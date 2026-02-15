import { useEffect, useRef, useState } from "react";
import { useMessageApi } from "../../providers/MessageProvider";
import styles from "./ReportButton.module.css";

export function ReportButton({
    onClick,
    activeMeeting,
    blockedUntil,
}) {
    const message = useMessageApi();

    const [isHolding, setIsHolding] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [isBlockedByTimer, setIsBlockedByTimer] = useState(false);

    const timerRef = useRef(null);
    const blockTimeoutRef = useRef(null);

    const HOLD_TIME = 2000;
    const RESET_TIME = 2000;

    useEffect(() => {
        if (!blockedUntil) {
            setIsBlockedByTimer(false);
            return;
        }

        const checkLock = () => {
            const remaining = new Date(blockedUntil).getTime() - Date.now();
            if (remaining > 0) {
                setIsBlockedByTimer(true);
                blockTimeoutRef.current = setTimeout(() => {
                    setIsBlockedByTimer(false);
                }, remaining);
            } else {
                setIsBlockedByTimer(false);
            }
        };

        checkLock();

        return () => {
            if (blockTimeoutRef.current) clearTimeout(blockTimeoutRef.current);
        };
    }, [blockedUntil]);

    const isEffectivelyDisabled = activeMeeting || isBlockedByTimer;

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
                className={`${styles["alert-button"]} ${isEffectivelyDisabled ? styles.disabled : ""}`}
                disabled={isEffectivelyDisabled}
                onMouseDown={isEffectivelyDisabled ? undefined : startHold}
                onMouseUp={isEffectivelyDisabled ? undefined : stopHold}
                onMouseLeave={isEffectivelyDisabled ? undefined : stopHold}
                onTouchStart={isEffectivelyDisabled ? undefined : startHold}
                onTouchEnd={isEffectivelyDisabled ? undefined : stopHold}
                onContextMenu={(e) => {
                    e.preventDefault();
                }}
            >
                <div></div>
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
