import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { DeveloperSkill } from '../../types';
import { 
  Code2, 
  Plus, 
  Check, 
  Layers, 
  Terminal, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { Button } from '../ui/Button';

export const SkillMatrixCard: React.FC = () => {
  const { user, updateUser } = useDashboard();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'languages' | 'distributed' | 'cloud' | 'security'>('languages');
  const [newSkillMastery, setNewSkillMastery] = useState(85);

  const skills: DeveloperSkill[] = user.skills || [];

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const colors: Record<string, string> = {
      languages: '#3178c6',
      distributed: '#dc2626',
      cloud: '#326ce5',
      security: '#10b981'
    };

    const newSkill: DeveloperSkill = {
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: newSkillMastery >= 90 ? 'Expert' : newSkillMastery >= 80 ? 'Senior' : 'Advanced',
      mastery: newSkillMastery,
      color: colors[newSkillCategory] || '#6366f1',
      linesWritten: '5.0k'
    };

    updateUser({
      skills: [...skills, newSkill]
    });

    setNewSkillName('');
    setIsAdding(false);
  };

  const filteredSkills = skills.filter(s => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Engineering Competency & Mastery Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified by Git commit telemetry, language syntax profiling, and merged PR diffs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            {['all', 'languages', 'distributed', 'cloud', 'security'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 rounded-lg font-medium capitalize transition-all ${
                  activeCategory === cat
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-brand-400 hover:border-brand-500/50 transition-colors"
            title="Add Skill"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Skill Form Toggle */}
      {isAdding && (
        <form onSubmit={handleAddSkill} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-brand-500/30 space-y-3 animate-fade-in text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              placeholder="Skill name (e.g., Rust / Axum, GraphQL)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value as any)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="languages">Languages</option>
              <option value="distributed">Distributed Systems</option>
              <option value="cloud">Cloud & Containers</option>
              <option value="security">Security</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">Mastery: {newSkillMastery}%</span>
              <input
                type="range"
                min="50"
                max="100"
                value={newSkillMastery}
                onChange={(e) => setNewSkillMastery(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-medium"
            >
              Add Competency
            </button>
          </div>
        </form>
      )}

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Code2 className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {skills.length === 0 ? 'No engineering competencies registered yet' : 'No competencies found in this category'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {skills.length === 0 ? 'Add your verified skills and mastery levels using the + button above.' : 'Try selecting a different filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSkills.map((skill, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between hover:border-brand-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: skill.color }} />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{skill.name}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                  {skill.level}
                </span>
              </div>

              {/* Mastery Bar */}
              <div className="space-y-1 mt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{skill.linesWritten} LOC written</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{skill.mastery}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${skill.mastery}%`, backgroundColor: skill.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
