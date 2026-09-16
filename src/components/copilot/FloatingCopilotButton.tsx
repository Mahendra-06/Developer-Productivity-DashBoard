import React from 'react';
import { Sparkles, Bot } from 'lucide-react';

interface FloatingCopilotButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingCopilotButton: React.FC<FloatingCopilotButtonProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-2xl shadow-brand-500/30 border border-white/20 hover:scale-105 active:scale-95 transition-all duration-200 group"
      aria-label="Open DMetrics Developer Copilot (Ctrl+J)"
      title="Open DMetrics Developer Copilot (Ctrl+J)"
    >
      <div className="relative">
        <Bot className="w-5 h-5 text-white" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      </div>

      <span className="text-xs tracking-tight hidden sm:inline">Copilot</span>

      <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-white/80">
        ⌘J
      </span>
    </button>
  );
};
