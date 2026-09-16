# DMetrics REST API — Users, Projects & Tasks Backend

Production-grade REST API backend powering Users, Projects, and Task Data for the **DMetrics Developer Productivity & Engineering Velocity Platform** (Task 2). Built with **Node.js, Express, TypeScript, and Zod**, featuring centralized error handling, comprehensive write validation, interactive OpenAPI/Swagger documentation, and an automated integration test suite.

---

## 🚀 Highlights & Features

- **Standard REST Architecture**: Clean, modular separation of routes, controllers, middleware, data persistence, and schemas.
- **Strict Input Validation**: Every write operation (`POST`, `PUT`, `PATCH`) is validated at runtime using **Zod**, providing detailed field-level error messages.
- **Centralized Error Handling**: Custom `ApiError` class and global error-handling middleware that intercepts syntax errors, validation failures, conflicts, and 404s to ensure uniform JSON responses.
- **Dedicated Task Status Transitions**: Dedicated endpoint `PATCH /api/tasks/:id/status` enforcing valid lifecycle stages (`backlog`, `in_progress`, `in_review`, `done`).
- **Relational Enrichment & Persistence**: Pre-seeded with realistic high-fidelity data matching Task 1 (Alex Chen, core team members, active projects, sprint tasks). Tasks automatically enrich project metrics (`totalTasks`, `completedTasks`, `progress`) and retain thread-safe JSON file synchronization (`server/data/store.json`).
- **Interactive Documentation**:
  - **Swagger UI**: Mounts at `http://localhost:5000/api/docs`
  - **OpenAPI 3.0.3 Spec**: Available at `http://localhost:5000/api/docs/json` and `server/docs/openapi.json`
  - **Postman Collection**: `server/docs/dmetrics_postman_collection.json` (ready to import)
- **Zero-Config Testing**: 27 automated integration tests covering health checks, validation rejections, duplicate key/email conflicts, cascade relations, and status transitions.

---

## 📂 Project Structure

```
server/
├── data/
│   └── store.json                   # File-backed persistence store
├── docs/
│   ├── openapi.json                 # OpenAPI 3.0.3 Specification
│   └── dmetrics_postman_collection.json # Postman Collection v2.1
├── src/
│   ├── config/
│   │   └── env.ts                   # Environment schema validation with Zod
│   ├── controllers/
│   │   ├── healthController.ts      # Health check and telemetry
│   │   ├── projectController.ts     # Project CRUD and stats
│   │   ├── taskController.ts        # Task CRUD, status change, and summary
│   │   └── userController.ts        # User profiles and team roster
│   ├── data/
│   │   ├── db.ts                    # In-memory + atomic file synchronization engine
│   │   └── seedData.ts              # Seed data matching Task 1 models
│   ├── middleware/
│   │   ├── errorHandler.ts          # Centralized error handler
│   │   ├── notFound.ts              # 404 fallthrough handler
│   │   └── validate.ts              # Reusable Zod validation middleware
│   ├── routes/
│   │   ├── healthRoutes.ts          # /api/health
│   │   ├── projectRoutes.ts         # /api/projects
│   │   ├── taskRoutes.ts            # /api/tasks
│   │   ├── userRoutes.ts            # /api/users
│   │   └── index.ts                 # Main router aggregate
│   ├── tests/
│   │   └── api.test.ts              # Integration test suite (27 tests)
│   ├── types/
│   │   └── index.ts                 # Domain interfaces & API response contracts
│   ├── utils/
│   │   ├── ApiError.ts              # Custom operational error class
│   │   └── ApiResponse.ts           # Standardized response wrapper
│   ├── validators/
│   │   └── schemas.ts               # Zod validation schemas
│   ├── app.ts                       # Express app setup & Swagger mount
│   └── index.ts                     # Server entrypoint & graceful shutdown
├── .env                             # Local environment configuration
├── .env.example                     # Environment template
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Variables

The server loads and validates environment variables using Zod at startup.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `API_PREFIX` | Base URI prefix for API routes | `/api` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for token signing & HMAC validation | *(Configured)* |

### Example `.env` File
```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=dmetrics_super_secret_jwt_key_2026_production_grade
```

---

## 🛠️ Getting Started

### 1. Installation
```bash
cd server
npm install
```

### 2. Development Mode
Run the server with hot-reloading via `tsx`:
```bash
npm run dev
```
The server will start at:
- **API Base**: `http://localhost:5000/api`
- **Swagger UI**: `http://localhost:5000/api/docs`
- **Health Telemetry**: `http://localhost:5000/api/health`

### 3. Build & Production Start
```bash
npm run build
npm start
```

### 4. Running the Automated Test Suite
```bash
npm test
```
All 27 integration tests execute synchronously and output detailed pass/fail reports.

---

## 📑 API Endpoint Reference

### System & Health

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime, memory telemetry, and version | `200 OK` |
| `GET` | `/api/docs` | Interactive Swagger UI API documentation | `200 OK` |
| `GET` | `/api/docs/json` | Raw OpenAPI 3.0.3 specification JSON | `200 OK` |

### User Management (`/api/users`)

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List all users (supports `?search=` and `?role=`) | `200 OK` |
| `GET` | `/api/users/current/profile` | Retrieve active authenticated user (Alex Chen) | `200 OK`, `404 Not Found` |
| `GET` | `/api/users/:id` | Get user by ID | `200 OK`, `404 Not Found` |
| `POST` | `/api/users` | Create new user profile (validates unique email & username) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `PUT` | `/api/users/:id` | Full replacement of user profile | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `PATCH` | `/api/users/:id` | Partial update of user profile fields | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `DELETE` | `/api/users/:id` | Delete user profile | `204 No Content`, `404 Not Found` |

