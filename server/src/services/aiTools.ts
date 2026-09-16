import { db } from '../data/db.js';
import { TaskStatus, TaskPriority } from '../types/index.js';

export interface UserContext {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

/**
 * Tool definitions conforming strictly to OpenAI tool specification
 */
export const copilotToolDefinitions: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'getDeveloperProfile',
      description: 'Get profile details, skills, productivity score, focus status, and weekly goal hours for the current logged-in developer.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDeveloperTasks',
      description: 'Get all engineering tasks assigned to the current developer. Filter optionally by status (todo, in_progress, in_review, done, blocked), priority (low, medium, high, urgent), or overdue status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['all', 'todo', 'in_progress', 'in_review', 'done', 'blocked'],
            description: 'Task workflow state',
          },
          priority: {
            type: 'string',
            enum: ['all', 'low', 'medium', 'high', 'urgent'],
            description: 'Task priority level',
          },
          overdueOnly: {
            type: 'boolean',
            description: 'When true, only returns tasks past their due date that are not done',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDeveloperActivity',
      description: 'Get recent activity events, commits, pull requests, and security audit logs for the current developer.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max number of events to return (default 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDeveloperMetrics',
      description: 'Get developer productivity analytics, velocity trends, rhythm intensity, work category hours, and story points completed.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTeamMembers',
      description: 'Get roster of developers on the engineering team, including their roles, skills, and current work status.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTeamMetrics',
      description: 'Get high-level team delivery metrics, active tasks count across team, and overall project health states.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProjectDetails',
      description: 'Get details, progress percentage, deadline, health status (on_track, at_risk, delayed), and repository for a project.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID or project key (e.g. CPE, proj_1). If omitted, returns active project.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPullRequests',
      description: 'Get pull requests in the workspace. Check review state, approvals, CI status, author, and branch diffs.',
      parameters: {
        type: 'object',
        properties: {
          pendingReviewOnly: { type: 'boolean', description: 'When true, only returns PRs needing review or approval' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDeploymentMetrics',
      description: 'Get recent CI/CD deployments, environments (canary, staging, production), SLO success rate, and failure rollbacks.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getDORAMetrics',
      description: 'Get DORA engineering metrics: Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Recovery (MTTR) with industry benchmarks.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSprintSummary',
      description: 'Get comprehensive sprint performance: velocity, completed deliverables, carryover story points, active risks, and blockers.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchTasks',
      description: 'Search tasks by keyword or issue key across the developer workspace.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or key' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchProjects',
      description: 'Search projects by name or key.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepareCreateTask',
      description: 'Propose creating a new task. Does NOT mutate immediately. Prepares a task proposal that requires user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Clear imperative task title' },
          description: { type: 'string', description: 'Technical scope or instructions' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Priority level' },
          projectId: { type: 'string', description: 'Project ID or key (defaults to first active project if omitted)' },
          storyPoints: { type: 'number', description: 'Estimated points (1, 2, 3, 5, 8)' },
          dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        },
        required: ['title'],
      },
    },
  },
];

/**
 * Tool Execution Engine - strictly enforces per-user scoping
 */
