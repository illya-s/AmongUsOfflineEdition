import "./Admin.css";

import { useEffect, useState } from "react";
import { Link } from "react-router"
import { Avatar, Button, Image, theme } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import { api } from "../providers/authService";

import { Section } from "../components/elements/Section";
import { useTaskForm } from "../components/admin/TaskForm";
import { useLocationForm } from "../components/admin/LocationForm";
import { AdminBlock } from "../components/admin/AdminBlock";
import { useGameForm } from "../components/admin/GameForm";


export default function Admin() {
    const { TaskForm, taskFormData } = useTaskForm();
    const [tasks, setTasks] = useState([]);

    const { LocationForm, locationFormData } = useLocationForm();
    const [locations, setLocations] = useState([]);

    const { GameForm, gameFormData } = useGameForm();
    const [games, setGames] = useState([]);

    useEffect(() => {
        updateLocationList();
        updateTaskList();
        updateGameList();
    }, []);

    const updateTaskList = () => {
        api.get("tasks")
            .then((res) => {
                setTasks(res.data);
            })
            .catch((exc) => {
                console.error(exc);
            });
    }
    const handleAddTask = (data) => {
        api.post("tasks/", { ...data })
            .then((res) => {
                updateTaskList();
            })
            .catch((exc) => {
                console.error(exc);
            });
    };
    const handleRemoveTask = (id) => {
        api.delete(`tasks/${id}/`)
            .then((res) => {
                updateTaskList();
            })
            .catch((exc) => {
                console.error(exc);
            });
    };

    const updateLocationList = () => {
        api.get("locations")
            .then((res) => {
                setLocations(res.data);
            })
            .catch((exc) => {
                console.error(exc);
            });
    };
    const handleAddLocation = (data) => {
        api.post("locations/", { ...data })
            .then((res) => {
                updateLocationList();
            })
            .catch((exc) => {
                console.error(exc);
            });
    };
    const handleRemoveLocation = (id) => {
        api.delete(`locations/${id}/`)
            .then((res) => {
                updateLocationList();
            })
            .catch((exc) => {
                console.error(exc);
            });
    };

    const updateGameList = () => {
        api.get("games")
            .then((res) => {
                setGames(res.data);
            })
            .catch((exc) => {
                console.error(exc);
            });
    };
    const handleAddGame = (data) => {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("map", data.map);

        api.post("games/", formData)
            .then((res) => {
                updateGameList();
            })
            .catch((exc) => {
                console.error(exc);
            });
    };
    const handleRemoveGame = (id) => {
        api.delete(`games/${id}/`)
            .then((res) => {
                updateGameList();
            })
            .catch((exc) => {
                console.error(exc);
            });
    };

    return (
        <section className="admin-wrapper">
            <Section className="admin-title-wrapper">
                <h1 className="admin-title">Admin Panel</h1>
            </Section>

            <AdminBlock
                title="Локации"

                titleModal="Добавить Локацию"
                formModal={LocationForm}
                onOkModal={() => handleAddLocation(locationFormData)}

                dataSource={locations}
                renderItem={(location) => (
                    <div
                        key={`location_${location.id}`}
                        className="location-block"
                    >
                        <Avatar>{location.id}</Avatar>

                        <div className="location-block-middle">
                            <span className="location-block-title">
                                {location.name}
                            </span>
                            <p>
                                {location.position || "Положение отсутствует"}
                            </p>
                        </div>

                        <Button
                            size="small"
                            variant="solid"
                            color="danger"
                            onClick={() => handleRemoveLocation(location.id)}
                        >
                            <DeleteOutlined />
                        </Button>
                    </div>
                )}
            />

            <AdminBlock
                title="Задания"
                addClick={() => setIsOpenaAddTask(true)}

                titleModal="Добавить Задание"
                formModal={TaskForm}
                onOkModal={() => handleAddTask(taskFormData)}
                
                dataSource={tasks}
                renderItem={(task) => (
                    <div key={`task_${task.id}`} className="task-block">
                        <Avatar>{task.id}</Avatar>

                        <p>{task.text}</p>

                        <Button
                            size="small"
                            variant="solid"
                            color="danger"
                            onClick={() => handleRemoveTask(task.id)}
                        >
                            <DeleteOutlined />
                        </Button>
                    </div>
                )}
            />

            <AdminBlock
                className="admin-game-block"

                layout="grid"

                title="Игры"
                addClick={() => setIsOpenaAddTask(true)}

                titleModal="Добавить Игру"
                formModal={GameForm}
                onOkModal={() => handleAddGame(gameFormData)}

                dataSource={games}
                renderItem={(game) => (
                    <Link key={`game_${game.id}`} to={`/admin/game/${game.code}/`} className="game-block">
                        <img height={100} src={game.game_map} />

                        <div>
                            <h4 className="game-block-title">{game.name}</h4>
                            <p>{game.code}</p>
                        </div>

                        <div className="game-block-buttons">
                            <Button
                                size="small"
                                variant="solid"
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                Начать
                            </Button>
                            <Button
                                size="small"
                                variant="solid"
                                color="danger"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveGame(game.code);
                                }}
                            >
                                <DeleteOutlined />
                            </Button>
                        </div>
                    </Link>
                )}
            />
        </section>
    );
}
