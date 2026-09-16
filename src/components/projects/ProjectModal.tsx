import React, { useState, useEffect } from 'react';
import { FolderPlus, AlertCircle, CheckCircle2, Github, Calendar, User, Palette, Users, UserCheck, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProjectStatus, ProjectCategory } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#8b5cf6', label: 'Purple' },
  { hex: '#3b82f6', label: 'Blue' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose }) => {
  const { addProject, teamMembers, user } = useDashboard();

  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectCategory>('team');
  const [leadId, setLeadId] = useState(teamMembers[0]?.id || 'usr_1');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(getDefaultDeadline());
  const [color, setColor] = useState('#6366f1');
  const [status, setStatus] = useState<ProjectStatus>('on_track');
  const [repoUrl, setRepoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep selected team member IDs in sync with lead and team availability
  useEffect(() => {
    if (teamMembers.length > 0) {
      if (!selectedTeamIds.length) {
        setSelectedTeamIds(teamMembers.map(m => m.id));
      }
      if (!leadId) {
        setLeadId(projectType === 'individual' ? (user?.id || teamMembers[0].id) : teamMembers[0].id);
      }
    }
  }, [teamMembers, user, projectType]);

  const handleProjectTypeChange = (newType: ProjectCategory) => {
    setProjectType(newType);
    if (newType === 'individual') {
      const soloId = user?.id || teamMembers[0]?.id || 'usr_1';
      setLeadId(soloId);
      setSelectedTeamIds([soloId]);
    } else {
      if (teamMembers.length > 0) {
        setSelectedTeamIds(teamMembers.map(m => m.id));
      }
    }
  };

  // When lead changes, ensure lead is part of selectedTeamIds if team project
  const handleLeadChange = (newLeadId: string) => {
    setLeadId(newLeadId);
    if (!selectedTeamIds.includes(newLeadId)) {
      setSelectedTeamIds(prev => [...prev, newLeadId]);
    }
  };

  const toggleTeamMember = (memberId: string) => {
    if (memberId === leadId) return; // Lead Engineer must remain in the project team
    setSelectedTeamIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  // Auto-generate a clean project key from name if key hasn't been manually set
  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length < 3) {
      const suggestedKey = val
        .split(' ')
        .map(w => w.charAt(0))
        .join('')
        .slice(0, 4)
        .toUpperCase();
      if (suggestedKey) setKey(suggestedKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Project name must be at least 2 characters.');
      return;
    }

    const cleanKey = key.trim().toUpperCase();
    if (!cleanKey || cleanKey.length < 2 || cleanKey.length > 10) {
      setErrorMessage('Project key must be between 2 and 10 alphanumeric characters (e.g. AUTH).');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Description must be at least 5 characters long.');
      return;
    }

    if (!deadline) {
      setErrorMessage('Please specify a valid deadline target.');
      return;
    }

    const finalLeadId = projectType === 'individual' ? (user?.id || leadId) : leadId;
    const finalTeamIds = projectType === 'individual' ? [finalLeadId] : selectedTeamIds;

    setIsSubmitting(true);
    try {
      await addProject({
        name: name.trim(),
        key: cleanKey,
        description: description.trim(),
        projectType,
        leadId: finalLeadId,
        teamIds: finalTeamIds,
        deadline,
        color,
        status,
        repoUrl: repoUrl.trim() || `https://github.com/dmetrics/${cleanKey.toLowerCase()}`,
      });

      // Reset form
      setName('');
      setKey('');
      setDescription('');
      setRepoUrl('');
      setProjectType('team');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create project. Please check if the project key is already taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Engineering Project"
      subtitle="Register a new service, microservice, or repository"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interactive Project Type Selector (Team vs Individual) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Project Classification & Scope <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Choose collaboration model</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Team Project Option */}
              <div
                onClick={() => handleProjectTypeChange('team')}
                className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  projectType === 'team'
                    ? 'bg-brand-500/10 border-brand-500/60 ring-2 ring-brand-500/30 text-slate-900 dark:text-slate-100 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      projectType === 'team' ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <span>Team Project</span>
                        {projectType === 'team' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-brand-500/20 text-brand-400">
                            Shared
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        Multi-engineer collaboration
                      </p>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    projectType === 'team' ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-400 dark:border-slate-600'
                  }`}>
                    {projectType === 'team' && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 mt-1">
                  Aggregates team sprint velocity, DORA metrics & code review workflows.
                </p>
              </div>

              {/* Individual Project Option */}
              <div
                onClick={() => handleProjectTypeChange('individual')}
                className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  projectType === 'individual'
                    ? 'bg-cyan-500/10 border-cyan-500/60 ring-2 ring-cyan-500/30 text-slate-900 dark:text-slate-100 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      projectType === 'individual' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <span>Individual Project</span>
                        {projectType === 'individual' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-400">
                            Solo
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        Single developer workspace
                      </p>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    projectType === 'individual' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-400 dark:border-slate-600'
                  }`}>
                    {projectType === 'individual' && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 mt-1">
                  Dedicated personal microservice tracking, standalone commits & focus logs.
                </p>
              </div>
            </div>
          </div>

          {/* Name & Key Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Payment Gateway API"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Key Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="e.g. PAY"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm uppercase font-mono font-bold tracking-wider bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-brand-600 dark:text-brand-400 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Scope <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="High-level architecture, bounded context, and delivery requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            />
          </div>

          {/* Lead & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projectType === 'individual' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Solo Project Owner</span>
                </label>
                <div className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-cyan-500/30 rounded-xl text-slate-900 dark:text-slate-100 flex items-center justify-between min-h-[42px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={user?.name || 'You'}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-cyan-500/40 shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block truncate">{user?.name || user?.username || 'You'}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{user?.role || 'Software Engineer'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20 shrink-0">
                    You (Solo)
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lead Engineer</span>
                </label>
                <select
                  value={leadId}
                  onChange={(e) => handleLeadChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                >
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role}) {member.id === user?.id ? ' (You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Deadline</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Conditional Team Selection Block */}
          {projectType === 'team' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-500" />
                  <span>Assign Team Members ({selectedTeamIds.length})</span>
                </span>
                <span className="text-[10px] text-slate-400">Click to toggle team inclusion</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 max-h-36 overflow-y-auto">
                {teamMembers.map((member) => {
                  const isLead = member.id === leadId;
                  const isSelected = selectedTeamIds.includes(member.id);

                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleTeamMember(member.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-brand-500/40 text-slate-900 dark:text-slate-100 shadow-2xs'
                          : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={member.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-medium block truncate">{member.name}</span>
                          <span className="text-[9px] text-slate-400 block truncate">{member.role}</span>
                        </div>
                      </div>

                      {isLead ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-500/20 text-brand-400 shrink-0">
                          Lead
                        </span>
                      ) : (
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-400 dark:border-slate-600'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-2.5 h-2.5" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-500" />
              <span>This project is configured as an <strong>Individual Project</strong> assigned exclusively to the Lead Engineer.</span>
            </div>
          )}

          {/* Status & Repository URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Health Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
              >
                <option value="on_track">🟢 On Track</option>
                <option value="at_risk">🟡 At Risk</option>
                <option value="delayed">🔴 Delayed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>Repository URL</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/org/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Service Accent Color</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center ${
                    color === c.hex ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {color === c.hex && <CheckCircle2 className="w-4 h-4 text-white drop-shadow-sm" />}
                </button>
              ))}

              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  title="Choose custom hex color"
                />
                <span className="text-[11px] font-mono text-slate-500 uppercase">{color}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Service...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Register Project</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
