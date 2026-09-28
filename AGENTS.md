# AGENTS.md — vacacionesGyJ

G&J Vacaciones: a Spanish corporate vacation-management intranet. Two stacks that talk over HTTP + Socket.io on `127.0.0.1:5000`.

## Layout

- `frontend/` — React 19 + Vite 8 SPA (JS/JSX only, **no TypeScript**, no tests).
- `backend/` — Flask + Flask-SocketIO single-file app (`app.py`, ~1300 lines). SQL Server via `pyodbc`.
- `guias/areas_106.txt` — list of UNES area names (used for `desc_unes`).
- `backend/estructura.txt` / `backend/tablas_modificar.txt` — hand-written schema docs (see quirks below).

## Backend (`backend/`)

```bash
cd backend
pip install -r requirements.txt     # flask, flask-cors, flask-socketio, pyodbc, python-dotenv, reportlab
python app.py                        # starts on 127.0.0.1:5000
```

- **`.env` is mandatory.** Required keys (missing → connection returns `None` → endpoints 500):
  - `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DRIVER` → BD_Integraciones (read-only source of truth, table `PBI_Colaborador_Vacaciones`)
  - `DB_SERVER2`, `DB_NAME2`, `DB_USER2`, `DB_PASSWORD2`, `DB_DRIVER2` → `vacacionesgyj` (write DB, tables `inf_asignacion`, `notificaciones`)
  - `PORT2` (default 5000), `DEBUG2` (default `True`)
- `load_dotenv()` runs at import; env vars are read at module load, so a running server needs a restart after `.env` changes.
- App entry is `if __name__ == '__main__'` — it will **not** start under plain `flask run`.
- Key endpoints: `GET /pbi-colaborador-vacaciones[?unes=&limit=]`, `POST /registrar_data`, `GET /ver_data/<id>`, `PUT /actualizar_data/<id>`, `GET /obtener_data/<unes>`, `POST /marcar_notificaciones_leidas`, `GET|POST /exportar_reporte_pdf`.
- Socket.io events: `approve_request`, `reject_request`, `assign_dates`, `request_notifications`. Notifications are persisted to `notificaciones` **and** emitted in real time.
- PDF export uses **reportlab** (not WeasyPrint — `plantilla.md`'s reference code is aspirational): A4 landscape, 6 mm margins, 23 fixed columns, green `#00B050` / blue `#0070C0` super-headers. Filename is `2-{unes}_vacaciones.pdf`.

## Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev     # vite dev server
npm run build   # -> dist/
npm run lint    # eslint .  (only linter; no typecheck, no tests)
```

- Vite config wires the React plugin **plus** `@rolldown/plugin-babel` with the React-Compiler preset — the compiler is on, so hooks rules are enforced by `eslint-plugin-react-hooks`.
- API base URL is **hardcoded** to `http://127.0.0.1:5000` in `src/views/Login.jsx` and `src/views/Home.jsx`. The Socket.io client (`src/services/socket.js`) honors `VITE_SOCKET_URL` and falls back to the same URL.
- Routes: `/` (Login), `/home` (Home), and `/adminstrador` (Admin view). Header hides on `/`.
- Login logic: email + UNES (exactly 3 digits). Three hardcoded Talento Humano emails (`talentohumano@gyj.com.co`, `direccion_th@gyj.com.co`, `auxiliar.nomina@gyj.com.co`) skip the UNES check. Other users' UNES is validated against the backend with a 5 s timeout + 350 ms debounce; result is cached 5 min.
- State is only `localStorage` (`userUnes`, `userEmail`) — no auth tokens, no router guards.
- `src/components/Header.jsx` renders the global navbar. The **logo** is clickable and routes to `/home`. The **Administrador** button (`variant="link"`, borderless, class `admin-btn`) routes to `/adminstrador`. The notification bell dropdown honors `isTalentoHumano` to filter by UNES.
- `src/components/NuevoUsuarioModal.jsx` is a demo-only "Nuevo Usuario" modal (fields: nombre, correo, cargo, password, UNES). It does **not** talk to the backend — data is discarded on close.
- `src/views/adminstrador.jsx` is the admin view: Section 1 holds the **Nuevo Usuario** button (right-aligned); Section 2 is a two-column layout — left lists registered users (demo data, no DB), right shows the selected user's details (nombre, email, cargo, UNES, password). A **Regresar** button sits to the right of "Nuevo Usuario" and calls `window.history.back()`.

## Cross-cutting quirks

- **UNES** is a 3-digit area code; the write DB stores it as `2-{unes}` (e.g. `2-106`). The read DB (`PBI_Colaborador_Vacaciones`) stores the last 3 chars of `IDCia_CO`. Don't conflate the two formats.
- Schema docs are stale/inconsistent: `estructura.txt` omits `th_asignacion` (added later) and says `fecha_regreso` is `NOT NULL`, while `tablas_modificar.txt` says it allows NULL. Trust `app.py` — it always supplies a value.
- `inf_asignacion` has an identity `id` PK, but the app queries/merges on `identificacion` and `unes` (indexes `IX_inf_asignacion_identificacion` / `IX_inf_asignacion_unes` exist).
- `errores.txt` is empty and appears to be a scratch file, not a spec.
- No CI, no `.gitignore`, no tests anywhere. `backend/__pycache__` is committed-able — add it to `.gitignore` before sharing.