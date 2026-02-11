import "./GameTaskForm.css";

import { Modal, Select } from "antd";
import { useState } from "react";
import { useEffect } from "react";
import { useMessageApi } from "../../../../providers/MessageProvider";
import { getTasks } from "../../../requests/api_task";
import { getLocations } from "../../../requests/api_locations";
import { sendWithAck } from "../../../../lib/api/sendWithAck";

export function GameTaskForm({ gameSocket, isOpen, setIsOpen, code }) {
    const message = useMessageApi();

    const [tasks, setTasks] = useState([]);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const init = async () => {
            setTasks(await getTasks());
            setLocations(await getLocations());
        };
        init();
    }, []);

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
                        options={locations.map((location) => {
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
                        options={tasks.map((task) => {
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
