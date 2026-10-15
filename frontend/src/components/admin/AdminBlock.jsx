import styles from "./AdminBlock.module.css";

import { Avatar, Button, Modal } from "antd";
import { Section } from "../elements/Section";
import { useState } from "react";

export function AdminBlock({
  title,
  layout = "line", // grid
  titleModal,
  formModal,
  onOkModal,
  dataSource = [],
  renderItem,
  className,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Section
      className={`${styles.adminBlockWrapper} ${layout === "grid" ? styles.adminBlockWrapperGrid : styles.adminBlockWrapperLine} ${className ?? ""}`}
    >
      <div className={styles.adminBlockTop}>
        <h3>{title}</h3>

        <Button
          className={styles.adminTasksAddButton}
          size="small"
          type="primary"
          shape="circle"
          onClick={() => setIsModalOpen((prev) => !prev)}
        >
          +
        </Button>

        <Modal
          title={titleModal}
          centered

          open={isModalOpen}
          closable={{ "aria-label": "Custom Close Button" }}

          onOk={() => {
            onOkModal();
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        >
          {formModal}
        </Modal>
      </div>

      <div className={styles.adminBlockList}>
        {Array.isArray(dataSource) && dataSource.length > 0 && renderItem ? (
          dataSource.map(renderItem)
        ) : (
          <div className={styles.adminBlockListEmpty}>Тут пусто ;(</div>
        )}
      </div>
    </Section>
  );
}