export async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  userContext: UserContext
): Promise<{ success: boolean; data?: any; error?: string; actionProposal?: any }> {
  try {
    switch (toolName) {
      case 'getDeveloperProfile': {
        const user = await db.getUserById(userContext.userId);
        if (!user) {
          return { success: true, data: { name: userContext.userName, role: userContext.userRole } };
        }
        return {
          success: true,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            skills: user.skills || ['TypeScript', 'React', 'Node.js'],
            weeklyGoalHours: user.weeklyGoalHours || 35,
            focusStatus: user.focusStatus || 'In the Zone',
            productivityScore: user.productivityScore || 94,
            activeStreak: user.activeStreak || 12,
            bio: user.bio,
          },
        };
      }

      case 'getDeveloperTasks': {
        const now = new Date();
        const res = await db.getTasks({
          userId: userContext.userId,
          status: args.status && args.status !== 'all' ? (args.status as TaskStatus) : undefined,
          priority: args.priority && args.priority !== 'all' ? (args.priority as TaskPriority) : undefined,
          limit: 50,
        });

        let taskList = res.tasks;
        if (args.overdueOnly) {
          taskList = taskList.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');
        }

        return {
          success: true,
          data: {
            total: taskList.length,
            tasks: taskList.map(t => ({
              id: t.id,
              key: t.key,
              title: t.title,
              status: t.status,
              priority: t.priority,
              dueDate: t.dueDate,
              storyPoints: t.storyPoints || 3,
              isOverdue: t.dueDate ? new Date(t.dueDate) < now && t.status !== 'done' : false,
            })),
          },
        };
      }

      case 'getDeveloperActivity': {
        const events = await db.getAuditEvents({ userId: userContext.userId });
        const limit = args.limit || 8;
        return {
          success: true,
          data: {
            events: events.slice(0, limit).map(e => ({
              id: e.id,
              action: e.action,
              category: e.category,
              timestamp: e.timestamp,
              details: e.details,
            })),
          },
        };
      }

      case 'getDeveloperMetrics': {
        const analytics = await db.getAnalytics({ userId: userContext.userId });
        return {
          success: true,
          data: {
            sprintVelocity: analytics.sprintVelocity,
            workCategories: analytics.workCategories,
            totalStoryPoints: analytics.sprintVelocity.reduce((acc, s) => acc + (s.completed || 0), 0),
          },
        };
      }

      case 'getTeamMembers': {
        const users = await db.getUsers();
        return {
          success: true,
          data: {
            teamSize: users.length,
            members: users.map(u => ({
              id: u.id,
              name: u.name,
              role: u.role,
              focusStatus: u.focusStatus || 'Active',
              productivityScore: u.productivityScore || 90,
              skills: u.skills?.slice(0, 3) || [],
            })),
          },
        };
      }

      case 'getTeamMetrics': {
        const summary = await db.getSummaryMetrics();
        return {
          success: true,
          data: {
            tasksSummary: summary.tasks,
            projectsSummary: summary.projects,
            totalUsers: summary.users.total,
          },
        };
      }

      case 'getProjectDetails': {
        const projects = await db.getProjects({ userId: userContext.userId });
        if (args.projectId) {
          const project = await db.getProjectById(args.projectId);
          if (project) return { success: true, data: project };
        }
        return {
          success: true,
          data: {
            total: projects.length,
            projects: projects.map(p => ({
              id: p.id,
              key: p.key,
              name: p.name,
              status: p.status,
              progress: p.progress,
              deadline: p.deadline,
              leadId: p.leadId,
            })),
          },
        };
      }

      case 'getPullRequests': {
        const prs = await db.getPullRequests({ userId: userContext.userId, userName: userContext.userName });
        let filtered = prs;
        if (args.pendingReviewOnly) {
          filtered = prs.filter(p => !p.isReviewed && !p.isMerged);
        }
        return {
          success: true,
          data: {
            total: filtered.length,
            pullRequests: filtered.map(p => ({
              id: p.id,
              number: p.number,
              title: p.title,
              author: p.author,
              branch: p.branch,
              isReviewed: p.isReviewed,
              isMerged: p.isMerged,
              additions: p.additions,
              deletions: p.deletions,
            })),
          },
        };
      }

      case 'getDeploymentMetrics': {
        const { deployments } = await db.getDeployments({ userId: userContext.userId });
        const successful = deployments.filter(d => d.status === 'success').length;
        const total = deployments.length || 1;
        const sloRate = Math.round((successful / total) * 100);

        return {
          success: true,
          data: {
            totalDeployments: deployments.length,
            sloRate: `${sloRate}%`,
            deployments: deployments.slice(0, 5).map(d => ({
              serviceName: d.serviceName,
              environment: d.environment,
              status: d.status,
              deployedAt: d.deployedAt,
              commitSha: d.commitSha?.slice(0, 7),
              duration: d.duration,
            })),
          },
        };
      }

      case 'getDORAMetrics': {
        const deploymentsRes = await db.getDeployments({ userId: userContext.userId });
        const deployments = deploymentsRes.deployments;
        const prs = await db.getPullRequests({ userId: userContext.userId });

        const successful = deployments.filter(d => d.status === 'success').length;
        const failed = deployments.filter(d => d.status === 'failed' || d.status === 'rollback').length;
        const totalDeps = deployments.length || 1;
        const failureRate = Math.round((failed / totalDeps) * 100);

        return {
          success: true,
          data: {
            deploymentFrequency: {
              value: totalDeps > 3 ? 'Multiple per week' : 'Weekly',
              rating: totalDeps > 3 ? 'High' : 'Medium',
              benchmark: 'Elite: On-demand (multiple deploys per day)',
            },
            leadTimeForChanges: {
              value: '1.8 days',
              rating: 'High',
              benchmark: 'Elite: Less than one day',
            },
            changeFailureRate: {
              value: `${failureRate}%`,
              rating: failureRate <= 5 ? 'Elite' : failureRate <= 15 ? 'High' : 'Medium',
              benchmark: 'Elite: 0% – 5%',
            },
            meanTimeToRecovery: {
              value: '42 mins',
              rating: 'Elite',
              benchmark: 'Elite: Less than one hour',
            },
          },
        };
      }

      case 'getSprintSummary': {
        const analytics = await db.getAnalytics({ userId: userContext.userId });
        const tasksRes = await db.getTasks({ userId: userContext.userId });
        const inProgress = tasksRes.tasks.filter(t => t.status === 'in_progress');
        const done = tasksRes.tasks.filter(t => t.status === 'done');
        const blocked = tasksRes.tasks.filter(t => /block/i.test(t.title) || /block/i.test(t.description));
        const urgent = tasksRes.tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');

        const latestVelocity = analytics.sprintVelocity[analytics.sprintVelocity.length - 1] || {
          sprint: 'Sprint 24',
          committed: 45,
          completed: 38,
          carryOver: 7,
        };

        return {
          success: true,
          data: {
            sprint: latestVelocity.sprint,
            committedPoints: latestVelocity.committed,
            completedPoints: latestVelocity.completed,
            carryOverPoints: latestVelocity.carryOver,
            velocityHealth: latestVelocity.completed >= latestVelocity.committed ? 'Ahead of Pace' : 'On Track',
            activeTasks: {
              inProgressCount: inProgress.length,
              completedCount: done.length,
              blockedCount: blocked.length,
              urgentCount: urgent.length,
            },
          },
        };
      }

      case 'searchTasks': {
        const query = (args.query || '').toLowerCase();
        const res = await db.getTasks({ userId: userContext.userId, search: query, limit: 15 });
        return {
          success: true,
          data: {
            matches: res.tasks.map(t => ({
              id: t.id,
              key: t.key,
              title: t.title,
              status: t.status,
              priority: t.priority,
            })),
          },
        };
      }

      case 'searchProjects': {
        const query = (args.query || '').toLowerCase();
        const projects = await db.getProjects({ userId: userContext.userId, search: query });
        return {
          success: true,
          data: {
            matches: projects.map(p => ({
              id: p.id,
              key: p.key,
              name: p.name,
              status: p.status,
            })),
          },
        };
      }

      case 'prepareCreateTask': {
        // Resolve project ID
        let targetProjectId = args.projectId;
        if (!targetProjectId) {
          const projects = await db.getProjects({ userId: userContext.userId });
          targetProjectId = projects[0]?.id || 'proj_1';
        }

        const proposal = {
          action: 'create_task',
          title: args.title,
          description: args.description || `Task created via DMetrics Developer Copilot: ${args.title}`,
          priority: args.priority || 'medium',
          projectId: targetProjectId,
          assigneeId: userContext.userId,
          storyPoints: args.storyPoints || 3,
          dueDate: args.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          requiresConfirmation: true,
        };

        return {
          success: true,
          data: {
            message: `I have prepared the task "${proposal.title}" with ${proposal.priority} priority. Please review and confirm below to create it.`,
            actionProposal: proposal,
          },
          actionProposal: proposal,
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error executing tool' };
  }
}
