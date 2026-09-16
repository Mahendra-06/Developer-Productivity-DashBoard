import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  Code, 
  Printer, 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  Calendar 
} from 'lucide-react';

interface SprintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SprintExportModal: React.FC<SprintExportModalProps> = ({ isOpen, onClose }) => {
  const { tasks, projects, user } = useDashboard();
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json' | 'markdown' | 'pdf'>('csv');

  const activeProject = projects.length > 0 ? projects[0] : null;

  const sprintTitle = activeProject ? activeProject.name : 'Active Cycle';
  const sprintFileSlug = activeProject ? activeProject.key.toLowerCase() : 'sprint';

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = tasks
    .filter((t) => t.status === 'done')
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const inProgressPoints = tasks
    .filter((t) => t.status === 'in_progress' || t.status === 'in_review')
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const velocityRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const generateMarkdown = () => {
    let md = `# ${sprintTitle} Engineering Deliverables Report\n`;
    md += `**Engineer**: ${user.name} (@${user.username})\n`;
    md += `**Generated At**: ${new Date().toLocaleDateString()}\n`;
    md += `**Sprint Velocity**: ${completedPoints} / ${totalPoints} Story Points Shipped (${velocityRate}%)\n\n`;

    md += `## Completed Tasks\n`;
    tasks.filter((t) => t.status === 'done').forEach((t) => {
      md += `- [x] **${t.key}**: ${t.title} (${t.storyPoints} pts, ${t.projectName})\n`;
    });

    md += `\n## In Progress / Active Review\n`;
    tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').forEach((t) => {
      md += `- [ ] **${t.key}**: ${t.title} (${t.status.replace('_', ' ')}, ${t.storyPoints} pts)\n`;
    });

    md += `\n## Backlog / Planned\n`;
    tasks.filter((t) => t.status === 'backlog').forEach((t) => {
      md += `- [ ] **${t.key}**: ${t.title} (${t.storyPoints} pts)\n`;
    });

    return md;
  };

  const generateCSV = () => {
    const headers = ['Key', 'Title', 'Project', 'Status', 'Priority', 'Story Points', 'Due Date', 'Assignee'];
    const rows = tasks.map((t) => [
      t.key,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.projectName}"`,
      t.status,
      t.priority,
      t.storyPoints,
      t.dueDate,
      `"${t.assignee.name}"`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const generateJSON = () => {
    const payload = {
      reportType: 'Executive Sprint Summary',
      generatedAt: new Date().toISOString(),
      sprint: {
        cycleName: sprintTitle,
        projectKey: activeProject?.key || 'ALL',
        totalPoints,
        completedPoints,
        inProgressPoints,
        velocityRate: `${velocityRate}%`,
        activeEngineer: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        progress: p.progress,
        status: p.status
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        key: t.key,
        title: t.title,
        status: t.status,
        priority: t.priority,
        storyPoints: t.storyPoints,
        dueDate: t.dueDate,
        projectName: t.projectName,
        assignee: t.assignee.name
      }))
    };
    return JSON.stringify(payload, null, 2);
  };

  const getContent = () => {
    if (format === 'csv') return generateCSV();
    if (format === 'json') return generateJSON();
    if (format === 'markdown') return generateMarkdown();
    return '';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (format === 'pdf') {
      window.print();
      return;
    }

    const content = getContent();
    const mimeTypes: Record<string, string> = {
      csv: 'text/csv;charset=utf-8',
      json: 'application/json;charset=utf-8',
      markdown: 'text/markdown;charset=utf-8'
    };
    const extensions: Record<string, string> = {
      csv: 'csv',
      json: 'json',
      markdown: 'md'
    };

    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dmetrics-${sprintFileSlug}-report.${extensions[format]}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Executive Sprint Report"
      subtitle="Generate compliant executive deliverables for stakeholders, spreadsheets, or CI/CD"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Format Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                format === 'csv'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Spreadsheet</span>
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                format === 'json'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Payload</span>
            </button>
            <button
              onClick={() => setFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                format === 'markdown'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              onClick={() => setFormat('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                format === 'pdf'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF View</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {format !== 'pdf' && (
              <Button
                variant="outline"
                size="sm"
                icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={format === 'pdf' ? <Printer className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
            >
              {format === 'pdf' ? 'Print / Save PDF' : 'Download File'}
            </Button>
          </div>
        </div>

        {/* Dynamic Preview Area */}
        {format === 'pdf' ? (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100 max-h-80 overflow-y-auto">
            {/* Executive PDF Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-500 font-bold">DMetrics Executive Briefing</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{sprintTitle} Engineering Velocity & Delivery Report</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Prepared for Engineering Leadership • Generated {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  Sprint Complete ({velocityRate}%)
                </span>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Shipped Velocity</span>
                <span className="text-lg font-bold text-emerald-500">{completedPoints} / {totalPoints}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Story Points</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Active In-Flight</span>
                <span className="text-lg font-bold text-amber-500">{inProgressPoints} pts</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Review & In-Progress</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Delivery Rate</span>
                <span className="text-lg font-bold text-brand-500">{velocityRate}%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Sprint Target: 85%</span>
              </div>
            </div>

            {/* Task Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Deliverables</h4>
              <div className="space-y-1.5 text-xs">
                {tasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{t.key}</span>
                      <span className="font-medium truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                      <span className="font-mono text-slate-400">{t.storyPoints} pts</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.status === 'done' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs max-h-72 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
            {getContent()}
          </pre>
        )}
      </div>
    </Modal>
  );
};
