# AGENTS.md — vacacionesGyJ

G&J Vacaciones: Spanish corporate vacation-management intranet. Two stacks connected via HTTP + Socket.io on `127.0.0.1:5000`.

## Architecture & Layout

- `frontend/` — React 19 + Vite 8 SPA (JS/JSX only, **no TypeScript**, no automated tests).
- `backend/` — Flask + Flask-SocketIO single-file monolith (`app.py`, ~1900 lines). Connected to two SQL Server instances via `pyodbc`.
- `backend/planos_unoee/` — Contains Excel template (`ARCHIVO PLANO TNL-VACACIONES.xlsx`) for generating flat files.
- `backend/plantilla_doc/plantilla.md` — PDF generation specification doc for ReportLab export.
- `guias/instrucciones.md` — Requirements and technical specification for `generar_plano` endpoint.

## Commands

### Backend (`backend/`)
```bash
cd backend
pip install -r requirements.txt
python app.py  # Runs on 127.0.0.1:5000 via socketio.run
```

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev    # Vite dev server
npm run build  # Production build to dist/
npm run lint   # ESLint checks (runs eslint .)
```

## Critical Operational Quirks & Database Rules

### Dual Database Setup
`.env` file in `backend/` is **mandatory**. Missing variables cause connection functions to return `None`, leading to HTTP 500 errors.
- `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DRIVER` → Read-only source of truth (`BD_Integraciones`, table `PBI_Colaborador_Vacaciones`).
- `DB_SERVER2`, `DB_NAME2`, `DB_USER2`, `DB_PASSWORD2`, `DB_DRIVER2` → Write DB (`vacacionesgyj`, tables `inf_asignacion`, `notificaciones`, `users`).
- Env vars are evaluated at module load time; server must be restarted after editing `.env`.
- Flask entry point uses `socketio.run(app, ...)` under `if __name__ == '__main__'`; do not run with plain `flask run`.

### UNES Identifier Formats
- Read DB (`PBI_Colaborador_Vacaciones`): UNES is stored in `IDCia_CO` (queried by last 3 digits, e.g. `106`).
- Write DB (`inf_asignacion`): UNES is stored prefixed as `2-{unes}` (e.g. `2-106`).
- Always keep these two representations distinct when filtering or writing records.

### Authentication & Users
- Authentication validates against `vacacionesgyj.dbo.users`.
- Passwords use Werkzeug hashes (`generate_password_hash`/`check_password_hash`). Legacy plain text passwords are supported via `secrets.compare_digest`.
- API responses omit raw password hashes for security (`has_password` and `password_is_hashed` flags are sent instead).
- Hardcoded Talento Humano emails (`TALENTO_HUMANO_USERS` in `frontend/src/constants/talentohumano.js`) can bypass UNES checks during login or act as admins.

### Key Endpoints
- `GET /pbi-colaborador-vacaciones?unes=XXX` — Validates UNES existence or lists employees merged with `inf_asignacion`.
- `POST /registrar_data` / `PUT /actualizar_data/<identificacion>` — Inserts/updates vacation assignments in `inf_asignacion`.
- `POST /usuarios_nuevos` / `GET /get_usuarios` / `PUT /update_usuario/<id>` / `DELETE /delete_usuario/<id>` — User management.
- `POST /exportar_reporte_pdf` — Generates ReportLab PDF (`2-{unes}_vacaciones.pdf`).
- `POST /generar_plano` — Generates Excel flat file (`.xlsx`) using `openpyxl` from template `planos_unoee/ARCHIVO PLANO TNL-VACACIONES.xlsx`.
- Socket.io events: `approve_request`, `reject_request`, `assign_dates`, `request_notifications` (persisted to `notificaciones` DB).

### Repositories & Build Quirks
- `@rolldown/plugin-babel` with React Compiler preset is used in `vite.config.js`; ESLint enforces React Hooks rules strictly.
- Backend contains a committed `__pycache__` directory and generated files in `planos_unoee/`; ensure new scratch files or temporary build artifacts are handled carefully or ignored.
