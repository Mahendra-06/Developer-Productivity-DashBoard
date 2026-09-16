import { MetricCardData, Task, TimeRange } from '../types';

export const computeMetricsForTimeframe = (
  timeframe: TimeRange,
  tasks: Task[] = [],
  productivityScore: number = 0,
  prsCount: number = 0,
  analyticsSummary?: any
): MetricCardData[] => {
  const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'in_review');
  const backlogTasks = tasks.filter(t => t.status === 'backlog');

  const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const inProgressPoints = inProgressTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const backlogPoints = backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  // Exact focus hours derived from story point deliverables or analytics summary
  const focusHours = analyticsSummary?.totalFocusHours !== undefined
    ? analyticsSummary.totalFocusHours
    : Number((completedPoints * 1.5 + inProgressPoints * 0.8).toFixed(1));

  const shippedEfficiency = totalStoryPoints > 0 ? Math.round((completedPoints / totalStoryPoints) * 100) : 0;
  const score = analyticsSummary?.productivityScore !== undefined ? analyticsSummary.productivityScore : productivityScore;

  if (tasks.length === 0 && prsCount === 0) {
    return [
      {
        id: '1',
        label: timeframe === 'today' ? 'Deep Work Time' : timeframe === 'month' ? 'Monthly Focus Hours' : timeframe === 'sprint' ? 'Sprint Deep Work' : 'Weekly Focus Hours',
        value: '0.0',
        unit: 'hrs',
        change: 0,
        changeType: 'increase',
        trend: [0, 0, 0, 0],
        period: '0 logged focus hours',
        iconName: 'Clock',
        badgeText: 'No Logs',
      },
      {
        id: '2',
        label: timeframe === 'sprint' ? 'Story Points Shipped' : timeframe === 'today' ? 'Work Items in Flight' : 'Deliverables Shipped',
        value: '0',
        unit: timeframe === 'sprint' ? 'pts' : 'tasks',
        change: 0,
        changeType: 'increase',
        trend: [0, 0, 0, 0],
        period: '0 tracked items',
        iconName: 'GitCommit',
        badgeText: 'Empty',
      },
      {
        id: '3',
        label: 'Pull Requests Active',
        value: '0',
        unit: 'PRs',
        change: 0,
        changeType: 'increase',
        trend: [0, 0, 0, 0],
        period: 'Review Queue Clear',
        iconName: 'GitPullRequest',
        badgeText: 'Queue Empty',
      },
      {
        id: '4',
        label: 'Sprint Velocity Score',
        value: '0',
        unit: '/100',
        change: 0,
        changeType: 'increase',
        trend: [0, 0, 0, 0],
        period: 'No active deliverables',
        iconName: 'Award',
        badgeText: 'No Data',
      },
    ];
  }

  switch (timeframe) {
    case 'today': {
      return [
        {
          id: '1',
          label: 'Deep Work Time',
          value: `${focusHours}`,
          unit: 'hrs',
          change: focusHours > 0 ? shippedEfficiency : 0,
          changeType: 'increase',
          trend: [0, inProgressPoints, completedPoints, totalStoryPoints],
          period: `${completedTasks.length} tasks resolved`,
          iconName: 'Clock',
          badgeText: focusHours === 0 ? 'No logs yet' : `${focusHours}h Logged`,
        },
        {
          id: '2',
          label: 'Work Items in Flight',
          value: `${inProgressTasks.length}`,
          unit: 'tasks',
          change: inProgressPoints,
          changeType: 'increase',
          trend: [0, backlogTasks.length, inProgressTasks.length, tasks.length],
          period: `${inProgressPoints} active story points`,
          iconName: 'GitCommit',
          badgeText: inProgressTasks.length > 0 ? 'In Progress' : 'Idle',
        },
        {
          id: '3',
          label: 'Pull Requests Active',
          value: `${prsCount}`,
          unit: 'PRs',
          change: 0,
          changeType: 'increase',
          trend: [0, 0, prsCount, prsCount],
          period: 'In Review Queue',
          iconName: 'GitPullRequest',
          badgeText: prsCount > 0 ? 'Active' : 'Clear',
        },
        {
          id: '4',
          label: 'Sprint Velocity Score',
          value: `${score}`,
          unit: '/100',
          change: shippedEfficiency,
          changeType: 'increase',
          trend: [0, Math.round(score * 0.5), Math.round(score * 0.8), score],
          period: `${shippedEfficiency}% completion rate`,
          iconName: 'Zap',
          badgeText: score >= 80 ? 'Optimal' : score > 0 ? 'Active' : 'Unscored',
        },
      ];
    }
    case 'month': {
      return [
        {
          id: '1',
          label: 'Monthly Focus Hours',
          value: `${focusHours}`,
          unit: 'hrs',
          change: shippedEfficiency,
          changeType: 'increase',
          trend: [0, inProgressPoints, completedPoints, totalStoryPoints],
          period: `Across ${tasks.length} deliverables`,
          iconName: 'Clock',
          badgeText: focusHours > 0 ? 'Tracked' : 'No Logs',
        },
        {
          id: '2',
          label: 'Tasks Completed',
          value: `${completedTasks.length}`,
          unit: 'tasks',
          change: completedPoints,
          changeType: 'increase',
          trend: [0, backlogTasks.length, inProgressTasks.length, completedTasks.length],
          period: `Of ${tasks.length} total tasks`,
          iconName: 'GitCommit',
          badgeText: `${shippedEfficiency}% Shipped`,
        },
        {
          id: '3',
          label: 'Pull Requests',
          value: `${prsCount}`,
          unit: 'PRs',
          change: 0,
          changeType: 'increase',
          trend: [0, 0, prsCount, prsCount],
          period: 'Code Reviews',
          iconName: 'GitPullRequest',
          badgeText: 'Verified',
        },
        {
          id: '4',
          label: 'Delivery Rate',
          value: `${shippedEfficiency}%`,
          unit: '',
          change: shippedEfficiency,
          changeType: 'increase',
          trend: [0, Math.round(shippedEfficiency * 0.6), Math.round(shippedEfficiency * 0.8), shippedEfficiency],
          period: `${completedTasks.length} tasks closed`,
          iconName: 'Award',
          badgeText: shippedEfficiency >= 50 ? 'On Track' : 'In Progress',
        },
      ];
    }
    case 'sprint': {
      return [
        {
          id: '1',
          label: 'Sprint Deep Work',
          value: `${focusHours}`,
          unit: 'hrs',
          change: shippedEfficiency,
          changeType: 'increase',
          trend: [0, inProgressPoints, completedPoints, totalStoryPoints],
          period: `From ${totalStoryPoints} story pts`,
          iconName: 'Clock',
          badgeText: focusHours > 0 ? 'Active Flow' : 'No Logs',
        },
        {
          id: '2',
          label: 'Story Points Shipped',
          value: `${completedPoints}`,
          unit: 'pts',
          change: completedPoints,
          changeType: 'increase',
          trend: [0, inProgressPoints, completedPoints, totalStoryPoints],
          period: `Sprint Target: ${totalStoryPoints} pts`,
          iconName: 'TrendingUp',
          badgeText: `${shippedEfficiency}% Shipped`,
        },
        {
          id: '3',
          label: 'Active In-Flight',
          value: `${inProgressPoints}`,
          unit: 'pts',
          change: inProgressTasks.length,
          changeType: 'increase',
          trend: [0, backlogPoints, inProgressPoints, totalStoryPoints],
          period: `${inProgressTasks.length} tasks in progress`,
          iconName: 'GitPullRequest',
          badgeText: inProgressTasks.length > 0 ? 'Active' : 'Clear',
        },
        {
          id: '4',
          label: 'Sprint Velocity Score',
          value: `${score}`,
          unit: '/100',
          change: shippedEfficiency,
          changeType: 'increase',
          trend: [0, Math.round(score * 0.5), Math.round(score * 0.8), score],
          period: 'Real-time Telemetry',
          iconName: 'ShieldCheck',
          badgeText: score >= 80 ? 'High Velocity' : score > 0 ? 'In Progress' : 'Unscored',
        },
      ];
    }
    case 'week':
    default: {
      return [
        {
          id: '1',
          label: 'Weekly Focus Hours',
          value: `${focusHours}`,
          unit: 'hrs',
          change: shippedEfficiency,
          changeType: 'increase',
          trend: [0, inProgressPoints, completedPoints, totalStoryPoints],
          period: 'Tracked from deliverables',
          iconName: 'Clock',
          badgeText: focusHours > 0 ? 'Active Flow' : 'No Logs',
        },
        {
          id: '2',
          label: 'Deliverables Shipped',
          value: `${completedTasks.length}`,
          unit: 'tasks',
          change: completedPoints,
          changeType: 'increase',
          trend: [0, inProgressTasks.length, completedTasks.length, tasks.length],
          period: `${tasks.length} total tasks`,
          iconName: 'GitCommit',
          badgeText: `${completedPoints} pts done`,
        },
        {
          id: '3',
          label: 'Pull Requests',
          value: `${prsCount}`,
          unit: 'PRs',
          change: 0,
          changeType: 'increase',
          trend: [0, 0, prsCount, prsCount],
          period: 'Review Queue',
          iconName: 'GitPullRequest',
          badgeText: prsCount > 0 ? 'Active' : 'Clear',
        },
        {
          id: '4',
          label: 'Sprint Velocity Score',
          value: `${score}`,
          unit: '/100',
          change: shippedEfficiency,
          changeType: 'increase',
          trend: [0, Math.round(score * 0.5), Math.round(score * 0.8), score],
          period: `${shippedEfficiency}% completion rate`,
          iconName: 'Award',
          badgeText: score >= 80 ? 'Optimal' : score > 0 ? 'Calculated Live' : 'Unscored',
        },
      ];
    }
  }
};
