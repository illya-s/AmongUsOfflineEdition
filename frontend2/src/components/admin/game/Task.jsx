import style from "./Task.module.css"
import { Avatar } from "antd";

export default function Task({ task }) {
    return (
        <div className={style.task}>
            <Avatar>{task.id}</Avatar>
            
            <div className={style.center}>
                <span className={style.name}>{task.task.text}</span>
                <span className={style.text}>{task.player ? task.player.name : "Игрок не установлен"}</span>
            </div>
        </div>
    )
}