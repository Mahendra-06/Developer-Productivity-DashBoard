import React from 'react';
import { FolderSearch, Plus, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  showReset?: boolean;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No tasks found',
  description = 'Try adjusting your search query, status filters, or project selection.',
  actionLabel,
  onAction,
  icon,
  showReset = false,
  onReset
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4 ring-8 ring-brand-500/5">
        {icon || <FolderSearch className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-3">
        {showReset && onReset && (
          <Button variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={onReset}>
            Reset Filters
          </Button>
        )}
        {actionLabel && onAction && (
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
