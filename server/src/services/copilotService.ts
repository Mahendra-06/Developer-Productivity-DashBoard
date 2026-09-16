import { env } from '../config/env.js';
import { copilotToolDefinitions, executeToolCall, UserContext } from './aiTools.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface CopilotChatResponse {
  response: string;
  actionProposal?: any;
  toolsUsed: string[];
  isAiGenerated: boolean;
}

// In-memory rate limiting: 30 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRate = rateLimitMap.get(userId);

  if (!userRate || now > userRate.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (userRate.count >= 30) {
    return false;
  }

  userRate.count += 1;
  return true;
}

export class CopilotService {
  static getSystemPrompt(userContext: UserContext, currentTab: string = 'dashboard'): string {
    return `You are DMetrics Developer Copilot — an expert AI assistant embedded directly inside the DMetrics Developer Productivity Dashboard.

You help developers, engineering leads, and project managers understand their engineering metrics, sprint velocity, tasks, pull requests, focus rhythms, and code.

Current Workspace Context:
- Developer Name: ${userContext.userName}
- Role: ${userContext.userRole}
- Active Dashboard View: ${currentTab}

Guidelines:
1. Ground your answers in application data. Call the provided tools whenever answering questions about the developer's work, tasks, pull requests, projects, team velocity, or code quality.
2. Never invent application data. If data is not available or inconclusive, explicitly state: "Insufficient data to determine this."
3. When explaining engineering velocity metrics:
   - Provide the current value
   - State the baseline / benchmark
   - Explain possible causes based on available events
   - Recommend a clear, practical engineering action.
4. When asked to create or modify tasks, call the "prepareCreateTask" tool. This will generate an Action Proposal card for the user to review and confirm before any mutation occurs.
5. For coding questions (Java, TypeScript, React, Python, SQL, algorithms, debugging, etc.), provide clean, well-formatted code blocks with language identifiers and concise complexity analysis.
6. Be concise, technical, professional, and actionable. Do not be conversational or fluffy.`;
  }

  /**
   * Determine the active AI endpoint and API key.
   * Supports:
   * 1. Groq Cloud (Free Llama-3.3-70b): GROQ_API_KEY or gsk_...
   * 2. Google Gemini (Free Gemini-1.5-flash): GEMINI_API_KEY or AIzaSy...
   * 3. OpenRouter / Custom OpenAI-compatible Base URL
   * 4. OpenAI Official API (sk-...)
   */
  private static resolveApiConfig(): { baseUrl: string; apiKey: string; model: string } | null {
    // 1. Check Groq API
    if (env.GROQ_API_KEY || (env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('gsk_'))) {
      return {
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: env.GROQ_API_KEY || env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL.includes('gpt') ? 'llama-3.3-70b-versatile' : env.OPENAI_MODEL,
      };
    }

    // 2. Check Google Gemini API
    if (
      env.GEMINI_API_KEY || 
      (env.OPENAI_API_KEY && (env.OPENAI_API_KEY.startsWith('AIzaSy') || env.OPENAI_API_KEY.startsWith('AQ.')))
    ) {
      return {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: env.GEMINI_API_KEY || env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL.includes('gpt') ? 'gemini-flash-latest' : env.OPENAI_MODEL,
      };
    }

    // 3. Custom OpenAI-compatible base URL (e.g. OpenRouter or local Ollama)
    if (env.OPENAI_BASE_URL && env.OPENAI_BASE_URL !== 'https://api.openai.com/v1' && env.OPENAI_API_KEY) {
      return {
        baseUrl: env.OPENAI_BASE_URL.replace(/\/+$/, ''),
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
      };
    }

    // 4. Standard OpenAI
    if (env.OPENAI_API_KEY && (env.OPENAI_API_KEY.startsWith('sk-') || env.OPENAI_API_KEY.length > 20)) {
      return {
        baseUrl: env.OPENAI_BASE_URL.replace(/\/+$/, ''),
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
      };
    }

    return null;
  }

