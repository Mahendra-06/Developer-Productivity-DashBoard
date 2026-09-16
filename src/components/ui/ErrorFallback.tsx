import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title = 'Failed to load telemetry stream',
  message = 'An unexpected network error occurred while aggregating developer performance metrics.',
  onRetry
}) => {
  return (
    <div className="p-8 my-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-rose-500 dark:text-rose-400">{title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRetry}
          className="shrink-0 text-xs border-rose-500/20 hover:border-rose-500/40"
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};
