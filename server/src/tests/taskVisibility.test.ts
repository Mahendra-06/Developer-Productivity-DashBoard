import { createApp } from '../app.js';
import { db } from '../data/db.js';
import { env } from '../config/env.js';
import {
  testUsers,
  testProjects,
  testTasks,
  testPullRequests,
  testDeployments,
  testAuditEvents,
} from './fixtures.js';
import jwt from 'jsonwebtoken';
import http from 'http';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
}

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

async function runVisibilityTests() {
  console.log('🧪 Starting Task Visibility & Role-Based Access Test Suite...\n');

  // Seed fixture state
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
    // Users setup:
    // usr_5: David Kim (role: 'Security & QA Lead' - Privileged)
    // usr_1: Alex Chen (role: 'Staff Platform Engineer' - Regular member)
    // usr_3: Marcus Vance (role: 'DevOps & Cloud Specialist' - Regular member)
    // usr_4: Elena Rostova (role: 'Backend Go Engineer' - Regular member)
    const leadUser = testUsers.find(u => u.id === 'usr_5')!;
    const staffUser = testUsers.find(u => u.id === 'usr_1')!;
    const regularMember1 = testUsers.find(u => u.id === 'usr_3')!;
    const regularMember2 = testUsers.find(u => u.id === 'usr_4')!;

    const leadToken = generateToken(leadUser);
    const staffToken = generateToken(staffUser);
    const member1Token = generateToken(regularMember1);
    const member2Token = generateToken(regularMember2);

    let createdTaskByMember1ForMember2Id = '';
    let createdTaskByMember2ForStaffId = '';
    let personalTaskId = '';

    // 1. Regular member has scoped visibility limited to their created or assigned tasks
    await testCase('GET /api/tasks: Regular member has scoped visibility limited to their created or assigned tasks', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${member2Token}`,
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      // usr_4 (Elena) is assigned to task_7, task_11, and task_15 (3 tasks) in fixtures, not other members' tasks
      assert(body.data.length === 3, `Regular member should only see tasks assigned to them, got ${body.data.length}`);
      const unauthorizedTasks = body.data.filter((t: any) => t.assigneeId !== regularMember2.id && t.createdById !== regularMember2.id);
      assert(unauthorizedTasks.length === 0, 'Regular member should not see tasks assigned to or created by others');
    });

    // 2. Task creation stores authenticated creator relationship correctly & ignores spoofing
    await testCase('POST /api/tasks: sets createdById and assignerId from JWT auth context and rejects spoofing', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${member1Token}`,
        },
        body: JSON.stringify({
          title: 'Member 1 Task For Member 2',
          description: 'Implementation of private component.',
          projectId: 'proj_1',
          assigneeId: regularMember2.id,
          createdById: 'usr_spoofed_admin', // Spoofed ID should be ignored
          assignerId: 'usr_spoofed_admin',  // Spoofed ID should be ignored
          dueDate: '2026-10-15',
          status: 'in_progress',
          priority: 'high',
        }),
      });

      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(body.success === true, 'Expected success true');
      assert(body.data.createdById === regularMember1.id, `Expected createdById to be ${regularMember1.id}, got ${body.data.createdById}`);
      assert(body.data.assignerId === regularMember1.id, `Expected assignerId to be ${regularMember1.id}, got ${body.data.assignerId}`);
      assert(body.data.assigneeId === regularMember2.id, `Expected assigneeId to be ${regularMember2.id}`);
      createdTaskByMember1ForMember2Id = body.data.id;
    });

    // 3. Member 2 creates task in proj_5 where Member 1 is NOT a member
    await testCase('POST /api/tasks: Member 2 creates task assigned to Staff user in proj_5', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${member2Token}`,
        },
        body: JSON.stringify({
          title: 'Member 2 Task For Staff in Proj 5',
          description: 'Unrelated project task that Member 1 must never see.',
          projectId: 'proj_5',
          assigneeId: staffUser.id,
          dueDate: '2026-10-20',
          status: 'backlog',
          priority: 'medium',
        }),
      });

      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.createdById === regularMember2.id, 'Expected createdById to be member 2');
      createdTaskByMember2ForStaffId = body.data.id;
    });

    // 4. Regular member creates a personal task without selecting a project
    await testCase('POST /api/tasks: Regular member creates a personal task', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${member1Token}`,
        },
        body: JSON.stringify({
          title: 'My Private Personal Task',
          description: 'Personal study item.',
          assigneeId: regularMember1.id,
          dueDate: '2026-10-30',
          status: 'in_progress',
          priority: 'high',
        }),
      });

      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body: any = await res.json();
      assert(body.data.key.startsWith('PERSONAL-'), `Expected key to start with PERSONAL-, got ${body.data.key}`);
      personalTaskId = body.data.id;
    });

    // 5. Creator sees their own personal task
    await testCase('GET /api/tasks: Creator sees their own personal task', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      const taskIds = body.data.map((t: any) => t.id);
      assert(taskIds.includes(personalTaskId), 'Creator must see their personal task');
    });

    // 6. Other regular member CANNOT see the personal task in task list
    await testCase('GET /api/tasks: Other regular member cannot see personal task in list', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${member2Token}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      const taskIds = body.data.map((t: any) => t.id);
      assert(!taskIds.includes(personalTaskId), 'Other member must NOT see another member\'s personal task');
    });

    // 7. Other regular member gets 404 attempting to fetch personal task directly
    await testCase('GET /api/tasks/:id: Direct request to other member\'s personal task returns 404', async () => {
      const res = await fetch(`${BASE_URL}/tasks/${personalTaskId}`, {
        headers: {
          'Authorization': `Bearer ${member2Token}`,
        },
      });
      assert(res.status === 404, `Expected 404 Not Found, got ${res.status}`);
    });

    // 8. Privileged Lead cannot see other member's personal task
    await testCase('GET /api/tasks: Privileged Lead does not see other member\'s private personal task', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${leadToken}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      const taskIds = body.data.map((t: any) => t.id);
      assert(!taskIds.includes(personalTaskId), 'Lead must NOT see private personal tasks of other members');
    });

    // 9. Regular member does NOT see another member\'s unrelated task
    await testCase('GET /api/tasks: Regular member does NOT see another member\'s task in list', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      const taskIds = body.data.map((t: any) => t.id);
      assert(!taskIds.includes(createdTaskByMember2ForStaffId), 'Member 1 must NOT see task created by Member 2 for Staff');
    });

    // 10. Direct API request to /api/tasks/:id cannot bypass visibility filtering
    await testCase('GET /api/tasks/:id: Direct API request returns 404 for unrelated member task', async () => {
      const res = await fetch(`${BASE_URL}/tasks/${createdTaskByMember2ForStaffId}`, {
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 404, `Expected 404 Not Found, got ${res.status}`);
    });

    // 11. Admin / Lead retains broad visibility across all team project tasks
    await testCase('GET /api/tasks: Admin / Lead retains broader visibility across team tasks', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${leadToken}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      const taskIds = body.data.map((t: any) => t.id);
      assert(taskIds.includes(createdTaskByMember1ForMember2Id), 'Lead must see Member 1 task');
      assert(taskIds.includes(createdTaskByMember2ForStaffId), 'Lead must see Member 2 task');
    });

    // 12. Unauthenticated requests to public endpoint remain protected / operational
    await testCase('GET /api/tasks: Unauthenticated requests remain functional without token', async () => {
      const res = await fetch(`${BASE_URL}/tasks?page=1&limit=5`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of tasks');
    });

    // 13. Summary metrics scoped for regular member
    await testCase('GET /api/tasks/summary/metrics: Metrics reflect scoped tasks for regular member', async () => {
      const res = await fetch(`${BASE_URL}/tasks/summary/metrics`, {
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(typeof body.data.tasks.total === 'number', 'Expected tasks.total number');
      // Member 1 assigned tasks in fixtures (task_5, task_6, task_10 = 3) + createdTaskByMember1ForMember2Id (1) + personalTaskId (1) = 5 tasks
      assert(body.data.tasks.total === 5, `Expected 5 tasks scoped for member 1, got ${body.data.tasks.total}`);
    });

    // 14. Project visibility: Regular member only sees projects they are lead or member of
    await testCase('GET /api/projects: Regular member only sees assigned projects', async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      assert(Array.isArray(body.data), 'Expected array of projects');
      const projectIds = body.data.map((p: any) => p.id);
      assert(projectIds.includes('proj_1'), 'Member 1 should see proj_1');
      assert(projectIds.includes('proj_3'), 'Member 1 should see proj_3');
      assert(projectIds.includes('proj_6'), 'Member 1 should see proj_6');
      assert(!projectIds.includes('proj_2'), 'Member 1 must NOT see proj_2 (they are not a member or lead)');
      assert(!projectIds.includes('proj_4'), 'Member 1 must NOT see proj_4 (they are not a member or lead)');
      assert(!projectIds.includes('proj_5'), 'Member 1 must NOT see proj_5 (they are not a member or lead)');
    });

    // 15. Direct project access: Regular member cannot access project they are not a member of
    await testCase('GET /api/projects/:id: Regular member receives 404 for unassigned project', async () => {
      const res = await fetch(`${BASE_URL}/projects/proj_2`, {
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 404, `Expected 404 for unauthorized project, got ${res.status}`);
    });

    // 16. Privileged Lead sees all projects
    await testCase('GET /api/projects: Lead retains visibility across all team projects', async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${leadToken}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      const projectIds = body.data.map((p: any) => p.id);
      assert(projectIds.includes('proj_1'), 'Lead should see proj_1');
      assert(projectIds.includes('proj_2'), 'Lead should see proj_2');
      assert(projectIds.includes('proj_3'), 'Lead should see proj_3');
    });

    // 17. Regular member cannot update another member's task
    await testCase('PATCH /api/tasks/:id: Regular member receives 404 attempting to update another member\'s task', async () => {
      const res = await fetch(`${BASE_URL}/tasks/${createdTaskByMember2ForStaffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${member1Token}`,
        },
        body: JSON.stringify({
          title: 'Hacked Title By Member 1',
        }),
      });

      assert(res.status === 404, `Expected 404 Not Found, got ${res.status}`);
    });

    // 18. Regular member cannot delete another member's task
    await testCase('DELETE /api/tasks/:id: Regular member receives 404 attempting to delete another member\'s task', async () => {
      const res = await fetch(`${BASE_URL}/tasks/${createdTaskByMember2ForStaffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 404, `Expected 404 Not Found, got ${res.status}`);
    });

    // 19. Regular member cannot access project details for an unassigned project
    await testCase('GET /api/projects/:id/details: Regular member receives 404 for unassigned project details', async () => {
      const res = await fetch(`${BASE_URL}/projects/proj_2/details`, {
        headers: {
          'Authorization': `Bearer ${member1Token}`,
        },
      });

      assert(res.status === 404, `Expected 404 for unauthorized project details, got ${res.status}`);
    });

    // 20. Regular member passing scope=team query parameter cannot bypass owner restriction
    await testCase('GET /api/tasks?scope=team: Regular member cannot bypass owner restriction with query scope', async () => {
      const res = await fetch(`${BASE_URL}/tasks?scope=team`, {
        headers: {
          'Authorization': `Bearer ${member2Token}`,
        },
      });

      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      const unauthorizedTasks = body.data.filter((t: any) => t.assigneeId !== regularMember2.id && t.createdById !== regularMember2.id);
      assert(unauthorizedTasks.length === 0, 'Regular member should not see tasks assigned to or created by others even with scope=team');
    });

    // 21. Rejects task assignment if assignee does not belong to project
    await testCase('POST /api/tasks: Rejects task assignment if assignee does not belong to project', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${member1Token}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Project Assignment',
          description: 'Assigning to Sarah who is not in proj_1',
          projectId: 'proj_1',
          assigneeId: 'usr_2',
          dueDate: '2026-10-15',
          status: 'backlog',
          priority: 'low',
        }),
      });

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      const body: any = await res.json();
      assert(body.message?.includes('is not a member of project'), `Expected message about member of project, got ${body.message}`);
    });

  } finally {
    try {
      await (db as any).resetData([], [], [], [], [], []);
    } catch {}
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    }
  }

  console.log('\n=======================================');
  console.log(`🏁 Task Visibility Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVisibilityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
