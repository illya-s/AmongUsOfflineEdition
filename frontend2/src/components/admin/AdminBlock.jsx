import "./AdminBlock.css";

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
    className
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <Section className={`admin-block-wrapper admin-block-wrapper-${layout} ${className ? className : ""}`}>
            <div className="admin-block-top">
                <h3>{title}</h3>

                <Button
                    className="admin-tasks-add-button"
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

            <div className="admin-block-list">
                {Array.isArray(dataSource) &&
                dataSource.length > 0 &&
                renderItem ? (
                    dataSource.map(renderItem)
                ) : (
                    <div className="admin-block-list-empty">Тут пусто ;(</div>
                )}
            </div>
        </Section>
    );
}
