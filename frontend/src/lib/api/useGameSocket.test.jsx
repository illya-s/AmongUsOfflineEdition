/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useGameSocket } from "./useGameSocket";

class MockWebSocket {
	static OPEN = 1;
	static instances = [];

	constructor(url) {
		this.url = url;
		this.readyState = MockWebSocket.OPEN;
		MockWebSocket.instances.push(this);
	}

	close(code = 1000) {
		this.readyState = 3;
		this.onclose?.({ code });
	}
}

describe("useGameSocket", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		MockWebSocket.instances = [];
		vi.stubGlobal("WebSocket", MockWebSocket);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("clears loading after a reconnect succeeds", async () => {
		const setLoading = vi.fn();
		const { result, unmount } = renderHook(() =>
			useGameSocket("ROOM42", "player-1", vi.fn(), setLoading),
		);

		const firstSocket = MockWebSocket.instances[0];
		await act(() => firstSocket.onopen());
		expect(setLoading).toHaveBeenLastCalledWith(false);

		await act(() => firstSocket.onclose({ code: 1006 }));
		expect(setLoading).toHaveBeenLastCalledWith(true);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(MockWebSocket.instances).toHaveLength(2);

		const reconnectedSocket = MockWebSocket.instances[1];
		await act(() => reconnectedSocket.onopen());
		expect(setLoading).toHaveBeenLastCalledWith(false);
		expect(result.current.gameSocket).toBe(reconnectedSocket);

		unmount();
	});

	it("does not reconnect when the server rejects a deleted room", async () => {
		const setLoading = vi.fn();
		const { unmount } = renderHook(() => useGameSocket("ROOM42", "player-1", vi.fn(), setLoading));

		const socket = MockWebSocket.instances[0];
		await act(() => socket.onopen());
		await act(() => socket.onclose({ code: 4004 }));

		expect(setLoading).toHaveBeenLastCalledWith(null);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10_000);
		});
		expect(MockWebSocket.instances).toHaveLength(1);

		unmount();
	});
});