### Project Management (`/api/projects`)

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | List projects (supports `?status=` and `?search=`) | `200 OK` |
| `GET` | `/api/projects/:id` | Get project by ID or key (e.g. `proj_1` or `CPE`) | `200 OK`, `404 Not Found` |
| `POST` | `/api/projects` | Create new project (validates key uniqueness and `leadId`) | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `PUT` | `/api/projects/:id` | Full update of project metadata | `200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `PATCH` | `/api/projects/:id` | Partial update of project | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/projects/:id` | Delete project and cascade deletion to project tasks | `204 No Content`, `404 Not Found` |

### Task Management & Status Transitions (`/api/tasks`)

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | List tasks with multi-field filtering (`status`, `priority`, `projectId`, `assigneeId`, `search`, `sortBy`, `sortOrder`, `page`, `limit`) | `200 OK`, `400 Bad Request` |
| `GET` | `/api/tasks/summary/metrics` | Aggregated distribution of tasks across statuses and project health | `200 OK` |
| `GET` | `/api/tasks/:id` | Get task by ID or key (e.g. `task_1` or `CPE-104`) | `200 OK`, `404 Not Found` |
| `POST` | `/api/tasks` | Create task with auto-generated key (e.g. `CPE-119`) | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/tasks/:id` | Full update of task | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `PATCH` | `/api/tasks/:id` | Partial update of task attributes | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `PATCH` | `/api/tasks/:id/status` | **Task status management** (`backlog`, `in_progress`, `in_review`, `done`) | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/tasks/:id` | Delete task | `204 No Content`, `404 Not Found` |

---

## 🛡️ Input Validation & Error Handling Specification

### Standard Success Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Task status transitioned to 'done' successfully",
  "data": {
    "id": "task_1",
    "key": "CPE-104",
    "title": "Implement Redis Bloom filter for cache hit optimization",
    "status": "done",
    "priority": "urgent",
    "projectId": "proj_1",
    "projectName": "Core Platform Engine",
    "storyPoints": 5,
    "dueDate": "2026-09-08",
    "updatedAt": "2026-09-06T07:15:00.000Z"
  }
}
```

### Standard Error Response Envelope
Every error—including validation failures, malformed JSON, and resource not found—returns a uniform error structure:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "ValidationError",
  "message": "Validation failed for request data",
  "errors": [
    {
      "field": "status",
      "message": "Status must be one of: 'backlog', 'in_progress', 'in_review', 'done'"
    }
  ],
  "timestamp": "2026-09-06T07:15:00.000Z",
  "path": "/api/tasks/task_1/status"
}
```

---

## 💻 Sample cURL Commands

### 1. Check Health Diagnostics
```bash
curl -X GET http://localhost:5000/api/health
```

### 2. Transition Task Status (Kanban Transition)
```bash
curl -X PATCH http://localhost:5000/api/tasks/task_1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_review"}'
```

### 3. Create a New Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement rate limiting and token bucket throttling",
    "description": "Prevent noisy-neighbor starvation on shared API gateway endpoints.",
    "status": "in_progress",
    "priority": "urgent",
    "projectId": "proj_1",
    "assigneeId": "usr_1",
    "storyPoints": 5,
    "dueDate": "2026-09-15",
    "tags": ["Security", "Gateway", "Redis"]
  }'
```

### 4. Query Tasks with Filters and Pagination
```bash
curl -X GET "http://localhost:5000/api/tasks?status=in_progress&priority=urgent&sortBy=dueDate&sortOrder=asc&page=1&limit=10"
```

### 5. Create a New Project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Distributed Trace Mesh",
    "key": "DTM",
    "description": "End-to-end OpenTelemetry trace sampling and APM alerting engine.",
    "status": "on_track",
    "leadId": "usr_1",
    "teamIds": ["usr_1", "usr_3"],
    "deadline": "2026-10-30",
    "color": "#10b981"
  }'
```

---

## 🧪 Automated Testing Verification

Run the test suite:
```bash
npm test
```

### Verified Scenarios:
1. `GET /health` returns 200 and healthy telemetry.
2. `GET /api/docs/json` returns valid OpenAPI 3.0.3 specification.
3. `GET /users` returns user roster with meta total count.
4. `GET /users/current/profile` returns active user (Alex Chen).
5. `GET /users/:id` returns 200 for known user and 404 for unknown user.
6. `POST /users` validates required fields with Zod (returns 400 with field errors).
7. `POST /users` detects duplicate email/username (returns 409 Conflict).
8. `POST /users` creates user (returns 201 Created with `Location` header).
9. `PATCH /users/:id` updates profile and `DELETE /users/:id` returns 204.
10. `GET /projects` returns projects with computed task progress and populated teams.
11. `GET /projects/:id` resolves by ID or key (e.g. `CPE`).
12. `POST /projects` rejects duplicate key (409) and invalid leadId (400).
13. `POST /projects` creates project (201) and `PATCH /projects/:id` updates attributes.
14. `GET /tasks` supports multi-attribute filtering (`status`, `priority`, `search`) and pagination.
15. `GET /tasks/summary/metrics` returns aggregated counts.
16. `POST /tasks` validates all input fields and creates task with auto-generated key.
17. `PATCH /tasks/:id/status` validates and strictly restricts status transitions.
18. `DELETE /tasks/:id` removes task (204).
19. Malformed JSON payload triggers 400 Bad Request from centralized error handler.
20. Unknown endpoints trigger 404 Not Found from centralized fallthrough handler.
