# AGENTS.md — Django & React Project Guidelines

## Core Principles
1. **Divide and Conquer**: Break down complex tasks, large components, and monolithic backend modules into small, decoupled, highly cohesive parts.
2. **Minimal External Dependencies**: Rely on standard libraries (Django built-ins, React hooks) wherever possible. Evaluate third-party packages strictly for critical needs.
3. **Component Decomposition**: Never allow large files. Split React components as soon as they exceed ~150 lines or handle multiple responsibilities. Extract business logic into Django services/selectors.
4. **Test-Driven & Robust**: Always write tests for new code and bug fixes. Run tests, catch and fix errors iteratively before finalizing any task.
5. **Strict Transparency**: Clearly outline all completed changes in a numbered list (1. ..., 2. ..., 3. ...).
6. **Documentation First**: Always document architectural and functional changes inside the `/docs` directory.
7. **ADR Tracking**: Record all significant architectural decisions in `/docs/ADR/`.

---

## Architecture & Code Structure

### Backend (Django / Django REST Framework)
* **Layered Architecture**: Keep views thin. Use services for business logic and selectors for database queries.
* **Apps Structure**: Isolate functionality into dedicated Django apps.
* **Settings**: Keep configurations clean and modular (e.g., `base.py`, `development.py`, `production.py`).

### Frontend (React / TypeScript / Vite)
* **Feature-Based Structure**: Organize components by feature modules or atomic design principles (`components`, `hooks`, `services`, `types`).
* **State Management**: Prefer React local state and Context API before introducing external state management libraries.
* **Styling**: Keep styling consistent, modular, and aligned with project conventions.

---

## Testing Standards

* **Backend**: Write unit and integration tests using Django's built-in `TestCase` or `pytest-django`. Maintain high test coverage.
* **Frontend**: Test components and hooks using React Testing Library and Jest/Vitest.
* **Execution**: Always run the test suite after implementing changes to ensure no regressions occur.

---

## Documentation & ADR Workflow

* **Changes Tracking (`/docs`)**: Update relevant documentation files in `/docs` whenever adding features, updating APIs, or modifying deployment flows.
* **Architecture Decision Records (`/docs/ADR/`)**: Create a new Markdown file for any major technical decision using the standard ADR format:
  * **Status**: (Proposed / Accepted / Rejected)
  * **Context**: What is the issue we are seeing?
  * **Decision**: What is the change we are committing to?
  * **Consequences**: What becomes easier or harder as a result?

---

## Output & Reporting Requirements

When completing a task, always structure your final response with:
1. **Summary of Changes**: A precise, numbered list (1. ..., 2. ..., 3. ...).
2. **Testing Results**: Confirmation that tests were run and passed.
3. **Documentation Updates**: Links or references to updated files in `/docs` and `/docs/ADR/`.