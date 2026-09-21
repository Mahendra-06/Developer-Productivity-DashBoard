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

    // 1. Regular member has scoped visibility limited to their projects and assigned tasks
    await testCase('GET /api/tasks: Regular member has scoped visibility limited to their projects and assigned tasks', async () => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${member2Token}`,
        },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const body: any = await res.json();
      // usr_4 belongs to proj_1 and proj_5 (6 tasks), not all 12 tasks
      assert(body.data.length === 6, `Regular member should only see tasks from their projects, got ${body.data.length}`);
      const unauthorizedTasks = body.data.filter((t: any) => t.projectId === 'proj_2' || t.projectId === 'proj_4');
      assert(unauthorizedTasks.length === 0, 'Regular member should not see tasks from unrelated projects');
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
      // Member 1 belongs to proj_1, proj_3, and proj_6 + createdTaskByMember1ForMember2Id + personalTaskId = 10 tasks
      assert(body.data.tasks.total === 10, `Expected 10 tasks scoped for member 1, got ${body.data.tasks.total}`);
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
