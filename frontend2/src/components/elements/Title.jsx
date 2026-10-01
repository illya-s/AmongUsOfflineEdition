import { theme } from "antd"

export function Title({ children }) {
	const { token } = theme.useToken();

	return (
		<h1
			style={{
				padding: `${token.paddingXS}px ${token.paddingSM}px`,
				border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
				borderRadius: token.borderRadiusLG,
				backgroundColor: token.colorBgContainer,

				fontSize: token.fontSizeHeading1,
				fontWeight: 700,
				color: token.colorTextHeading
			}}
		>
			{children}
		</h1>
	)
}