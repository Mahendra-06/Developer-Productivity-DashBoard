import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Radio, GitBranch, Terminal, Plus } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const { createPairingRoom } = useDashboard();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [branchName, setBranchName] = useState('feat/pairing-session');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPairingRoom(
      title.trim() || 'Collaborative Code Review',
      topic.trim() || 'Interactive architecture discussion & testing',
      branchName.trim() || 'feat/live-sync'
    );
    setTitle('');
    setTopic('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start Virtual Pairing Room" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-brand-500" />
            Room Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Redis Cluster Cache Invalidation Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Goals & Focus Topic
          </label>
          <textarea
            rows={2}
            required
            placeholder="e.g. Walkthrough edge cases in Bloom filter false-positive calculations..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-brand-500" />
            Target Git Branch
          </label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" icon={<Plus className="w-3.5 h-3.5" />}>
            Launch Room
          </Button>
        </div>
      </form>
    </Modal>
  );
};
