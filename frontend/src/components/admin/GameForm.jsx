// admin/TaskForm

import "./LocationForm.css";

import { Button, Input, Space, Upload } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
};
const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
        message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
};

export function useGameForm() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState();
    const [file, setFile] = useState(null);

    const formData = new FormData();

    const handleChange = (info) => {
        if (info.file.status === "uploading") {
            setLoading(true);
            return;
        }
        if (info.file.status === "done") {
            const origin = info.file.originFileObj;
            setFile(origin);

            getBase64(origin, (url) => {
                setLoading(false);
                setImageUrl(url);
            });
        }
    };

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
                    beforeUpload={beforeUpload}
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
    };
}
