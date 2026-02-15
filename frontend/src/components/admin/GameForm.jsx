// admin/TaskForm

import "./LocationForm.css";

import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Input, Upload } from "antd";
import { useState } from "react";

const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
};
const beforeUpload = (file, setFile, setImageUrl) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
        // message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        // message.error("Image must smaller than 2MB!");
    }

    if (isJpgOrPng && isLt2M) {
        setFile(file);
        getBase64(file, (url) => {
            setImageUrl(url);
        });
    }

    return false; // Prevent automatic upload
};

export function useGameForm() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState();
    const [file, setFile] = useState(null);

    const handleChange = (info) => {
        // With beforeUpload returning false, we handle setFile there.
    };

    const reset = () => {
        setName("");
        setLoading(false);
        setImageUrl(null);
        setFile(null);
    }

    const GameForm = (
        <form className="admin-form-wrapper">
            <label>
                <span>Название</span>

                <Input
                    value={name}
                    onInput={(e) => setName(e.target.value)}
                    placeholder="Введите название игры"
                />
            </label>

            <label>
                <span>Карта</span>

                <Upload
                    accept="image/*"
                    listType="picture-card"
                    showUploadList={false}
                    type="select"
                    loading={loading}
                    onChange={handleChange}
                    maxCount={1}
                    beforeUpload={(file) => beforeUpload(file, setFile, setImageUrl)}
                >
                    {imageUrl ? (
                        <img
                            draggable={false}
                            src={imageUrl}
                            alt="avatar"
                            style={{ width: "100%" }}
                        />
                    ) : (
                        <button style={{ border: 0, background: 'none' }} type="button">
                            {loading ? <LoadingOutlined /> : <PlusOutlined />}
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </button>
                    )}
                </Upload>
            </label>
        </form>
    );

    return {
        GameForm,
        gameFormData: {
            name: name,
            map: file
        },
        reset,
    };
}