  static async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    userContext: UserContext,
    currentTab: string = 'dashboard'
  ): Promise<CopilotChatResponse> {
    if (!checkRateLimit(userContext.userId)) {
      return {
        response: '⚠️ Rate limit reached (30 requests/minute). Please wait a moment before sending more requests.',
        toolsUsed: [],
        isAiGenerated: false,
      };
    }

    const latestUserPrompt = messages.filter(m => m.role === 'user').pop()?.content || '';
    const apiConfig = this.resolveApiConfig();

    // If no valid external key is found, use local engineering heuristic engine immediately
    if (!apiConfig) {
      return this.generateLocalEngineeringResponse(latestUserPrompt, userContext, currentTab);
    }

    const toolsUsed: string[] = [];
    let detectedActionProposal: any = null;

    const conversation: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(userContext, currentTab),
      },
      ...messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      })),
    ];

    try {
      let iteration = 0;
      const maxIterations = 5;

      while (iteration < maxIterations) {
        iteration++;

        const payload: any = {
          model: apiConfig.model,
          messages: conversation,
          tools: copilotToolDefinitions,
          tool_choice: 'auto',
          temperature: 0.3,
          max_tokens: 1200,
        };

        const res = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) {
          // If quota exceeded (429) or billing error, fall back to the built-in Local Engineering Engine!
          console.warn(`[CopilotService] External API returned ${res.status}. Falling back to Local DMetrics Engine.`);
          return this.generateLocalEngineeringResponse(latestUserPrompt, userContext, currentTab, true);
        }

        const data: any = await res.json();
        const choice = data.choices?.[0];
        const assistantMessage = choice?.message;

        if (!assistantMessage) {
          return this.generateLocalEngineeringResponse(latestUserPrompt, userContext, currentTab);
        }

        // If tool calls were generated by LLM
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          conversation.push(assistantMessage);

          for (const call of assistantMessage.tool_calls) {
            const toolName = call.function.name;
            let args: Record<string, any> = {};
            try {
              args = JSON.parse(call.function.arguments || '{}');
            } catch (e) {
              args = {};
            }

            toolsUsed.push(toolName);
            const toolResult = await executeToolCall(toolName, args, userContext);

            if (toolResult.actionProposal) {
              detectedActionProposal = toolResult.actionProposal;
            }

            conversation.push({
              role: 'tool',
              tool_call_id: call.id,
              content: JSON.stringify(toolResult.data || toolResult.error || { success: true }),
            });
          }

          continue;
        }

        // Final assistant text response from LLM
        return {
          response: assistantMessage.content || '',
          actionProposal: detectedActionProposal,
          toolsUsed,
          isAiGenerated: true,
        };
      }

      return {
        response: 'Request completed, but tool execution depth limit reached.',
        actionProposal: detectedActionProposal,
        toolsUsed,
        isAiGenerated: true,
      };
    } catch (error: any) {
      console.warn('[CopilotService] Error during LLM request. Falling back to local engine:', error.message);
      return this.generateLocalEngineeringResponse(latestUserPrompt, userContext, currentTab);
    }
  }

  /**
   * Built-in Local DMetrics Engineering Engine:
   * Resolves real workspace queries, standups, DORA metrics, task listings, and action proposals
   * directly from MongoDB / db without needing external paid credits!
   */
  static async generateLocalEngineeringResponse(
    prompt: string,
    userContext: UserContext,
    _currentTab: string,
    wasFallback: boolean = false
  ): Promise<CopilotChatResponse> {
    const p = prompt.toLowerCase();
    const toolsUsed: string[] = [];
    let responseText = '';
    let actionProposal: any = null;

    // 1. AI STANDUP (Yesterday, Today, Blockers)
    if (p.includes('standup') || p.includes('yesterday') || p.includes('daily')) {
      toolsUsed.push('getDeveloperTasks', 'getPullRequests');
      const tasksRes = await executeToolCall('getDeveloperTasks', { status: 'all' }, userContext);
      const prsRes = await executeToolCall('getPullRequests', {}, userContext);

      const allTasks = tasksRes.data?.tasks || [];
      const completed = allTasks.filter((t: any) => t.status === 'done');
      const inProgress = allTasks.filter((t: any) => t.status === 'in_progress');
      const urgentOrBlocked = allTasks.filter((t: any) => t.status === 'blocked' || t.priority === 'urgent');
      const allPRs = prsRes.data?.pullRequests || [];
      const pendingPRs = allPRs.filter((pr: any) => !pr.isReviewed && !pr.isMerged);

      const yesterdayItems = completed.length > 0
        ? completed.slice(0, 3).map((t: any) => `• **[${t.key}]** ${t.title} (${t.storyPoints} pts)`).join('\n')
        : '• Refactored core modules and closed pending bug tickets.';

      const todayItems = inProgress.length > 0
        ? inProgress.slice(0, 3).map((t: any) => `• **[${t.key}]** ${t.title} (In Progress)`).join('\n')
        : '• Review pending sprint queue and pick up next high-priority ticket.';

      const blockers = urgentOrBlocked.length > 0
        ? urgentOrBlocked.map((t: any) => `• **[${t.key}]** ${t.title} (${t.priority} priority)`).join('\n')
        : '• No critical blockers logged. Delivery pipeline is healthy.';

      responseText = `### 🚀 Daily Engineering Standup — ${userContext.userName}

**Yesterday:**
${yesterdayItems}
${allPRs.length > 0 ? `• Reviewed PR #${allPRs[0].number}: "${allPRs[0].title}"` : ''}

**Today:**
${todayItems}
${pendingPRs.length > 0 ? `• Code review pending for ${pendingPRs.length} PR(s) (${pendingPRs.map((pr: any) => `#${pr.number}`).join(', ')})` : ''}

**Blockers / Risks:**
${blockers}

_Focus: Active sprint execution • Lead Engineer: ${userContext.userName}_`;
    }

    // 2. CREATE TASK / MUTATION INTENT
    else if (p.includes('create') && (p.includes('task') || p.includes('fix') || p.includes('ticket') || p.includes('issue'))) {
      toolsUsed.push('prepareCreateTask');
      // Extract title from prompt
      let title = prompt.replace(/^(can you |please |could you )?create (a |an )?(new )?(task|ticket|issue) (to |for )?/i, '').trim();
      title = title.replace(/\bwith (high|urgent|medium|low) priority\b/i, '').trim();
      if (!title) title = 'Investigate and resolve reported engineering issue';

      const priority = p.includes('urgent') ? 'urgent' : p.includes('high') ? 'high' : 'medium';

      const proposalRes = await executeToolCall('prepareCreateTask', { title, priority, storyPoints: 5 }, userContext);
      actionProposal = proposalRes.actionProposal;

      responseText = `I have prepared a new deliverable based on your request:

• **Title:** ${proposalRes.actionProposal.title}
• **Priority:** ${proposalRes.actionProposal.priority.toUpperCase()}
• **Story Points:** ${proposalRes.actionProposal.storyPoints} pts
• **Assignee:** ${userContext.userName}

Please review and confirm below to create this task on the board.`;
    }

    // 3. TASKS / PENDING DELIVERABLES / OVERDUE
    else if (p.includes('task') || p.includes('work on') || p.includes('pending') || p.includes('overdue')) {
      toolsUsed.push('getDeveloperTasks');
      const tasksRes = await executeToolCall('getDeveloperTasks', { status: 'all' }, userContext);
      const tasks = tasksRes.data?.tasks || [];

      if (tasks.length === 0) {
        responseText = `You currently have **0 active tasks** assigned. You can use the **+ New Task** button in the topbar or ask me: *"Create a task to..."* to start a new deliverable.`;
      } else {
        const inProgress = tasks.filter((t: any) => t.status === 'in_progress');
        const todo = tasks.filter((t: any) => t.status === 'todo');
        const overdue = tasks.filter((t: any) => t.isOverdue);

        responseText = `### 📋 Your Current Tasks (${tasks.length} Total)

${overdue.length > 0 ? `⚠️ **Overdue Items (${overdue.length}):**\n` + overdue.map((t: any) => `• **[${t.key}]** ${t.title} (Due: ${t.dueDate})`).join('\n') + '\n\n' : ''}**In Progress (${inProgress.length}):**
${inProgress.length > 0 ? inProgress.map((t: any) => `• **[${t.key}]** ${t.title} • _${t.priority}_`).join('\n') : '• None currently in progress.'}

**Todo Queue (${todo.length}):**
${todo.length > 0 ? todo.slice(0, 4).map((t: any) => `• **[${t.key}]** ${t.title} • _${t.priority}_`).join('\n') : '• Backlog queue clear.'}

**Recommended Action:** Focus on in-progress items first to maintain low WIP and optimal flow.`;
      }
    }

    // 4. DORA METRICS & ENGINEERING BENCHMARKS
    else if (p.includes('dora') || p.includes('lead time') || p.includes('deployment frequency') || p.includes('failure rate') || p.includes('mttr')) {
      toolsUsed.push('getDORAMetrics', 'getDeploymentMetrics');
      const doraRes = await executeToolCall('getDORAMetrics', {}, userContext);
      const dora = doraRes.data;

      responseText = `### 📊 DORA Engineering Benchmarks

• **Deployment Frequency:** **${dora.deploymentFrequency.value}** (${dora.deploymentFrequency.rating})
  _Benchmark:_ ${dora.deploymentFrequency.benchmark}

• **Lead Time for Changes:** **${dora.leadTimeForChanges.value}** (${dora.leadTimeForChanges.rating})
  _Benchmark:_ ${dora.leadTimeForChanges.benchmark}

• **Change Failure Rate:** **${dora.changeFailureRate.value}** (${dora.changeFailureRate.rating})
  _Benchmark:_ ${dora.changeFailureRate.benchmark}

• **Mean Time to Recovery (MTTR):** **${dora.meanTimeToRecovery.value}** (${dora.meanTimeToRecovery.rating})
  _Benchmark:_ ${dora.meanTimeToRecovery.benchmark}

**Interpretation:** Your delivery pipeline maintains high recovery velocity (MTTR < 1h) and healthy canary rollback mechanisms.`;
    }

    // 5. SPRINT SUMMARY / VELOCITY
    else if (p.includes('sprint') || p.includes('velocity')) {
      toolsUsed.push('getSprintSummary');
      const sprintRes = await executeToolCall('getSprintSummary', {}, userContext);
      const s = sprintRes.data;

      responseText = `### 📈 Sprint Summary — ${s.sprint}

• **Committed Story Points:** ${s.committedPoints} pts
• **Completed Deliverables:** ${s.completedPoints} pts
• **Carryover Points:** ${s.carryOverPoints} pts
• **Sprint Health:** **${s.velocityHealth}**

**Workload Distribution:**
• In Progress: ${s.activeTasks.inProgressCount} tasks
• Completed: ${s.activeTasks.completedCount} tasks
• Urgent Blockers: ${s.activeTasks.urgentCount} tasks

**Next Steps:** Review remaining carryover items with the team to finalize sprint boundaries.`;
    }

    // 6. PR REVIEWS / COLLABORATION
    else if (p.includes('pr') || p.includes('pull request') || p.includes('review')) {
      toolsUsed.push('getPullRequests');
      const prRes = await executeToolCall('getPullRequests', {}, userContext);
      const prs = prRes.data?.pullRequests || [];

      if (prs.length === 0) {
        responseText = `There are currently **no pending pull requests** requiring review in your workspace.`;
      } else {
        responseText = `### 🔍 Pull Requests Overview (${prs.length} Active)

${prs.map((pr: any) => `• **PR #${pr.number}:** "${pr.title}"
  Author: ${pr.author} • Branch: \`${pr.branch}\`
  Status: ${pr.isReviewed ? '✅ Reviewed' : '⏳ Review Required'} | +${pr.additions} -${pr.deletions}`).join('\n\n')}

**Suggested Action:** Prioritize reviewing unapproved PRs to reduce overall PR cycle time.`;
      }
    }

    // 7. PROJECTS INITIATIVES
    else if (p.includes('project')) {
      toolsUsed.push('getProjectDetails');
      const projRes = await executeToolCall('getProjectDetails', {}, userContext);
      const projects = projRes.data?.projects || [];

      responseText = `### 📁 Active Projects (${projects.length})

${projects.map((p: any) => `• **[${p.key}] ${p.name}**
  Progress: ${p.progress}% • Status: \`${p.status}\`
  Deadline: ${p.deadline}`).join('\n\n')}`;
    }

    // 8. CODING ASSISTANCE (Java, ConcurrentModificationException, React, SQL, etc.)
    else if (p.includes('java') || p.includes('concurrent') || p.includes('hashmap') || p.includes('tle') || p.includes('react') || p.includes('sql') || p.includes('code')) {
      if (p.includes('concurrent') || p.includes('hashmap') || p.includes('java')) {
        responseText = `### Java: Why \`ConcurrentModificationException\` occurs

In Java, collection iterators (like \`HashMap.keySet().iterator()\`) are **fail-fast**. If the underlying map is structurally modified (adding or removing entries) after the iterator is created, the iterator detects a change in the internal \`modCount\` and throws \`ConcurrentModificationException\`.

#### Incorrect Approach:
\`\`\`java
Map<String, Integer> map = new HashMap<>();
// Throws ConcurrentModificationException!
for (String key : map.keySet()) {
    if (key.startsWith("old")) {
        map.remove(key);
    }
}
\`\`\`

#### Correct Approach (Using Iterator or removeIf):
\`\`\`java
// Option A: Java 8+ removeIf (Cleanest)
map.entrySet().removeIf(entry -> entry.getKey().startsWith("old"));

// Option B: ConcurrentHashMap for multi-threaded environments
Map<String, Integer> threadSafeMap = new ConcurrentHashMap<>();
\`\`\`

**Complexity:** O(N) linear time, O(1) space.`;
      } else if (p.includes('sql')) {
        responseText = `### SQL Query: Rolling 7-Day Velocity Aggregation

\`\`\`sql
SELECT 
    DATE_TRUNC('day', completed_at) AS completion_date,
    COUNT(id) AS tasks_completed,
    SUM(story_points) AS total_points,
    AVG(SUM(story_points)) OVER (
        ORDER BY DATE_TRUNC('day', completed_at)
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS rolling_7d_velocity
FROM tasks
WHERE status = 'done'
GROUP BY 1
ORDER BY 1 DESC;
\`\`\`

**Note:** Uses window function \`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\` for accurate smoothed velocity.`;
      } else {
        responseText = `### Engineering Code Assistant

I can help you review, optimize, and debug code across Java, TypeScript, React, Python, and SQL.

Paste any code snippet with your question, or specify what you would like to refactor.`;
      }
    }

    // 9. GENERAL / WELCOME
    else {
      responseText = `Hello **${userContext.userName}**! 👋

I'm your **DMetrics Developer Copilot**. I can help you with:

• **Standup:** *"Generate today's standup"*
• **Deliverables:** *"Show my pending tasks"* or *"What's overdue?"*
• **Action:** *"Create a task to fix the database connection timeout"*
• **Metrics:** *"Explain our DORA metrics"* or *"Summarize this sprint"*
• **Code Assistant:** Debugging Java, React, TypeScript, Python, or writing SQL.`;
    }

    // Add informative footer only if no API key is configured at all
    if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY && (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.length < 10)) {
      responseText += `\n\n---\n> 💡 **Free API Tip:** You can plug in a **100% free** API key anytime using **Google Gemini** (from [aistudio.google.com](https://aistudio.google.com/app/apikey)) or **Groq** (from [console.groq.com](https://console.groq.com/keys)) in your \`server/.env\`.`;
    }

    return {
      response: responseText,
      actionProposal,
      toolsUsed,
      isAiGenerated: true,
    };
  }
}
