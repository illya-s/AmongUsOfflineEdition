import { QRCodeSVG } from "qrcode.react";
import { theme } from "antd";

const GameQRCode = ({ code, size = 300 }) => {
  const { token } = theme.useToken();

  if (!code) return null;

  return (
    <QRCodeSVG
      value={`${window.location.origin}/?game=${encodeURIComponent(code)}`}
      size={size}
      bgColor="transparent"
      fgColor={token.colorPrimary}
      title={`Ссылка для подключения к игре ${code}`}
    />
  );
};

export default GameQRCode;
