// admin/TaskForm

import "./LocationForm.css";

import { Input } from "antd";
import { useState } from "react";

export function useTaskForm() {
    const [text, setText] = useState("");

    const TaskForm = (
        <form className="admin-form-wrapper">
            <Input.TextArea
                value={text}
                onInput={(e) => setText(e.target.value)}
                placeholder="Введите текст задания"
            />
        </form>
    );

    const reset = () => {
        setText("");
    };

    return {
        TaskForm,
        taskFormData: {
            text: text,
        },
        reset,
    };
}
