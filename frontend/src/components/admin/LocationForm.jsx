// admin/LocationForm

import "./LocationForm.css";

import { Input } from "antd";
import { useState } from "react";

export function useLocationForm() {
    const [text, setText] = useState("");
    const [position, setPosition] = useState("");

    const LocationForm = (
        <form className="admin-form-wrapper">
            <label>
                <span>Название</span>

                <Input
                    value={text}
                    onInput={(e) => setText(e.target.value)}
                    placeholder="Введите название локации"
                />
            </label>

            <label>
                <span>Положение</span>

                <Input
                    value={position}
                    onInput={(e) => setPosition(e.target.value)}
                    placeholder="Введите положение локации"
                />
            </label>
        </form>
    );

    return {
        LocationForm,
        locationFormData: {
            name: text,
            position: position,
        },
    };
}
