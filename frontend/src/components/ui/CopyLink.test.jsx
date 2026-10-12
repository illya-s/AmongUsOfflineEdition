/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CopyLink from "./CopyLink";

describe("CopyLink", () => {
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it("copies the URL through the Clipboard API when available", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
		const { getByRole } = render(<CopyLink href="/game/ROOM42">Link</CopyLink>);

		fireEvent.click(getByRole("button"));

		await waitFor(() =>
			expect(writeText).toHaveBeenCalledWith(
				`${window.location.origin}/game/ROOM42`,
			),
		);
	});

	it("falls back to document copy when the Clipboard API is unavailable", async () => {
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: undefined,
		});
		const execCommand = vi.fn(() => true);
		Object.defineProperty(document, "execCommand", {
			configurable: true,
			value: execCommand,
		});
		const { getByRole } = render(<CopyLink href="/game/ROOM42">Link</CopyLink>);

		fireEvent.click(getByRole("button"));

		await waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
		await waitFor(() => expect(getByRole("button").title).toBe("Скопировано!"));
		expect(document.querySelector("textarea")).toBeNull();
	});
});
