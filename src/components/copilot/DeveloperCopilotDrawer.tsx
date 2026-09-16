import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Plus, 
  Check, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  User, 
  Terminal, 
  Flame, 
  Layers, 
  GitPullRequest, 
  Clock, 
  FolderGit2,
  Trash2,
  History,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { CodeBlock } from './CodeBlock';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  actionProposal?: {
    action: string;
    title: string;
    description?: string;
    priority?: string;
    projectId?: string;
    storyPoints?: number;
    confirmed?: boolean;
    cancelled?: boolean;
    executedKey?: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

interface DeveloperCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
}

export const DeveloperCopilotDrawer: React.FC<DeveloperCopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
}) => {
  const { user, addTask } = useDashboard();
  const { toast } = useToast();

  const storageKey = `dmetrics_copilot_conversations_${user.id || 'default'}`;

  // Load conversations from local storage
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        /* fallback */
      }
    }
    return [
      {
        id: `conv_${Date.now()}`,
        title: 'New Session',
        updatedAt: new Date().toISOString(),
        messages: [],
      },
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || `conv_${Date.now()}`);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConvId) || conversations[0];
  const messages = activeConversation?.messages || [];

  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(conversations));
  }, [conversations, storageKey]);

  // Auto-scroll on message updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus textarea when opening drawer
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Keyboard shortcut listener: Esc closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Dynamic suggested prompts based on currentTab
  const getSuggestedPrompts = () => {
    switch (currentTab) {
      case 'tasks':
        return [
          { label: '📋 What should I work on next?', prompt: 'What tasks should I work on next based on priority and due date?' },
          { label: '⏰ Show overdue tasks', prompt: 'Which of my tasks are currently overdue?' },
          { label: '➕ Create a new task', prompt: 'Create a task to resolve the Redis cache connection pool leak with high priority.' },
        ];
      case 'projects':
        return [
          { label: '📁 Summarize active projects', prompt: 'Summarize the progress and deadlines of my assigned projects.' },
          { label: '🚨 Any blocked deliverables?', prompt: 'Are there any blocked tasks or delayed milestones across my projects?' },
        ];
      case 'reviews':
      case 'pull_requests':
        return [
          { label: '🔍 Summarize pending reviews', prompt: 'Which pull requests currently require my code review?' },
          { label: '🎯 PR review workload', prompt: 'Who has the highest review workload on the team right now?' },
        ];
      case 'profile':
      case 'developer_summary':
        return [
          { label: '📊 Analyze my performance', prompt: 'Analyze my velocity and completed story points for this sprint.' },
          { label: '💡 What should I improve?', prompt: 'What areas should I focus on to optimize my engineering cycle time?' },
        ];
      case 'dashboard':
      default:
        return [
          { label: '🚀 Generate Today\'s Standup', prompt: 'Generate my daily engineering standup with Yesterday, Today, and Blockers.' },
          { label: '📊 Explain my metrics', prompt: 'Explain my productivity metrics, lead time, and recent velocity.' },
          { label: '📋 My pending work', prompt: 'Show me my pending tasks and upcoming deliverables for this sprint.' },
          { label: '☕ Help debug Java code', prompt: 'Why might a Java HashMap throw ConcurrentModificationException during iteration?' },
        ];
    }
  };

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Session',
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations([newConv, ...conversations]);
    setActiveConvId(newConv.id);
    setShowHistory(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleClearCurrentChat = () => {
    setConversations(prev =>
      prev.map(c => (c.id === activeConvId ? { ...c, messages: [], updatedAt: new Date().toISOString() } : c))
    );
    toast.info('Conversation history cleared', 'Copilot');
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      handleClearCurrentChat();
      return;
    }
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (activeConvId === id) {
      setActiveConvId(filtered[0]?.id || `conv_${Date.now()}`);
    }
  };

  const handleSendPrompt = async (promptText: string) => {
    const text = promptText.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];

    // Update conversation title if first message
    const isFirstMessage = messages.length === 0;
    const newTitle = isFirstMessage ? (text.length > 28 ? `${text.slice(0, 28)}...` : text) : activeConversation.title;

    setConversations(prev =>
      prev.map(c =>
        c.id === activeConvId
          ? {
              ...c,
              title: newTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : c
      )
    );

    setInput('');
    setIsLoading(true);

    try {
      // Call backend AI copilot API
      const res = await api.copilotChat({
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        currentTab,
      });

      const assistantMessage: Message = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: res.response || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: res.toolsUsed || [],
        actionProposal: res.actionProposal || undefined,
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === activeConvId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...updatedMessages, assistantMessage],
              }
            : c
        )
      );
    } catch (err: any) {
      const errorMessage: Message = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${err.message || 'AI service is temporarily unavailable. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === activeConvId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...updatedMessages, errorMessage],
              }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt(input);
    }
  };

  // Action Confirmation: User confirms proposed action (e.g. createTask)
  const handleConfirmAction = async (msgId: string, proposal: any) => {
    setActionLoading(true);
    try {
      const res = await api.copilotExecuteAction('create_task', proposal);

      if (res.task) {
        // Add task to local state via DashboardContext
        addTask(res.task);
        toast.success(`Task ${res.task.key} created successfully!`, 'AI Action Confirmed');

        // Update message state
        setConversations(prev =>
          prev.map(c => {
            if (c.id !== activeConvId) return c;
            return {
              ...c,
              messages: c.messages.map(m => {
                if (m.id !== msgId) return m;
                return {
                  ...m,
                  actionProposal: {
                    ...m.actionProposal!,
                    confirmed: true,
                    executedKey: res.task.key,
                  },
                };
              }),
            };
          })
        );
      }
    } catch (err: any) {
      toast.error(`Action failed: ${err.message}`, 'Action Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== activeConvId) return c;
        return {
          ...c,
          messages: c.messages.map(m => {
            if (m.id !== msgId) return m;
            return {
              ...m,
              actionProposal: {
                ...m.actionProposal!,
                cancelled: true,
              },
            };
          }),
        };
      })
    );
    toast.info('Action cancelled by user', 'Copilot');
  };

  // Render assistant markdown and code blocks cleanly
  const renderMessageContent = (content: string) => {
    // Regex to capture ```language ... ``` code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        elements.push(
          <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed space-y-1 my-1">
            {formatInlineText(content.slice(lastIndex, match.index))}
          </div>
        );
      }

      // Code block
      const lang = match[1] || 'code';
      const codeText = match[2].trimEnd();
      elements.push(<CodeBlock key={`code_${match.index}`} language={lang} code={codeText} />);

      lastIndex = codeBlockRegex.lastIndex;
    }

    // Remaining text after last code block
    if (lastIndex < content.length) {
      elements.push(
        <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed space-y-1 my-1">
          {formatInlineText(content.slice(lastIndex))}
        </div>
      );
    }

    return elements;
  };

  // Simple text formatter for bold **text** and bullet points
  const formatInlineText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        const lineContent = line.slice(2);
        return (
          <div key={idx} className="flex items-start gap-2 pl-2">
            <span className="text-brand-400 font-bold">•</span>
            <span>{parseBold(lineContent)}</span>
          </div>
        );
      }
      return <p key={idx}>{parseBold(line)}</p>;
    });
  };

  const parseBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Backdrop for Mobile */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden pointer-events-auto transition-opacity" 
      />

      {/* Slide-over Drawer Panel */}
      <aside 
        className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 pointer-events-auto"
        aria-label="DMetrics Developer Copilot"
      >
        <div className="w-screen max-w-full md:w-[440px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-slide-left text-slate-100">
          
          {/* HEADER */}
          <div className="p-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-white">DMetrics Copilot</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Context: <span className="text-brand-400 font-semibold uppercase">{currentTab}</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
                  showHistory ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Conversation History"
              >
                <History className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs"
                title="New Chat Session"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Close Drawer (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CONVERSATION SESSIONS DRAWER (COLLAPSIBLE) */}
          {showHistory && (
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2 max-h-56 overflow-y-auto animate-slide-down">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Saved Sessions</span>
                <button
                  type="button"
                  onClick={handleClearCurrentChat}
                  className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Current
                </button>
              </div>

              <div className="space-y-1">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setShowHistory(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                      conv.id === activeConvId
                        ? 'bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{conv.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={e => handleDeleteConversation(conv.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                      title="Delete conversation"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-purple-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hello {user?.name || 'Developer'} 👋</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    I'm your DMetrics Copilot. I analyze your tasks, DORA velocity, PR reviews, and help you write & debug code.
                  </p>
                </div>

                {/* Suggested Prompts Grid */}
                <div className="space-y-1.5 pt-2 text-left">
                  <span className="text-[11px] font-semibold text-slate-400 block px-1">Suggested for {currentTab}:</span>
                  <div className="flex flex-col gap-1.5">
                    {getSuggestedPrompts().map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendPrompt(item.prompt)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                      >
                        <span>{item.label}</span>
                        <span className="text-slate-500 group-hover:text-brand-400 text-[11px]">↵</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-mono">
                    {msg.role === 'user' ? (
                      <>
                        <span>{user?.name || 'You'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-brand-400" />
                        <span>DMetrics Copilot</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </>
                    )}
                  </div>

                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10'
                        : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 shadow-md'
                    }`}
                  >
                    {renderMessageContent(msg.content)}

                    {/* Tools Used Badge */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-2.5 pt-2 border-t border-slate-700/50">
                        <span className="text-[10px] text-slate-400 font-mono">Telemetry tools:</span>
                        {msg.toolsUsed.map(t => (
                          <span
                            key={t}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* ACTION PROPOSAL CARD (MUTATION SAFETY) */}
                    {msg.actionProposal && !msg.actionProposal.confirmed && !msg.actionProposal.cancelled && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5 animate-slide-down">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>Action Confirmation Required</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-300">
                          <p><strong className="text-white">Task:</strong> {msg.actionProposal.title}</p>
                          {msg.actionProposal.priority && (
                            <p>
                              <strong className="text-white">Priority:</strong>{' '}
                              <span className="capitalize font-mono text-amber-300">{msg.actionProposal.priority}</span>
                            </p>
                          )}
                          {msg.actionProposal.storyPoints && (
                            <p><strong className="text-white">Points:</strong> {msg.actionProposal.storyPoints} pts</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleConfirmAction(msg.id, msg.actionProposal)}
                            icon={actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          >
                            {actionLoading ? 'Creating...' : 'Create Task'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleCancelAction(msg.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Executed Confirmation Badge */}
                    {msg.actionProposal?.confirmed && (
                      <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Task {msg.actionProposal.executedKey || 'created'} confirmed and added to board</span>
                      </div>
                    )}

                    {/* Cancelled Badge */}
                    {msg.actionProposal?.cancelled && (
                      <div className="mt-2 text-[11px] text-slate-400 italic">
                        Action proposal cancelled.
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Thinking / Loading State */}
            {isLoading && (
              <div className="flex flex-col items-start animate-fade-in">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono">
                  <Bot className="w-3 h-3 text-brand-400 animate-spin" />
                  <span>DMetrics Copilot</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/70 text-slate-400 text-xs flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                  <span>Analyzing engineering telemetry and crafting response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT PILLS (WHEN CHAT IS ACTIVE) */}
          {messages.length > 0 && (
            <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/60 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              {getSuggestedPrompts().slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(item.prompt)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* INPUT FORM */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 shrink-0">
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDownTextarea}
                  placeholder={`Ask Copilot about metrics, tasks, code, or standup...`}
                  rows={2}
                  disabled={isLoading}
                  className="w-full resize-none p-2.5 pr-8 text-xs rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500/50 outline-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1 font-mono">
              <span>Shift+Enter for newline</span>
              <span>Protected by DMetrics Security Policy</span>
            </div>
          </div>

        </div>
      </aside>
    </div>
  );
};
