# ADR 0001: Frontend game flow stability improvements

- Status: Accepted
- Date: 2026-10-12

## Context
The frontend game flow needed consistent state transitions during socket reconnects and link-copy interactions. The app had to remain robust when WebSocket reconnects occurred and when users copied room links from the UI. A production build and tests were used as validation points to catch regressions.

## Decision
We kept the reconnection logic in the hook layer, ensured loading state resets when reconnect succeeds, and kept the copy-link flow as a lightweight UI helper with a clear fallback path for browsers without the Clipboard API. The QR code component was also extracted and covered with tests so it can react to code changes without manual checking.

## Consequences
- The game UI remains stable while reconnecting to the server.
- Copy actions are more resilient across browsers and permission scenarios.
- Future changes to the game flow are easier to validate with targeted tests.
- The project now documents significant UI-level decisions in the docs tree for easier maintenance.
