# DMetrics

DMetrics is a full-stack engineering productivity dashboard. It combines sprint planning, task and project tracking, pull-request reviews, deployment telemetry, team profiles, GitHub synchronization, AI-assisted workflows, and real-time updates in a single workspace.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript, Zod |
| Real-time | Socket.IO |
| Data | MongoDB with Mongoose; file-backed development fallback |
| Security | JWT authentication, bcrypt password hashing, Helmet, CORS |

## Repository layout

```text
src/                    React application
  components/           Dashboard views, modals, and shared UI
  context/              Application state and authentication
  services/             REST API and Socket.IO clients
server/                 Express API
  src/controllers/      API request handlers
  src/routes/           API route definitions
  src/models/           Mongoose models
  src/services/         AI, GitHub, and Socket.IO services
  src/tests/            API integration test suite
  data/store.json       Local development fallback data
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB locally or a MongoDB Atlas cluster (recommended)

## Local setup

1. Install both applications' dependencies.

   ```bash
   npm install
   npm --prefix server install
   ```

2. Create the backend environment file from the committed template.

   **PowerShell**

   ```powershell
   Copy-Item .env.example server/.env
   ```

   **macOS/Linux**

   ```bash
   cp .env.example server/.env
   ```

3. Update `server/.env`. At minimum, provide a strong `JWT_SECRET`. To use MongoDB, set `MONGODB_URI` to a valid connection string; do not include angle brackets around credentials.

4. Start frontend and backend together.

   ```bash
   npm run dev:all
   ```

   - Frontend: `http://localhost:3000`
   - API: `http://localhost:5000/api`
   - API documentation: `http://localhost:5000/api/docs`
   - Health check: `http://localhost:5000/api/health`

## Environment variables

Never commit `server/.env`, API keys, database passwords, access tokens, or production secrets. `.env.example` is safe to commit because it contains placeholders only.

### Backend (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port; defaults to `5000`. Hosting providers usually supply this. |
| `NODE_ENV` | No | `development`, `test`, or `production`. |
| `API_PREFIX` | No | API path prefix; defaults to `/api`. |
| `CORS_ORIGIN` | Yes in production | Comma-separated approved frontend origins. |
| `JWT_SECRET` | Yes | Long, unique secret used to sign authentication tokens. |
| `MONGODB_URI` | Yes in production | MongoDB or Atlas connection URI. |
| `GITHUB_TOKEN` | No | Enables GitHub repository synchronization. |
| `OPENAI_API_KEY` | No | Enables an OpenAI-compatible AI provider. |
| `OPENAI_BASE_URL` | No | OpenAI-compatible provider base URL. |
| `OPENAI_MODEL` | No | Model name for the configured provider. |
| `GROQ_API_KEY` | No | Optional Groq provider key. |
| `GEMINI_API_KEY` | No | Optional Gemini provider key. |

Example production values:

```env
NODE_ENV=production
API_PREFIX=/api
CORS_ORIGIN=https://your-app.example.com
JWT_SECRET=replace-with-a-long-random-secret
MONGODB_URI=mongodb+srv://database-user:encoded-password@cluster.example.mongodb.net/dmetrics?retryWrites=true&w=majority
```

### Frontend build environment

When frontend and backend are deployed to separate domains, configure this in the frontend host's build settings:

```env
VITE_API_URL=https://your-api.example.com
```

`VITE_` variables are embedded in browser code. Use them only for public values such as an API URL—never secrets. If omitted locally, the app uses `http://localhost:5000`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend. |
| `npm run dev:all` | Start frontend and backend concurrently. |
| `npm run build` | Type-check and build the frontend. |
| `npm run preview` | Preview the frontend production build. |
| `npm run server:dev` | Start the API with watch mode. |
| `npm run server:build` | Compile the backend. |
| `npm run server:start` | Start the compiled backend. |
| `npm run server:test` | Run backend API integration tests. |
| `npm run db:seed` | Seed MongoDB data. |

## API overview

All API endpoints are under `/api`.

| Area | Base endpoint |
| --- | --- |
| Health and docs | `/health`, `/docs`, `/docs/json` |
| Authentication | `/auth` |
| Users and teams | `/users` |
| Projects | `/projects` |
| Tasks | `/tasks` |
| Pull requests | `/prs` |
| Deployments | `/deployments` |
| Analytics | `/analytics` |
| Audit activity | `/audit` |
| AI copilot | `/ai` |
| GitHub integration | `/github` |

The Swagger UI at `/api/docs` is the source of truth for endpoint schemas and request examples.

## Real-time updates

The backend exposes Socket.IO at the API origin. The frontend connects using `VITE_API_URL` in production and receives create, update, and delete events for tasks, projects, pull requests, and deployments. Ensure the frontend deployment URL is included in `CORS_ORIGIN`.

## Database behavior

If `MONGODB_URI` is absent or MongoDB cannot be reached, the API falls back to `server/data/store.json` for local development. This fallback is not suitable for production: cloud filesystems may be ephemeral and multiple service instances do not share that file. Use MongoDB for all production deployments.

## Deployment

A practical production configuration is:

1. Deploy MongoDB through MongoDB Atlas.
2. Deploy `server/` as a persistent Node.js web service (for example, Render).
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Health check: `/api/health`
3. Deploy the repository root as a Vite static site (for example, Vercel).
   - Build: `npm run build`
   - Output directory: `dist`
4. Configure `VITE_API_URL` on the frontend host and set the exact frontend URL in the backend's `CORS_ORIGIN`.

After deployment, verify the API health endpoint, registration/login, a CRUD operation, and a real-time update from two browser tabs.

## Quality checks

Run these before opening a pull request or deploying:

```bash
npm run build
npm run server:build
npm run server:test
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API calls fail after frontend deployment | Set `VITE_API_URL` to the backend origin and rebuild the frontend. |
| Browser reports a CORS error | Add the exact frontend URL to `CORS_ORIGIN`; do not use a trailing path. |
| MongoDB TLS or connection error | Confirm the Atlas cluster is active, your public IP is in its Network Access list, and the copied URI has valid URL-encoded credentials. |
| Changes vanish after a restart | MongoDB is unavailable and the local fallback is being used; configure `MONGODB_URI`. |
| Socket updates do not arrive | Confirm backend availability, `VITE_API_URL`, and backend CORS configuration. |

## Security notes

- Rotate any credential that was ever committed, pasted into chat, or exposed in a screenshot.
- Use separate secrets for development, preview, and production.
- Restrict Atlas network access and use least-privilege database users.
- Set `CORS_ORIGIN` to explicit trusted domains in production.
