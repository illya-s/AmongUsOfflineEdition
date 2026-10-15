// admin/TaskForm

import styles from "./LocationForm.module.css";

import { Input } from "antd";
import { useState } from "react";

export function useTaskForm() {
  const [text, setText] = useState("");

  const TaskForm = (
    <form className={styles.adminFormWrapper}>
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
