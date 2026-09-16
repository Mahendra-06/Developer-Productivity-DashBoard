import { createApp } from '../app.js';
import { db } from '../data/db.js';
import {
  testUsers,
  testProjects,
  testTasks,
  testPullRequests,
  testDeployments,
  testAuditEvents,
} from '../data/seedData.js';
import http from 'http';

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

// Assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting DMetrics REST API Test Suite...');
  
  // Reset db to test fixture state
  await (db as any).resetData(
    testUsers,
    testProjects,
    testTasks,
    testPullRequests,
    testDeployments,
    testAuditEvents
  );

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`📡 Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  const testCase = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  };

  try {
    // 1. Health Diagnostics
    await testCase('GET /health returns 200 and healthy status', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.success === true, 'Expected success true');
      assert(body.data.status === 'healthy', 'Expected status healthy');
      assert(typeof body.data.uptimeSeconds === 'number', 'Expected uptime number');
    });

    // 2. OpenAPI Documentation
    await testCase('GET /api/docs/json returns OpenAPI specification', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/api/docs/json`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.openapi === '3.0.3', 'Expected OpenAPI 3.0.3');
      assert(Boolean(body.paths['/tasks']), 'Expected /tasks in OpenAPI paths');
    });

    // 3. User Management Endpoints
    await testCase('GET /users returns all users with meta count', async () => {
      const res = await fetch(`${BASE_URL}/users`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of users');
      assert(body.data.length >= 5, `Expected at least 5 users, got ${body.data.length}`);
      assert(body.meta.total >= 5, 'Expected meta.total');
    });

    await testCase('GET /users/current/profile returns Alex Chen profile', async () => {
      const res = await fetch(`${BASE_URL}/users/current/profile`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.name === 'Alex Chen', 'Expected name Alex Chen');
      assert(body.data.username === 'alexchen-dev', 'Expected username alexchen-dev');
      assert(Array.isArray(body.data.skills), 'Expected skills array');
    });

    await testCase('GET /users/:id returns user by ID', async () => {
      const res = await fetch(`${BASE_URL}/users/usr_2`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.name === 'Sarah Jenkins', 'Expected Sarah Jenkins');
    });

    await testCase('GET /users/:id returns 404 for unknown user', async () => {
      const res = await fetch(`${BASE_URL}/users/unknown_user_999`);
      assert(res.status === 404, `Expected 404, got ${res.status}`);
      const body: any = await res.json();
      assert(body.success === false, 'Expected success false');
      assert(body.error === 'ApiError', 'Expected ApiError');
    });

    await testCase('POST /users validates missing fields and returns 400', async () => {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'A' }), // missing email, role, username
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const body: any = await res.json();
      assert(body.success === false, 'Expected success false');
      assert(body.error === 'ValidationError', 'Expected ValidationError');
      assert(Array.isArray(body.errors) && body.errors.length > 0, 'Expected errors array');
    });

    await testCase('POST /users detects duplicate email and returns 409 Conflict', async () => {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alex Duplicate',
          email: 'alex.chen@innovate.dev',
          role: 'Engineer',
          username: 'unique-user-123',
        }),
      });
      assert(res.status === 409, `Expected 409, got ${res.status}`);
      const body: any = await res.json();
      assert(body.success === false, 'Expected success false');
    });

    let createdUserId = '';
    await testCase('POST /users creates new user and returns 201 with Location header', async () => {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Taylor Swift',
          email: 'taylor.swift@innovate.dev',
          role: 'Core Systems Architect',
          username: 'taylor-s',
          bio: 'Distributed caching systems engineer.',
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(Boolean(res.headers.get('location')), 'Expected Location header');
      const body: any = await res.json();
      assert(body.success === true, 'Expected success true');
      assert(body.data.name === 'Taylor Swift', 'Expected Taylor Swift');
      createdUserId = body.data.id;
    });

    await testCase('PATCH /users/:id updates user fields', async () => {
      const res = await fetch(`${BASE_URL}/users/${createdUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: 'Updated bio information.' }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.bio === 'Updated bio information.', 'Expected updated bio');
    });

    await testCase('DELETE /users/:id deletes user and returns 204 No Content', async () => {
      const res = await fetch(`${BASE_URL}/users/${createdUserId}`, {
        method: 'DELETE',
      });
      assert(res.status === 204, `Expected 204, got ${res.status}`);
      const verify = await fetch(`${BASE_URL}/users/${createdUserId}`);
      assert(verify.status === 404, 'Expected deleted user to return 404');
    });

    // 4. Project Management Endpoints
    await testCase('GET /projects returns projects with enriched progress and team', async () => {
      const res = await fetch(`${BASE_URL}/projects`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of projects');
      const first = body.data[0];
      assert(typeof first.progress === 'number', 'Expected progress number');
      assert(typeof first.totalTasks === 'number', 'Expected totalTasks number');
      assert(Boolean(first.lead), 'Expected enriched lead user object');
    });

    await testCase('GET /projects/:id returns project by ID or Key', async () => {
      const res = await fetch(`${BASE_URL}/projects/CPE`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.key === 'CPE', 'Expected key CPE');
      assert(body.data.name === 'Core Platform Engine', 'Expected Core Platform Engine');
    });

    await testCase('POST /projects validates inputs and duplicate key', async () => {
      // Missing required fields
      const res1 = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'A' }),
      });
      assert(res1.status === 400, `Expected 400, got ${res1.status}`);

      // Duplicate key
      const res2 = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Project',
          key: 'CPE',
          description: 'A duplicate test project',
          leadId: 'usr_1',
          deadline: '2026-12-31',
        }),
      });
      assert(res2.status === 409, `Expected 409, got ${res2.status}`);
    });

    let createdProjectId = '';
    await testCase('POST /projects creates new project with 201 Created', async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Quantum Telemetry Mesh',
          key: 'QTM',
          description: 'Sub-millisecond packet telemetry aggregation pipeline.',
          leadId: 'usr_1',
          teamIds: ['usr_1', 'usr_2'],
          deadline: '2026-11-20',
          color: '#8b5cf6',
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.key === 'QTM', 'Expected key QTM');
      createdProjectId = body.data.id;
    });

    await testCase('PATCH /projects/:id updates project', async () => {
      const res = await fetch(`${BASE_URL}/projects/${createdProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'at_risk' }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.status === 'at_risk', 'Expected updated status at_risk');
    });

    // 5. Task Management Endpoints
    await testCase('GET /tasks returns paginated tasks with metadata', async () => {
      const res = await fetch(`${BASE_URL}/tasks?page=1&limit=5`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of tasks');
      assert(body.data.length <= 5, 'Expected at most 5 tasks');
      assert(typeof body.meta.total === 'number', 'Expected meta.total');
      assert(body.meta.page === 1, 'Expected meta.page 1');
    });

    await testCase('GET /tasks filters by status & priority', async () => {
      const res = await fetch(`${BASE_URL}/tasks?status=in_progress&priority=urgent`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      body.data.forEach((task: any) => {
        assert(task.status === 'in_progress', 'Expected status in_progress');
        assert(task.priority === 'urgent', 'Expected priority urgent');
      });
    });

    await testCase('GET /tasks/summary/metrics returns aggregated stats', async () => {
      const res = await fetch(`${BASE_URL}/tasks/summary/metrics`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(typeof body.data.tasks.total === 'number', 'Expected tasks.total');
      assert(typeof body.data.tasks.done === 'number', 'Expected tasks.done');
      assert(typeof body.data.projects.total === 'number', 'Expected projects.total');
    });

    await testCase('GET /tasks/:id returns task by ID or Key', async () => {
      const res = await fetch(`${BASE_URL}/tasks/CPE-104`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.key === 'CPE-104', 'Expected key CPE-104');
      assert(Boolean(body.data.assignee), 'Expected enriched assignee object');
    });

    await testCase('POST /tasks validates write payload with Zod', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'AB', // too short
          description: '', // too short
          projectId: 'proj_1',
          assigneeId: 'usr_1',
          dueDate: '2026-10-10',
          status: 'invalid_status',
        }),
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const body: any = await res.json();
      assert(body.error === 'ValidationError', 'Expected ValidationError');
      assert(body.errors.some((e: any) => e.field === 'status'), 'Expected status error');
    });

    let createdTaskId = '';
    await testCase('POST /tasks creates task with auto-generated key and 201', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Integrate OpenTelemetry Jaeger exporter',
          description: 'Deploy collector agent daemonset and forward traces to Jaeger collector.',
          status: 'backlog',
          priority: 'high',
          projectId: 'proj_1',
          assigneeId: 'usr_1',
          storyPoints: 5,
          dueDate: '2026-09-30',
          tags: ['Observability', 'Jaeger'],
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(Boolean(res.headers.get('location')), 'Expected Location header');
      const body: any = await res.json();
      assert(body.data.title.includes('Jaeger'), 'Expected task title');
      assert(body.data.key.startsWith('CPE-'), 'Expected key starting with CPE-');
      createdTaskId = body.data.id;
    });

    await testCase('POST /tasks creates a personal project when projectId is omitted', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Capture unplanned engineering work',
          description: 'A task created before any project is selected in the dashboard.',
          assigneeId: 'usr_1',
          dueDate: '2026-09-30',
          tags: ['Personal'],
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.projectName.includes('Personal Tasks'), 'Expected an automatically created personal project');
    });

    // 6. Task Status Transition Management
    await testCase('PATCH /tasks/:id/status rejects invalid status with 400', async () => {
      const res = await fetch(`${BASE_URL}/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed_invalid' }),
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const body: any = await res.json();
      assert(body.error === 'ValidationError', 'Expected ValidationError');
    });

    await testCase('PATCH /tasks/:id/status transitions status to in_progress then done', async () => {
      // Transition to in_progress
      const res1 = await fetch(`${BASE_URL}/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      assert(res1.status === 200, `Expected 200, got ${res1.status}`);
      const body1: any = await res1.json();
      assert(body1.data.status === 'in_progress', 'Expected in_progress');

      // Transition to done
      const res2 = await fetch(`${BASE_URL}/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      assert(res2.status === 200, `Expected 200, got ${res2.status}`);
      const body2: any = await res2.json();
      assert(body2.data.status === 'done', 'Expected done');
    });

    await testCase('DELETE /tasks/:id deletes task with 204 No Content', async () => {
      const res = await fetch(`${BASE_URL}/tasks/${createdTaskId}`, {
        method: 'DELETE',
      });
      assert(res.status === 204, `Expected 204, got ${res.status}`);
      const verify = await fetch(`${BASE_URL}/tasks/${createdTaskId}`);
      assert(verify.status === 404, 'Expected deleted task to return 404');
    });

    // 7. Centralized Error Handling & Bad Request Behavior
    await testCase('Centralized error handler returns 400 on malformed JSON body', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "title": "Malformed without closing bracket',
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const body: any = await res.json();
      assert(body.success === false, 'Expected success false');
      assert(body.error === 'BadRequest', 'Expected BadRequest error');
    });

    await testCase('Fallthrough 404 handler returns standardized JSON for unknown route', async () => {
      const res = await fetch(`${BASE_URL}/some-route-that-does-not-exist`);
      assert(res.status === 404, `Expected 404, got ${res.status}`);
      const body: any = await res.json();
      assert(body.success === false, 'Expected success false');
      assert(body.error === 'ApiError', 'Expected ApiError');
      assert(body.path === '/api/some-route-that-does-not-exist', 'Expected path in error response');
    });

    // 8. Authentication & Protected Routes
    let authToken = '';
    await testCase('POST /api/auth/register hashes password and returns JWT token', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane.doe@innovate.dev',
          username: 'janedoe',
          role: 'Staff Reliability Engineer',
          password: 'securePassword123!',
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(Boolean(body.data.token), 'Expected JWT token in response');
      assert(body.data.user.email === 'jane.doe@innovate.dev', 'Expected user email');
      assert(body.data.user.passwordHash === undefined, 'Expected passwordHash to be sanitized');
      authToken = body.data.token;
    });

    await testCase('POST /api/auth/login verifies password and returns JWT', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: 'janedoe',
          password: 'securePassword123!',
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Boolean(body.data.token), 'Expected token');
    });

    await testCase('POST /api/auth/login rejects invalid password with 401', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: 'janedoe',
          password: 'wrongPassword!',
        }),
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await testCase('GET /api/auth/me protects route and returns user with valid token', async () => {
      // Without token
      const unauth = await fetch(`${BASE_URL}/auth/me`);
      assert(unauth.status === 401, `Expected 401 without token, got ${unauth.status}`);

      // With token
      const auth = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      assert(auth.status === 200, `Expected 200 with token, got ${auth.status}`);
      const body: any = await auth.json();
      assert(body.data.username === 'janedoe', 'Expected janedoe');
    });

    await testCase('GET /api/auth/verify-lead enforces role-based authorization (RBAC 401 & 403)', async () => {
      // 1. Without token -> 401 Unauthorized
      const noToken = await fetch(`${BASE_URL}/auth/verify-lead`);
      assert(noToken.status === 401, `Expected 401 without token, got ${noToken.status}`);

      // 2. Jane Doe has role 'Staff Reliability Engineer' -> allowed 200
      const staffAuth = await fetch(`${BASE_URL}/auth/verify-lead`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      assert(staffAuth.status === 200, `Expected 200 for Staff role, got ${staffAuth.status}`);

      // 3. Register Junior Developer without lead/staff role
      const juniorReg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Junior Dev',
          email: 'junior.dev@innovate.dev',
          username: 'juniordev',
          role: 'Junior Frontend Developer',
          password: 'password123',
        }),
      });
      const juniorData: any = await juniorReg.json();
      const juniorToken = juniorData.data.token;

      // 4. Junior attempt on verify-lead -> 403 Forbidden
      const juniorAuth = await fetch(`${BASE_URL}/auth/verify-lead`, {
        headers: { 'Authorization': `Bearer ${juniorToken}` },
      });
      assert(juniorAuth.status === 403, `Expected 403 Forbidden for Junior role, got ${juniorAuth.status}`);
      const juniorErr: any = await juniorAuth.json();
      assert(juniorErr.error === 'ForbiddenError', 'Expected ForbiddenError');
    });

    // 9. AI Integration Endpoints
    await testCase('POST /api/ai/task-breakdown generates subtasks and story points', async () => {
      const res = await fetch(`${BASE_URL}/ai/task-breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Implement Redis Bloom filter',
          description: 'Probabilistic membership testing for cache optimization',
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data.subtasks), 'Expected subtasks array');
      assert(typeof body.data.storyPoints === 'number', 'Expected storyPoints number');
    });

    await testCase('POST /api/ai/pr-review generates code review audit', async () => {
      const res = await fetch(`${BASE_URL}/ai/pr-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prNumber: 142,
          title: 'Implement Redis Bloom filter',
          diffSnippet: '+const bloom = new BloomFilter();\n+bloom.add(key);',
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data.security), 'Expected security checks');
      assert(Array.isArray(body.data.performance), 'Expected performance checks');
    });

    // 10. GitHub Telemetry Endpoint
    await testCase('GET /api/github/user checks GitHub token integration status', async () => {
      const res = await fetch(`${BASE_URL}/github/user`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(typeof body.data.authenticated === 'boolean', 'Expected authenticated boolean');
    });

    // 11. Operational Persistence: PR Reviews, Deployments, and Audit Trail
    await testCase('PATCH /api/users/:id updates extended profile (skills, focusStatus, weeklyGoalHours)', async () => {
      const res = await fetch(`${BASE_URL}/users/usr_1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyGoalHours: 42,
          focusStatus: 'Deep Work on Distributed Consensus ⚡',
          skills: ['TypeScript', 'Kubernetes', 'Go'],
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.weeklyGoalHours === 42, 'Expected weeklyGoalHours to be updated');
      assert(body.data.focusStatus === 'Deep Work on Distributed Consensus ⚡', 'Expected focusStatus to be updated');
      assert(Array.isArray(body.data.skills), 'Expected skills array');
    });

    await testCase('POST /api/audit records custom audit activity', async () => {
      const res = await fetch(`${BASE_URL}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completed 25m deep work session',
          category: 'system',
          target: 'Productivity Rhythm (+0.4h Focus)',
          metadata: 'Score: 95/100 • Weekly Goal: 35/40h',
          status: 'success',
          actor: {
            name: 'Mahendra Kumar',
            role: 'Backend Systems Engineer',
            avatar: 'https://github.com/Mahendra-06.png',
          },
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.action.includes('deep work'), 'Expected deep work action recorded');
    });

    await testCase('GET /api/prs returns list of pull requests', async () => {
      const res = await fetch(`${BASE_URL}/prs`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of PRs');
    });

    await testCase('GET /api/prs/metrics returns PR review velocity, SLA turnaround, and bottleneck metrics', async () => {
      const res = await fetch(`${BASE_URL}/prs/metrics`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(typeof body.data.totalPRs === 'number', 'Expected totalPRs number');
      assert(typeof body.data.avgTurnaroundHours === 'number', 'Expected avgTurnaroundHours number');
      assert(typeof body.data.slaDistribution === 'object', 'Expected slaDistribution object');
      assert(typeof body.data.slaDistribution.healthy === 'number', 'Expected healthy count');
    });

    await testCase('GET /api/prs?queueType=to_review filters PRs waiting for peer review', async () => {
      const res = await fetch(`${BASE_URL}/prs?queueType=to_review`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of PRs');
      body.data.forEach((pr: any) => {
        assert(!pr.isMerged, 'Expected open PR in to_review queue');
      });
    });

    await testCase('POST /api/prs assigns Project Lead and teammates as reviewers excluding author on team projects', async () => {
      const res = await fetch(`${BASE_URL}/prs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '[CPE-104] Distributed Consensus Engine',
          repo: 'innovate/core-engine',
          branch: 'feat/cpe-104-consensus',
          projectType: 'team',
          projectId: 'proj_1',
          author: {
            id: 'usr_1',
            name: 'Alex Chen',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            username: 'alexchen-dev',
          }
        })
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.projectType === 'team', 'Expected team project');
      assert(Array.isArray(body.data.reviewers), 'Expected reviewers array');
      assert(body.data.reviewers.length > 0, 'Expected assigned reviewers');
      const authorInReviewers = body.data.reviewers.some((r: any) => r.id === 'usr_1' || r.name === 'Alex Chen');
      assert(!authorInReviewers, 'Author must not be assigned as reviewer on their own PR');
    });

    await testCase('POST /api/prs/:id/review rejects author self-approval on team project with 400 Bad Request', async () => {
      // pr_1 is authored by Alex Chen (usr_1) on a team project
      const res = await fetch(`${BASE_URL}/prs/pr_1/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          reviewer: {
            id: 'usr_1',
            name: 'Alex Chen',
            role: 'Software Engineer',
          }
        })
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const body: any = await res.json();
      assert(body.message.includes('Authors cannot approve their own pull requests'), 'Expected author self-review rejection message');
    });

    await testCase('POST /api/prs/:id/review with action request_changes flags SLA status as at_risk', async () => {
      const res = await fetch(`${BASE_URL}/prs/pr_1/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_changes',
          comment: 'Please add unit tests for cache eviction boundary conditions.',
          reviewer: {
            id: 'usr_4',
            name: 'Elena Rostova',
            role: 'Staff Reliability Engineer',
          }
        })
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.isReviewed === false, 'Expected isReviewed false');
      assert(body.data.slaStatus === 'at_risk', 'Expected slaStatus at_risk');
    });

    await testCase('POST /api/prs/:id/review with action approve approves PR, sets turnaround hours, and records reviewedBy', async () => {
      const res = await fetch(`${BASE_URL}/prs/pr_1/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          comment: 'Boundary tests added and verified. LGTM!',
          reviewer: {
            id: 'usr_4',
            name: 'Elena Rostova',
            role: 'Staff Reliability Engineer',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
          }
        })
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.isReviewed === true, 'Expected isReviewed true');
      assert(body.data.reviewedBy?.name === 'Elena Rostova', 'Expected reviewedBy Elena Rostova');
      assert(typeof body.data.turnaroundHours === 'number', 'Expected turnaroundHours number');
    });

    await testCase('PATCH /api/prs/:id updates PR review status', async () => {
      const res = await fetch(`${BASE_URL}/prs/pr_1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isReviewed: true,
          reviewerStatus: 'approved',
          comment: 'Clean implementation, approved.',
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.isReviewed === true, 'Expected isReviewed true');
    });

    await testCase('POST /api/prs/:id/merge merges pull request and logs audit event', async () => {
      const res = await fetch(`${BASE_URL}/prs/pr_1/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: {
            name: 'Mahendra Kumar',
            role: 'Backend Systems Engineer',
            avatar: 'https://github.com/Mahendra-06.png',
          },
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.status === 'merged', 'Expected status merged');
      assert(body.data.isMerged === true, 'Expected isMerged true');
      assert(body.data.waitingHours === 0, 'Expected waitingHours 0 on merged PR');
    });

    await testCase('GET /api/audit returns audit event feed', async () => {
      const res = await fetch(`${BASE_URL}/audit`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of audit events');
    });

    await testCase('GET /api/analytics returns engineering velocity and activity telemetry', async () => {
      const res = await fetch(`${BASE_URL}/analytics`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data.sprintVelocity), 'Expected sprintVelocity');
      assert(Array.isArray(body.data.workCategories), 'Expected workCategories');
      assert(Array.isArray(body.data.activityDays), 'Expected activityDays');
    });

    await testCase('GET /api/ai/copilot/health returns status and model', async () => {
      const res = await fetch(`${BASE_URL}/ai/copilot/health`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.status === 'online', 'Expected status online');
      assert(typeof body.data.model === 'string' && body.data.model.length > 0, 'Expected non-empty model');
      assert(Array.isArray(body.data.features), 'Expected features array');
    });

    await testCase('POST /api/ai/copilot/chat validates messages payload', async () => {
      const badRes = await fetch(`${BASE_URL}/ai/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert(badRes.status === 400, `Expected 400 for empty body, got ${badRes.status}`);

      const validRes = await fetch(`${BASE_URL}/ai/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'What are my pending tasks?' }],
          currentTab: 'dashboard',
        }),
      });
      assert(validRes.status === 200, `Expected 200 for chat, got ${validRes.status}`);
      const body: any = await validRes.json();
      assert(typeof body.data.response === 'string', 'Expected string response');
    });

    await testCase('POST /api/ai/copilot/action/execute confirms task creation and logs audit event', async () => {
      const res = await fetch(`${BASE_URL}/ai/copilot/action/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_task',
          data: {
            title: 'Fix Redis Cache Connection Timeout',
            description: 'Investigate connection pooling leak under simulated canary load',
            priority: 'urgent',
            storyPoints: 5,
          },
        }),
      });
      assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.task.title === 'Fix Redis Cache Connection Timeout', 'Expected task title match');
      assert(body.data.task.priority === 'urgent', 'Expected urgent priority');
      assert(body.data.task.tags.includes('Copilot'), 'Expected Copilot tag');
    });

    // ==========================================
    // DEPLOYMENTS REST API TEST SUITE
    // ==========================================
    let createdDepId = '';
    await testCase('GET /api/deployments returns paginated deployments list and metadata', async () => {
      const res = await fetch(`${BASE_URL}/deployments`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of deployments in data');
      assert(body.meta && typeof body.meta.total === 'number', 'Expected pagination meta');
    });

    await testCase('POST /api/deployments validates missing fields and rejects invalid payload', async () => {
      const res = await fetch(`${BASE_URL}/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '',
          serviceName: '',
        }),
      });
      assert(res.status === 400, `Expected 400 Validation Error, got ${res.status}`);
    });

    await testCase('POST /api/deployments creates deployment and persists to database', async () => {
      const res = await fetch(`${BASE_URL}/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 'v2.8.0',
          serviceName: 'dmetrics-api-gateway',
          environment: 'production',
          status: 'success',
          branch: 'main',
          commitSha: '9b4f2c1',
          commitMessage: 'Deploy distributed gateway with TLS 1.3 encryption',
          durationSeconds: 95,
          summary: 'Production rollout with zero downtime',
          sloPassRate: 99.99,
          author: {
            name: 'Alex Chen',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          },
        }),
      });
      assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.version === 'v2.8.0', 'Expected version v2.8.0');
      assert(body.data.environment === 'production', 'Expected environment production');
      assert(body.data.status === 'success', 'Expected status success');
      createdDepId = body.data.id;
    });

    await testCase('GET /api/deployments/:id returns single deployment with details', async () => {
      assert(Boolean(createdDepId), 'Expected valid createdDepId');
      const res = await fetch(`${BASE_URL}/deployments/${createdDepId}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.id === createdDepId, 'Expected matching deployment ID');
      assert(body.data.serviceName === 'dmetrics-api-gateway', 'Expected matching serviceName');
    });

    await testCase('PATCH /api/deployments/:id updates status & duration', async () => {
      const res = await fetch(`${BASE_URL}/deployments/${createdDepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: 120,
          summary: 'Updated rollout with canary verification completed',
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.durationSeconds === 120, 'Expected durationSeconds 120');
    });

    await testCase('GET /api/deployments/metrics calculates real database metrics', async () => {
      const res = await fetch(`${BASE_URL}/deployments/metrics`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(typeof body.data.totalDeployments === 'number', 'Expected totalDeployments');
      assert(typeof body.data.successRate === 'number', 'Expected successRate');
      assert(typeof body.data.deploymentFrequency === 'string', 'Expected deploymentFrequency');
      assert(body.data.totalDeployments >= 1, 'Expected at least 1 deployment in metrics');
    });

    await testCase('GET /api/deployments/trends returns date-series trend points', async () => {
      const res = await fetch(`${BASE_URL}/deployments/trends?timeRange=week`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of trend points');
      assert(body.data.length === 7, 'Expected 7 days of trend data for week range');
    });

    await testCase('GET /api/deployments/environments returns environment distribution', async () => {
      const res = await fetch(`${BASE_URL}/deployments/environments`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of environment breakdowns');
      assert(body.data.some((e: any) => e.environment === 'Production'), 'Expected Production environment item');
    });

    await testCase('DELETE /api/deployments/:id deletes deployment with 204', async () => {
      const res = await fetch(`${BASE_URL}/deployments/${createdDepId}`, {
        method: 'DELETE',
      });
      assert(res.status === 204, `Expected 204 No Content, got ${res.status}`);
      const checkRes = await fetch(`${BASE_URL}/deployments/${createdDepId}`);
      assert(checkRes.status === 404, `Expected 404 after deletion, got ${checkRes.status}`);
    });


  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('🛑 Test server stopped.');
        resolve();
      });
    });
  }

  console.log('\n=======================================');
  console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
