import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#6366f1',
  height = 'h-2',
  showLabel = false,
  label,
  className = ''
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
          <span>{label || 'Progress'}</span>
          <span className="font-mono text-slate-800 dark:text-slate-200">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${height} p-[1px]`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};
