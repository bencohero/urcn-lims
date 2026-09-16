# Repository Guidelines

## Project Structure & Module Organization
This repository is a clinical storage monorepo. `backend/` contains the FastAPI services (`auth-service`, `core-api`, `rfid-service`, `workflow-engine`, `notification-service`, `reporting-service`, `audit-service`), shared code in `common/`, database migrations in `database/alembic/`, and Python scripts in `scripts/`. `frontend/` contains the Vite/React app, with source in `src/`, static assets in `public/`, and build output in `dist/`. Supporting docs live in `docs/`; deployment config is in `docker-compose.yml` and `nginx/`.

## Build, Test, and Development Commands
Backend setup: `cd backend && make setup && source venv/bin/activate && make install`.
Backend local stack: `cd backend && make dev` starts PostgreSQL, Redis, and RabbitMQ via Docker Compose.
Backend tests: `cd backend && make test` or `venv/bin/pytest core-api/tests -q` for targeted runs.
Backend quality: `cd backend && make lint` and `make format`.
Frontend setup: `cd frontend && pnpm install`.
Frontend dev server: `cd frontend && pnpm dev`.
Frontend checks: `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`.

## Coding Style & Naming Conventions
Use 4-space indentation in Python and 2-space indentation in frontend config files; TypeScript/TSX follows the existing formatter output. Python formatting uses `black` and `isort`; static checks use `flake8` and `mypy`. Frontend uses ESLint, Prettier, and TypeScript. Preserve existing naming patterns: Python modules and services use `snake_case`; React components, pages, and stores use `PascalCase` filenames like `AdminUsersPage.tsx`; hooks use `useX.ts`; API helpers live under `frontend/src/lib/api/`.

## Testing Guidelines
Backend tests use `pytest` and `pytest-asyncio`; place tests under each service’s `tests/` directory and name them `test_<feature>.py`. Frontend tests use `vitest`; follow `*.test.ts` or `*.test.tsx` naming when adding coverage. Keep tests focused on service behavior, permissions, and schema compatibility. Run the narrowest relevant suite before opening a PR.

## Commit & Pull Request Guidelines
Recent history favors concise, imperative commit messages such as `Add redis for auth caching` and `Fix document management: align frontend/backend schemas`. Follow that pattern: start with a verb, name the subsystem, and keep the subject line specific. PRs should include a short description, impacted services or pages, migration/config changes, linked issue if applicable, and screenshots for UI changes.

## Security & Configuration Tips
Do not commit real secrets. Use `.env.example` as the source of truth and keep local values in untracked `.env` files. Treat `backend/.env.dev` and `.env.prod` carefully, and validate auth, site permission, and token-handling changes with targeted tests before merging.
