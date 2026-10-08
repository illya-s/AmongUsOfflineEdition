/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
        act(() => firstSocket.onopen());
        expect(setLoading).toHaveBeenLastCalledWith(false);

        act(() => firstSocket.onclose({ code: 1006 }));
        expect(setLoading).toHaveBeenLastCalledWith(true);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });
        expect(MockWebSocket.instances).toHaveLength(2);

        const reconnectedSocket = MockWebSocket.instances[1];
        act(() => reconnectedSocket.onopen());
        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect(result.current.gameSocket).toBe(reconnectedSocket);

        unmount();
    });
});
