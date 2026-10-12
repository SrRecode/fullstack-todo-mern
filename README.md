# Daymark

Daymark is a personal task manager for making your day feel a little more manageable. Keep everyday errands, study plans, side projects, and work follow-ups in one calm, searchable list. It runs on the MERN stack—MongoDB, Express, React, and Node.js—and can also use a local JSON file so you can try it without setting up a database.

## What you can do

- Create, edit, complete, and delete tasks.
- Add optional notes, a low/medium/high priority, and a due date.
- Search task titles and notes; filter by completion status and priority.
- Sort by due date and see at-a-glance counts for open tasks, items due today, and completed tasks.
- Use the responsive dashboard on a phone, tablet, or desktop. Keyboard focus states, accessible labels, reduced-motion support, and clear loading, empty, and error states are included.
- Keep data local in a JSON file for personal, single-user use, or connect MongoDB for a database-backed deployment.

There are no accounts, trackers, collaboration features, or third-party service integrations. The optional Google Fonts import only affects typography; the app itself does not depend on it.

## Requirements

- Node.js 18.18 or newer (Node 20+ recommended) and npm.
- MongoDB Community Server or MongoDB Atlas only if you choose MongoDB storage. No database is needed for the default local file mode.

## Get started

From the repository root:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

Copy `.env.example` to `.env` in the repository root and adjust it if needed. The default `STORAGE_MODE=file` is ready to use. Start the API and frontend together:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development server forwards `/api` requests to the Express server at `http://localhost:4000`. Your first task can be added with **New task**; nothing is pre-seeded.

### Storage options

**Local file (default):** `STORAGE_MODE=file`. Task data is saved to `server/data/tasks.json`, created on the first write. This is convenient for local personal use and demos, but it is not a multi-user database and should not be used by multiple server processes sharing the same file.

**MongoDB:** Set `STORAGE_MODE=mongodb` and provide a reachable `MONGODB_URI`, for example `mongodb://127.0.0.1:27017/daymark`. Start MongoDB first. The server fails at startup with an actionable message if the URI is missing or the database cannot be reached; it does not silently switch storage backends.

| Variable | Default | Purpose |
| --- | --- | --- |
| `STORAGE_MODE` | `file` | `file` or `mongodb` |
| `PORT` | `4000` | Express API port |
| `MONGODB_URI` | — | Required for MongoDB mode |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed browser origin for API CORS |

## Production build

Build the frontend:

```bash
npm run build
```

Run the API in production mode with `npm start` from the repository root. Deploy the generated `client/dist` directory using a static host and the API using a Node.js host; configure the deployment's frontend origin with `CLIENT_ORIGIN`. This scaffold does not include a production web-server/static-file integration, hosting configuration, HTTPS termination, or MongoDB provisioning.

## API

All endpoints are under `/api`; task records contain `id`, `title`, `notes`, `priority`, `dueDate`, `completed`, `createdAt`, and `updatedAt`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/tasks` | List tasks, newest first |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update one or more task fields |
| `DELETE` | `/api/tasks/:id` | Delete a task |

Task input is validated: titles are required (up to 120 characters), notes are optional (up to 2,000 characters), priorities must be `low`, `medium`, or `high`, due dates must be valid `YYYY-MM-DD` dates or `null`, and completion must be a boolean. Invalid input returns `400`, missing tasks return `404`, and unexpected server errors return a readable `500` response.

Example:

```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Water the plants","notes":"Check the balcony pots too","priority":"low","dueDate":"2026-10-12"}'
```

## Tests and project layout

Run the API validation and file-storage integration tests:

```bash
npm test
```

Build the client with TypeScript checks:

```bash
npm run build
```

```text
client/                 React + TypeScript app, Vite config, responsive UI
  src/App.tsx           Dashboard, filters, task actions, and create/edit dialog
  src/styles.css        Layout, responsive styles, and interaction states
server/                 Express API, validation, and storage adapters
  src/app.js            Task and health endpoints
  src/storage.js        MongoDB model and atomic JSON-file persistence
  src/validation.js     Shared request validation
  src/*.test.js         Validation and API integration tests
.env.example            Storage and server configuration template
```

## Scope and privacy

Daymark is a practical starter application rather than a hosted service. It has no authentication or per-user authorization: anyone who can reach the API can access its tasks. Keep a deployment private or add authentication and authorization before exposing it to multiple users. Local JSON data lives on the server and is not encrypted by the app. There is no automated cloud backup, recurring-task support, notification delivery, or calendar sync.
