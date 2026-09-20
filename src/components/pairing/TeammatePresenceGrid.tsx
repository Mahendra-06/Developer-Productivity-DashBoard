import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { TeammatePresence, PairingStatus } from '../../types';
import { 
  Users, 
  Sparkles, 
  Clock, 
  Code2, 
  MessageSquare, 
  CheckCircle2, 
  Flame, 
  Bell, 
  Check, 
  Zap, 
  ShieldAlert, 
  Coffee,
  Github,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';

interface TeammatePresenceGridProps {
  onOpenHuddleRequest: (teammate: TeammatePresence) => void;
  filterStatus: string;
  searchQuery: string;
}

export const TeammatePresenceGrid: React.FC<TeammatePresenceGridProps> = ({
  onOpenHuddleRequest,
  filterStatus,
  searchQuery
}) => {
  const { presences } = useDashboard();
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);

  const handleNotifyWhenFree = (id: string) => {
    setNotifiedIds(prev => [...prev, id]);
    setTimeout(() => {
      setNotifiedIds(prev => prev.filter(item => item !== id));
    }, 2500);
  };

  const getStatusBadge = (status: PairingStatus, endsAt?: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available to Pair
          </span>
        );
      case 'deep_work':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            In Deep Work {endsAt ? `• Until ${endsAt}` : ''}
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            In PR Review
          </span>
        );
      case 'on_call':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            On-Call Incident Triage
          </span>
        );
      case 'away':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Coffee className="w-3 h-3" />
            Away
          </span>
        );
    }
  };

  const filtered = presences.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesRole = p.role.toLowerCase().includes(q);
      const matchesTopic = p.topic?.toLowerCase().includes(q);
      const matchesSkills = p.skills?.some(s => s.toLowerCase().includes(q)) ?? false;
      return matchesName || matchesRole || matchesTopic || matchesSkills;
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="py-12 px-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Users className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {presences.length === 0 ? 'No Teammates Connected' : 'No Teammates Found'}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          {presences.length === 0
            ? 'Teammates will appear here live when they log in or are invited to the workspace.'
            : 'Try adjusting your search query or status filter.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filtered.map((teammate) => {
        const isNotified = notifiedIds.includes(teammate.id);

        return (
          <div
            key={teammate.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-brand-500/40 transition-all group"
          >
            <div>
              {/* Header: Avatar, Name, Status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={teammate.avatar}
                      alt={teammate.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-800"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                      {teammate.status === 'available' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span 
                        className={`relative inline-flex rounded-full h-3.5 w-3.5 ring-2 ring-white dark:ring-slate-900 ${
                          teammate.status === 'available'
                            ? 'bg-emerald-500'
                            : teammate.status === 'deep_work'
                            ? 'bg-purple-500'
                            : teammate.status === 'in_review'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`} 
                      />
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-400 transition-colors">
                      {teammate.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {teammate.role}
                    </p>
                    {teammate.githubUsername && (
                      <a
                        href={teammate.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono text-slate-400 hover:text-brand-400 transition-colors group/gh"
                      >
                        <Github className="w-2.5 h-2.5" />
                        <span>@{teammate.githubUsername}</span>
                        <ExternalLink className="w-2 h-2 opacity-0 group-hover/gh:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>

                {getStatusBadge(teammate.status, teammate.deepWorkEndsAt)}
              </div>

              {/* Current Activity & Pairing Topic */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60 mb-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Current Task / Focus:</span>
                  <span className="font-mono text-[10px] text-slate-400">{teammate.uninterruptedMinutes}m uninterrupted</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2">
                  {teammate.currentActivity}
                </p>
                {teammate.topic && (
                  <div className="pt-1.5 flex items-center gap-1.5 text-[11px] text-brand-500 dark:text-brand-400 font-medium">
                    <Code2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Willing to pair on: <strong>{teammate.topic}</strong></span>
                  </div>
                )}
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {teammate.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Response: ~5m
              </span>

              {teammate.status === 'available' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenHuddleRequest(teammate)}
                  icon={<Zap className="w-3.5 h-3.5" />}
                >
                  Request 15m Huddle
                </Button>
              ) : teammate.status === 'deep_work' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNotifyWhenFree(teammate.id)}
                  icon={isNotified ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bell className="w-3.5 h-3.5" />}
                >
                  {isNotified ? 'Subscribed!' : 'Notify When Free'}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenHuddleRequest(teammate)}
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  Queue Review Swap
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="col-span-2 p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No teammates match current filter</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try clearing your search query or selecting 'All Teammates'.</p>
        </div>
      )}
    </div>
  );
};
