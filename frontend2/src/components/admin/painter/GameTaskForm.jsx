import "./GameTaskForm.css";

import { Modal, Select } from "antd";
import { useState } from "react";
import { sendWithAck } from "../../../lib/api/sendWithAck";
import { useMessageApi } from "../../../providers/MessageProvider";

export function GameTaskForm({
    gameSocket,
    isOpen,
    setIsOpen,
    code,
    locations,
    tasks,
}) {
    const message = useMessageApi();

    const [task, setTask] = useState(null);
    const [location, setLocation] = useState(null);

    const addGameTask = () => {
        sendWithAck(gameSocket, {
            action: "add_task",
            data: { location: location, task: task },
        })
            .then(() => {
                message.success("Задача создана");
                setIsOpen(false);
            })
            .catch(() => {
                message.error("Что-то пошло не так!");
            });
    };

    return (
        <Modal
            title="Создать задачу для игры"
            centered
            open={isOpen}
            onOk={addGameTask}
            onCancel={() => setIsOpen(false)}
        >
            <form className="game-task-form-wrapper">
                <label className="game-task-form-field-wrapper">
                    <span>Локация</span>

                    <Select
                        value={location}
                        onChange={(value) => setLocation(value)}
                        options={(Array.isArray(locations) ? locations : []).map((location) => {
                            return {
                                value: location.id,
                                label: location.name,
                            };
                        })}
                    />
                </label>

                <label className="game-task-form-field-wrapper">
                    <span>Задача</span>

                    <Select
                        value={task}
                        onChange={(value) => setTask(value)}
                        options={(Array.isArray(tasks) ? tasks : []).map((task) => {
                            return {
                                value: task.id,
                                label: task.text,
                            };
                        })}
                    />
                </label>
            </form>
        </Modal>
    );
}
