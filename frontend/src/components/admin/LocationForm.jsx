import "./LocationForm.css";

import { Input, InputNumber, Select } from "antd";
import { useState } from "react";

export function useLocationForm(games = []) {
    const [name, setName] = useState("");
    const [room, setRoom] = useState(null);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);

    const LocationForm = (
        <form className="admin-form-wrapper">
            <label>
                <span>Игра</span>
                <Select
                    value={room}
                    onChange={setRoom}
                    options={games.map((game) => ({
                        value: game.id,
                        label: `${game.name} (${game.code})`,
                    }))}
                />
            </label>
            <label>
                <span>Название</span>
                <Input
                    value={name}
                    onInput={(event) => setName(event.target.value)}
                    placeholder="Введите название локации"
                />
            </label>
            <label>
                <span>Координата X</span>
                <InputNumber value={x} onChange={(value) => setX(value ?? 0)} />
            </label>
            <label>
                <span>Координата Y</span>
                <InputNumber value={y} onChange={(value) => setY(value ?? 0)} />
            </label>
        </form>
    );

    const reset = () => {
        setName("");
        setRoom(null);
        setX(0);
        setY(0);
    };

    return {
        LocationForm,
        locationFormData: { name, room, x, y },
        reset,
    };
}
