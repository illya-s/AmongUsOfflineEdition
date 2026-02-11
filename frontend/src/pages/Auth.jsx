import "./Auth.css";
import { config } from "@/config";
import { Section } from "../components/elements/Section";
import { useMessageApi } from "../providers/MessageProvider";

import axios from "axios";
import qs from "qs";
import { useNavigate } from "react-router";

import { Input, Button } from "antd";
import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "../providers/useAuth";
import { enter, request } from "../providers/authService";

export default function Auth() {
	const { user, accessToken, setAccessToken, deviceId } = useAuth();

	const navigate = useNavigate();
	const message = useMessageApi();

	const [isRequest, setIsRequest] = useState(true);

	const [email, setEmail] = useState("");
	const [emailIsValid, setEmailIsValid] = useState(null);

	const [code, setCode] = useState();

	const handleRequest = async () => {
		if (!email || !emailIsValid) {
			setEmailIsValid(false);
			return;
		}
		setIsRequest(false);

		const res = await request(email);
		if (res.success) {
			message.success(res.message);
		} else {
			message.error(res.message);
			setIsRequest(true);
		}
	};

	const handleEnter = async () => {
		if (!email || !code) {
			message.error("Требуется адрес электронной почты и код");
			return;
		}

		const res = await enter(email, code, deviceId);
		if (res.success) {
			message.success(res.message);

			message.success(res.message);
			setAccessToken(res.access_token);
		} else {
			message.error(res.message);
		}
	};

	useEffect(() => {		
		if (email == null || email == "") {
			setEmailIsValid(null);
		} else {
			const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			setEmailIsValid(re.test(email));
		}
	}, [email]);

	useEffect(() => {
		if (code) {
			handleEnter();
		}
	}, [code]);

	useEffect(() => {
		if (user) {
			navigate("/chat");
		}
	}, [user]);

	return (
		<Section className="auth-wrapper">
			{isRequest ? (
				<form
					method="post"
					className="auth-content-form"
					onSubmit={(e) => {
						e.preventDefault();
						handleRequest()
					}}
				>
					<h1>Авторизация</h1>

					<div className="auth-content-form-block">
						<input
							type="email"
							placeholder="example@email.com"
							value={email}
							onInput={(e) => setEmail(e.target.value)}
							// status={
							// 	emailIsValid === null
							// 		? ""
							// 		: emailIsValid
							// 			? ""
							// 			: "warning"
							// }
						/>
						{emailIsValid == false && (
							<p className="auth-form-warning">
								Пожалуйста, введите корректный адрес электронной
								почты!
							</p>
						)}
					</div>

					<button
						type="submit"
					>
						Далее
					</button>
				</form>
			) : (
				<form
					method="post"
					className="auth-content-form"
					onSubmit={(e) => {
						e.preventDefault();
						handleEnter()
					}}
				>
					<div className="auth-content-form-block">
						<span>Введите код</span>
						<Input.OTP
							formatter={(str) => str.replace(/\D/g, "")}
							maxLength={6}
							onChange={(value) => setCode(value)}
						/>
					</div>

					<button
						// color="primary"
						// variant="solid"
						type="submit"
					>
						Далее
					</button>
				</form>
			)}
		</Section>
	);
}
