import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Assignee, Task } from '../../types';
import { InviteMemberModal } from '../team/InviteMemberModal';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Users, 
  Sparkles, 
  Search, 
  Plus, 
  Github, 
  FolderGit2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  Layers,
  Flame,
  CheckSquare,
  Filter,
  Briefcase,
  Mail,
  AtSign,
  ArrowRight,
  TrendingUp,
  MoreVertical,
  Copy,
  Check,
  UserMinus,
  AlertTriangle
} from 'lucide-react';

export const TeamPairingLobby: React.FC = () => {
  const { 
    user, 
    teamMembers, 
    teamInvitations,
    projects, 
    tasks, 
    openCreateModal,
    removeTeamMember,
    acceptTeamInvitation,
    revokeTeamInvitation
  } = useDashboard();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inspectedMember, setInspectedMember] = useState<Assignee | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Assignee | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  const pendingInvitations = useMemo(() => (teamInvitations || []).filter(inv => inv.status === 'pending'), [teamInvitations]);

  // Compute all unique engineering roles across members
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    teamMembers.forEach(m => {
      if (m.role) roles.add(m.role);
    });
    return Array.from(roles);
  }, [teamMembers]);

  // Associate members with projects and tasks
  const memberWorkMap = useMemo(() => {
    const map = new Map<string, {
      member: Assignee;
      memberProjects: typeof projects;
      activeTasks: Task[];
      completedTasks: Task[];
      totalStoryPoints: number;
    }>();

    teamMembers.forEach(member => {
      const key = member.email || member.id;

      // Find tasks assigned to this member
      const memberTasks = tasks.filter(t => {
        // Never show personal tasks of any member in the Team Lobby
        const isPersonal = Boolean(t.key && t.key.toUpperCase().startsWith('PERSONAL-'));
        if (isPersonal) return false;

        const isAssigned = Boolean(
          (member.id && (t.assignee?.id === member.id || t.assigneeId === member.id)) ||
          (member.email && t.assignee?.email && member.email.toLowerCase() === t.assignee.email.toLowerCase()) ||
          (member.username && t.assignee?.username && member.username.toLowerCase() === t.assignee.username.toLowerCase())
        );

        return isAssigned;
      });

      const activeTasks = memberTasks.filter(t => t.status !== 'done');
      const completedTasks = memberTasks.filter(t => t.status === 'done');
      const totalStoryPoints = activeTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      // Find projects this member is part of — check all possible ID/name fields
      // because the context sometimes replaces lead objects with the effectiveUser
      const projectIds = new Set<string>();
      projects.forEach(p => {
        const matchById =
          // Check hydrated lead object
          p.lead?.id === member.id ||
          p.lead?.email === member.email ||
          (member.username && p.lead?.username === member.username) ||
          // Check raw leadId field (not overridden by context)
          (p as any).leadId === member.id ||
          // Check hydrated team array
          p.team?.some(m => m.id === member.id || m.email === member.email || (member.username && (m as any).username === member.username)) ||
          // Check raw teamIds array (not overridden by context)
          ((p as any).teamIds as string[] | undefined)?.includes(member.id);
        if (matchById) projectIds.add(p.id);
      });
      memberTasks.forEach(t => {
        if (t.projectId && !t.key?.toUpperCase().startsWith('PERSONAL-')) {
          projectIds.add(t.projectId);
        }
      });

      const memberProjects = projects.filter(p => projectIds.has(p.id));

      map.set(key, {
        member,
        memberProjects,
        activeTasks,
        completedTasks,
        totalStoryPoints
      });
    });

    return map;
  }, [teamMembers, tasks, projects]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return Array.from(memberWorkMap.values()).filter(({ member, memberProjects }) => {
      // 1. Filter by Project
      if (selectedProjectId !== 'all') {
        const isInProject = memberProjects.some(p => p.id === selectedProjectId);
        if (!isInProject) return false;
      }

      // 2. Filter by Role
      if (selectedRole !== 'all' && member.role !== selectedRole) {
        return false;
      }

      // 3. Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = member.name.toLowerCase().includes(query);
        const matchesHandle = member.username?.toLowerCase().includes(query);
        const matchesEmail = member.email?.toLowerCase().includes(query);
        const matchesRole = member.role.toLowerCase().includes(query);
        const matchesGithub = member.githubUsername?.toLowerCase().includes(query);
        if (!matchesName && !matchesHandle && !matchesEmail && !matchesRole && !matchesGithub) {
          return false;
        }
      }

      return true;
    });
  }, [memberWorkMap, selectedProjectId, selectedRole, searchQuery]);

  // Summary Metrics
  const totalEngineers = teamMembers.length;
  const activeDeliverablesCount = tasks.filter(t => t.status !== 'done' && !t.key?.toUpperCase().startsWith('PERSONAL-')).length;
  const githubConnectedCount = teamMembers.filter(m => m.githubUsername).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header & Workspace Summary */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              <span>Engineering Workspace Mesh</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Engineering Team Lobby & Workspace Roster
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Explore your engineers, project allocations, linked GitHub contributor profiles, and live sprint deliverables in real time.
            </p>
          </div>

          {/* Quick Metrics Bar & Add Teammate Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-4 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 justify-around">
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 block font-medium">Engineers</span>
                <span className="text-xl font-bold font-mono text-white">{totalEngineers}</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 block font-medium">Active Projects</span>
                <span className="text-xl font-bold font-mono text-brand-400">{projects.length}</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 block font-medium">Deliverables In Flight</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{activeDeliverablesCount}</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 block font-medium">GitHub Connected</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{githubConnectedCount}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-2 shadow-brand-500/20 shadow-md bg-brand-600 hover:bg-brand-500 shrink-0 py-3"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teammates by name, role, handle, or GitHub username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <FolderGit2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span className="text-slate-400 text-[11px] font-medium">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-100">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* Role Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-slate-400 text-[11px] font-medium">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-100">All Roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-slate-100">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {(selectedProjectId !== 'all' || selectedRole !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedProjectId('all');
                setSelectedRole('all');
                setSearchQuery('');
              }}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-2 px-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Pending Team Invitations (if any exist) */}
      {pendingInvitations.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Pending Team Invitations ({pendingInvitations.length})
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingInvitations.map(inv => {
              const assignedProj = projects.find(p => p.id === inv.projectId);
              const isInvitedMe = user && (user.email.toLowerCase() === inv.inviteeEmail.toLowerCase());

              return (
                <div key={inv.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {inv.inviteeName || inv.inviteeEmail}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{inv.inviteeEmail}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <span>Role: {inv.role || 'Engineer'}</span>
                      {assignedProj && <span>• {assignedProj.name}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    {isInvitedMe && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => acceptTeamInvitation(inv.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-1 py-1 text-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept</span>
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => revokeTeamInvitation(inv.id)}
                      className="px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Roster Grid */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No teammates match current filter criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your project filter, search query, or onboard a new team member to this project.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard First Teammate</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMembers.map(({ member, memberProjects, activeTasks, completedTasks, totalStoryPoints }) => {
            const isCurrentUser = user && (user.id === member.id || user.email === member.email);

            return (
              <div
                key={member.id || member.email}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm hover:border-slate-700 transition flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Active user highlight ribbon */}
                {isCurrentUser && (
                  <div className="absolute top-0 right-0 px-3 py-0.5 bg-brand-500/20 border-b border-l border-brand-500/30 text-[10px] font-mono font-bold text-brand-300 rounded-bl-xl">
                    You (Active Session)
                  </div>
                )}

                <div>
                  {/* Top Row: Avatar & Basic Info */}
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800 shadow bg-slate-950"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.username || member.name)}`;
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center">
                        <CheckCircle2 className="w-2 h-2 text-white" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate">
                          {member.name}
                        </h3>
                        {member.username && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/15 text-brand-300 border border-brand-500/20 font-semibold">
                            @{member.username}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                        {member.role}
                      </p>

                      {/* GitHub Link */}
                      {member.githubUsername ? (
                        <a
                          href={member.githubUsername.startsWith('http') ? member.githubUsername : `https://github.com/${member.githubUsername.replace(/^https?:\/\/github\.com\//i, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-brand-300 mt-1 transition"
                        >
                          <Github className="w-3 h-3 text-slate-400" />
                          <span>github.com/{member.githubUsername.replace(/^https?:\/\/github\.com\//i, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-1">
                          <Github className="w-3 h-3 text-slate-600" />
                          <span>GitHub Unlinked</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project Allocations */}
                  <div className="mb-3.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Allocated Projects
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {memberProjects.length === 0 ? (
                        <span className="text-[11px] text-slate-500 italic">
                          General Workspace (Unassigned)
                        </span>
                      ) : (
                        memberProjects.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                          >
                            <FolderGit2 className="w-2.5 h-2.5 text-brand-400" />
                            <span>{p.name}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Active Work & Deliverables */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Active Deliverables ({activeTasks.length})</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {totalStoryPoints} Story Pts
                      </span>
                    </div>

                    {activeTasks.length === 0 ? (
                      <div className="py-2 text-center">
                        <p className="text-[11px] text-slate-500 italic">
                          Bandwidth Available — No active deliverables
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {activeTasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-brand-400 shrink-0">
                                  {t.key}
                                </span>
                                <span className="truncate text-slate-200 text-[11px] font-medium">
                                  {t.title}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                              t.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300'
                                : t.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                        {activeTasks.length > 2 && (
                          <p className="text-[10px] text-slate-400 text-center pt-0.5">
                            +{activeTasks.length - 2} additional deliverables in sprint
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-bold">{completedTasks.length}</span> shipped
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectedMember(member)}
                      className="text-xs py-1 px-2.5"
                    >
                      Inspect Work
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => openCreateModal(member.id || member.username || member.email)}
                      className="text-xs py-1 px-2.5 gap-1 bg-brand-600 hover:bg-brand-500"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign</span>
                    </Button>

                    {/* Developer Three-Dot Actions Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const key = member.id || member.email || '';
                          setActiveMenuId(activeMenuId === key ? null : key);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                        title="Teammate Actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuId === (member.id || member.email) && (
                        <div
                          className="absolute right-0 bottom-full mb-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-slide-down space-y-0.5"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedMember(member);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-left"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Inspect Deliverables</span>
                          </button>

                          {member.githubUsername && (
                            <a
                              href={`https://github.com/${member.githubUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveMenuId(null)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-left"
                            >
                              <Github className="w-3.5 h-3.5 text-slate-400" />
                              <span>GitHub Profile</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-60" />
                            </a>
                          )}

                          {memberProjects.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectId(memberProjects[0].id);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-left"
                            >
                              <FolderGit2 className="w-3.5 h-3.5 text-brand-400" />
                              <span>Filter Projects ({memberProjects.length})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              openCreateModal(member.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-left"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Assign Deliverable</span>
                          </button>

                          {Boolean(member.email) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (member.email) navigator.clipboard.writeText(member.email);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-left"
                            >
                              <Mail className="w-3.5 h-3.5 text-purple-400" />
                              <span>Copy Developer Email</span>
                            </button>
                          )}

                          {!isCurrentUser && (
                            <>
                              <div className="my-1 border-t border-slate-800" />
                              <button
                                type="button"
                                onClick={() => {
                                  setMemberToRemove(member);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-lg text-left transition font-medium"
                              >
                                <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                                <span>Remove from Team</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Details & Work Inspector Modal */}
      {inspectedMember && (
        <Modal
          isOpen={Boolean(inspectedMember)}
          onClose={() => setInspectedMember(null)}
          title={`Teammate Work Inspector: ${inspectedMember.name}`}
          subtitle="Detailed audit of project allocations, assigned deliverables, and contribution telemetry."
          maxWidth="max-w-2xl"
        >
          {(() => {
            const data = memberWorkMap.get(inspectedMember.email || inspectedMember.id);
            if (!data) return null;
            const { memberProjects, activeTasks, completedTasks, totalStoryPoints } = data;

            return (
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {/* Header overview */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                  <img
                    src={inspectedMember.avatar}
                    alt={inspectedMember.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500/40 bg-slate-950"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{inspectedMember.name}</h3>
                      {inspectedMember.username && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
                          @{inspectedMember.username}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{inspectedMember.role}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      {inspectedMember.email && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Mail className="w-3 h-3 text-brand-400" />
                          {inspectedMember.email}
                        </span>
                      )}
                      {inspectedMember.githubUsername && (
                        <a
                          href={`https://github.com/${inspectedMember.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-mono text-[11px] text-slate-300 hover:text-brand-400 transition"
                        >
                          <Github className="w-3 h-3" />
                          <span>github.com/{inspectedMember.githubUsername}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workload Stats Bar */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">In Flight Tasks</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">{activeTasks.length}</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Story Points Load</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{totalStoryPoints} pts</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Shipped Deliverables</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{completedTasks.length}</span>
                  </div>
                </div>

                {/* Allocated Projects List */}
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Project Allocations & Responsibilities
                  </h4>
                  <div className="space-y-2">
                    {memberProjects.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                        No specific projects allocated yet.
                      </p>
                    ) : (
                      memberProjects.map((p) => (
                        <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <FolderGit2 className="w-3.5 h-3.5 text-brand-400" />
                              {p.name} ({p.key})
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {p.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* All Assigned Tasks */}
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    All Assigned Deliverables
                  </h4>
                  <div className="space-y-2">
                    {activeTasks.length === 0 && completedTasks.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                        No tasks assigned to this teammate yet.
                      </p>
                    ) : (
                      [...activeTasks, ...completedTasks].map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-brand-400">{t.key}</span>
                              <span className="font-semibold text-white truncate">{t.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{t.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-slate-400">{t.storyPoints} pts</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              t.status === 'done'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : t.status === 'in_progress'
                                ? 'bg-brand-500/20 text-brand-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Onboard Team Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
      />

      {/* Remove Team Member Confirmation Modal */}
      {memberToRemove && (
        <Modal
          isOpen={Boolean(memberToRemove)}
          onClose={() => !isRemoving && setMemberToRemove(null)}
          title="Remove Team Member"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <span className="font-semibold block mb-0.5">Are you sure you want to remove this engineer?</span>
                This will unlink them from your engineering workspace team lobby and any shared projects led by you. Their independent account data will not be deleted.
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <img
                src={memberToRemove.avatar}
                alt={memberToRemove.name}
                className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-950"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(memberToRemove.username || memberToRemove.name)}`;
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{memberToRemove.name}</h4>
                  {memberToRemove.username && (
                    <span className="text-[10px] font-mono text-brand-300 bg-brand-500/15 px-1.5 py-0.5 rounded">
                      @{memberToRemove.username}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{memberToRemove.role}</p>
                {memberToRemove.email && (
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">{memberToRemove.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRemoving}
                onClick={() => setMemberToRemove(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isRemoving}
                onClick={async () => {
                  if (!memberToRemove) return;
                  setIsRemoving(true);
                  try {
                    await removeTeamMember(memberToRemove.id);
                    setMemberToRemove(null);
                  } finally {
                    setIsRemoving(false);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white gap-1.5 shadow-lg shadow-rose-600/20"
              >
                <UserMinus className="w-4 h-4" />
                <span>{isRemoving ? 'Removing...' : 'Remove from Team'}</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
