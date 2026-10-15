/** @vitest-environment jsdom */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import GameQRCode from "./GameQRCode";

describe("GameQRCode", () => {
	it("renders the QR code when its game code arrives or changes", () => {
		const { container, rerender } = render(<GameQRCode code={undefined} />);
		expect(container.querySelector("svg")).toBeNull();

		rerender(<GameQRCode code="ROOM42" />);
		const firstCode = container.querySelector("svg")?.innerHTML;
		expect(firstCode).toBeTruthy();

		rerender(<GameQRCode code="ROOM43" />);
		const updatedCode = container.querySelector("svg")?.innerHTML;
		expect(updatedCode).toBeTruthy();
		expect(updatedCode).not.toBe(firstCode);
	});
});
