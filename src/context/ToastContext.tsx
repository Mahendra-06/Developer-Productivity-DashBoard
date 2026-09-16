import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'ai' | 'warning';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    ai: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    title?: string, 
    duration: number = 3500
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, message, type, title, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep at most 5 visible toasts

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  const toast = {
    success: (message: string, title: string = 'Success') => showToast(message, 'success', title),
    error: (message: string, title: string = 'Error') => showToast(message, 'error', title, 5000),
    info: (message: string, title: string = 'Notification') => showToast(message, 'info', title),
    ai: (message: string, title: string = 'AI Intelligence') => showToast(message, 'ai', title),
    warning: (message: string, title: string = 'Warning') => showToast(message, 'warning', title, 4500),
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-brand-400 shrink-0" />;
    }
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-slate-900/95 shadow-emerald-500/10 text-slate-100';
      case 'error':
        return 'border-rose-500/40 bg-slate-900/95 shadow-rose-500/10 text-slate-100';
      case 'warning':
        return 'border-amber-500/40 bg-slate-900/95 shadow-amber-500/10 text-slate-100';
      case 'ai':
        return 'border-purple-500/40 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 shadow-purple-500/15 text-slate-100';
      case 'info':
      default:
        return 'border-brand-500/30 bg-slate-900/95 shadow-brand-500/10 text-slate-100';
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, toast }}>
      {children}

      {/* Floating Micro-Toast Stack */}
      <div 
        aria-live="polite" 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-slide-down ${getToastStyle(t.type)}`}
          >
            <div className="mt-0.5">{getToastIcon(t.type)}</div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <h5 className="text-xs font-semibold tracking-tight text-slate-100">
                  {t.title}
                </h5>
              )}
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800/60 shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
