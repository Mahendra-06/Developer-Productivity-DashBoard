import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  User, 
  Briefcase, 
  Mail, 
  MapPin, 
  Globe, 
  Target, 
  Sparkles, 
  Check, 
  Save 
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useDashboard();

  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role,
    email: user.email,
    bio: user.bio || '',
    location: user.location || 'San Francisco, CA',
    timezone: user.timezone || 'UTC-7 (Pacific Time)',
    weeklyGoalHours: user.weeklyGoalHours,
    focusStatus: user.focusStatus,
    githubUsername: user.githubUsername || user.username || '',
    githubUrl: user.githubUrl || (user.githubUsername ? `https://github.com/${user.githubUsername}` : ''),
  });

  const [isSaved, setIsSaved] = useState(false);

  const statusPresets = [
    'Deep Work on Cache Invalidation 🚀',
    'Reviewing High-Priority PRs 🔍',
    'Pairing & Architecture Sync 🤝',
    'Incident On-Call Support ⚡',
    'Drafting Q4 Distributed RFC 📝',
    'Away / Focused Reading ☕'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: formData.name.trim() || user.name,
      role: formData.role.trim() || user.role,
      email: formData.email.trim() || user.email,
      bio: formData.bio.trim(),
      location: formData.location.trim(),
      timezone: formData.timezone.trim(),
      weeklyGoalHours: Number(formData.weeklyGoalHours) || 35,
      focusStatus: formData.focusStatus,
      githubUsername: formData.githubUsername.trim(),
      githubUrl: formData.githubUrl.trim(),
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Developer Profile" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-500" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-brand-500" />
              Engineering Role / Title
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Engineering Bio & Specialty
          </label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Describe your architectural responsibilities, key domains, and focus..."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
          />
        </div>

        {/* Location & Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-500" />
              Primary Timezone
            </label>
            <input
              type="text"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
        </div>

        {/* Weekly Deep Work Target & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-brand-500" />
              Weekly Deep Work Target (Hours)
            </label>
            <input
              type="number"
              min="10"
              max="60"
              value={formData.weeklyGoalHours}
              onChange={(e) => setFormData({ ...formData, weeklyGoalHours: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-500" />
              Primary Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
        </div>

        {/* GitHub Integration Handle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-500" />
              GitHub Handle / Username
            </label>
            <input
              type="text"
              placeholder="e.g. Mahendra-06"
              value={formData.githubUsername}
              onChange={(e) => {
                const handle = e.target.value;
                setFormData({
                  ...formData,
                  githubUsername: handle,
                  githubUrl: handle.trim() ? `https://github.com/${handle.trim()}` : formData.githubUrl
                });
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-500" />
              GitHub Profile URL
            </label>
            <input
              type="url"
              placeholder="https://github.com/your-username"
              value={formData.githubUrl}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
            />
          </div>
        </div>

        {/* Focus Status & Quick Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Active Focus Status
          </label>
          <input
            type="text"
            value={formData.focusStatus}
            onChange={(e) => setFormData({ ...formData, focusStatus: e.target.value })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 mb-2"
          />

          <div className="flex flex-wrap gap-1.5">
            {statusPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFormData({ ...formData, focusStatus: preset })}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  formData.focusStatus === preset
                    ? 'bg-brand-500/20 text-brand-400 border-brand-500/50 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            type="submit" 
            icon={isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          >
            {isSaved ? 'Saved Profile!' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
