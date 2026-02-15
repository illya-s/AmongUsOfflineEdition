import {
    DeleteFilled,
    PauseCircleFilled,
    PictureFilled,
    PlayCircleFilled,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Modal, Statistic, Upload } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router"
import { sendWithAck } from "../../../lib/api/sendWithAck";
import { api } from "../../../providers/authService";
import { Section } from "../../elements/Section";
import styles from "./AdminTopContainer.module.css";

export function AdminTopContainer({ gameSocket, game }) {
    const navigate = useNavigate();
    
    const [isMapModalVisible, setIsMapModalVisible] = useState(false);
    const [isUploadingMap, setIsUploadingMap] = useState(false);

    const handleMapUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            setIsUploadingMap(true);
            sendWithAck(gameSocket, {
                action: "change_map",
                data: { game_map: base64 },
            })
                .then(() => {
                    message.success("Карта успешно обновлена");
                    setIsMapModalVisible(false);
                })
                .catch((err) => {
                    message.error(`Ошибка: ${err.message}`);
                })
                .finally(() => {
                    setIsUploadingMap(false);
                });
        };
        reader.readAsDataURL(file);
        return false;
    };

    const handleToggleGame = () => {
        sendWithAck(gameSocket, {
            action: "change_game",
            data: { value: !game?.active },
        }).catch((exc) => {
            console.error(`${exc.code}: ${exc.message}`);
        });
    };

    const handleRemoveGame = () => {
        api.delete(`games/${game?.code}/`)
            .then((res) => {
                gameSocket.close();
                navigate("/admin/");
            })
            .catch((exc) => {
                console.error(exc);
            });
    };

    return (
        <Section className={styles.wrapper}>
            <div className={styles.info}>
                <Avatar className={styles["info-avatar"]} size="large">
                    {game?.id}
                </Avatar>

                <h1 className={styles["info-title"]}>{game?.name}</h1>
                <p className={styles["info-code"]}>{game?.code}</p>
            </div>

            <Button
                variant="solid"
                color={!game?.active ? "primary" : "green"}
                shape="circle"
                size="middle"
                icon={
                    !game?.active ? (
                        <PlayCircleFilled size="large" />
                    ) : (
                        <PauseCircleFilled size="large" />
                    )
                }
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleGame();
                }}
            />

            <Button
                icon={<PictureFilled />}
                onClick={() => setIsMapModalVisible(true)}
                disabled={game?.active}
                title="Изменить карту"
            />

            {game?.active ? (
                <div>
                    <Badge color="green" text="Активна" />

                    <Statistic.Timer
                        type="countup"
                        value={new Date(game?.start_time).getTime()}
                    />
                </div>
            ) : (
                <Badge color="red" text="Не активна" />
            )}

            <Button
                variant="solid"
                color="danger"
                shape="circle"
                size="middle"
                icon={<DeleteFilled />}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveGame(game.code);
                }}
                disabled={game?.active}
            />

            <Modal
                title="Изменить карту"
                open={isMapModalVisible}
                onCancel={() => setIsMapModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Upload.Dragger
                    accept="image/*"
                    beforeUpload={handleMapUpload}
                    showUploadList={false}
                    disabled={isUploadingMap}
                >
                    <p className="ant-upload-drag-icon">
                        <PictureFilled />
                    </p>
                    <p className="ant-upload-text">
                        Нажмите или перетащите изображение для обновления карты
                    </p>
                </Upload.Dragger>
            </Modal>
        </Section>
    );
}
