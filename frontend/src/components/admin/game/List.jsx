import styles from "./List.module.css";

export default function List({
    className,
    emptyMessage = "Здесь ничиго нет",
    dataSource,
    renderItem,
}) {
    return (
        <div className={`${styles.list} ${className}`}>
            {Array.isArray(dataSource) && dataSource.length !== 0 ? (
                dataSource.map(renderItem)
            ) : (
                <span className={styles.message}>{emptyMessage}</span>
            )}
        </div>
    );
}
