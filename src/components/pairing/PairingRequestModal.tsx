import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { TeammatePresence } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Zap, 
  Clock, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

interface PairingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  teammate: TeammatePresence | null;
  onSessionStarted?: () => void;
}

export const PairingRequestModal: React.FC<PairingRequestModalProps> = ({
  isOpen,
  onClose,
  teammate,
  onSessionStarted
}) => {
  const { requestHuddle, createPairingRoom } = useDashboard();
  const [selectedAgenda, setSelectedAgenda] = useState('Quick Debugging Walkthrough 🐛');
  const [duration, setDuration] = useState(15);
  const [note, setNote] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!teammate) return null;

  const agendaOptions = [
    'Quick Debugging Walkthrough 🐛',
    'PR Review & Unblockers 🔍',
    'Architecture RFC Sounding Board 📐',
    'Rubber Ducking Problem 🦆',
    'Pair Programming Session 💻'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestHuddle(teammate, selectedAgenda, duration, note);
    setIsSent(true);

    setTimeout(() => {
      setIsSent(false);
      createPairingRoom(
        `${selectedAgenda.split(' ')[0]} with ${teammate.name}`,
        note || `Focusing on ${teammate.topic || 'architecture collaboration'}`,
        'feat/huddle-live'
      );
      onClose();
      if (onSessionStarted) onSessionStarted();
    }, 900);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Pairing Huddle" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Teammate Header */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <img
            src={teammate.avatar}
            alt={teammate.name}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-brand-500/40"
          />
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{teammate.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{teammate.role}</p>
            <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium mt-0.5">
              • Working on: {teammate.currentActivity}
            </p>
          </div>
        </div>

        {/* Agenda Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-500" />
            Select Huddle Agenda
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {agendaOptions.map((agenda) => (
              <button
                key={agenda}
                type="button"
                onClick={() => setSelectedAgenda(agenda)}
                className={`p-2 rounded-lg text-left text-xs font-medium border transition-all ${
                  selectedAgenda === agenda
                    ? 'bg-brand-500/15 border-brand-500/60 text-brand-600 dark:text-brand-300 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {agenda}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            Timebox Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDuration(mins)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-center ${
                  duration === mins
                    ? 'bg-brand-500/15 border-brand-500/60 text-brand-600 dark:text-brand-300 font-semibold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
            Context / Specific PR or Ticket Link (Optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Need second pair of eyes on PR #142 Redis cache invalidation logic..."
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            icon={isSent ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4" />}
          >
            {isSent ? 'Connecting Huddle...' : `Send ${duration}m Request`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
