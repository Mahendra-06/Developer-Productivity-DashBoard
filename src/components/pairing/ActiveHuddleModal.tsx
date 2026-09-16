import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { PairingRoom } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Mic, 
  MicOff, 
  Monitor, 
  PhoneOff, 
  GitBranch, 
  Copy, 
  Check, 
  Code2, 
  MessageSquare, 
  Users, 
  Sparkles 
} from 'lucide-react';

interface ActiveHuddleModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: PairingRoom | null;
}

export const ActiveHuddleModal: React.FC<ActiveHuddleModalProps> = ({
  isOpen,
  onClose,
  room
}) => {
  const { leavePairingRoom } = useDashboard();
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(true);
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [scratchpadText, setScratchpadText] = useState(
    `// Live Pair Programming Scratchpad\n// Branch: feat/redis-bloom-filter\n\n// TODO: Validate false positive probability formula:\n// p = (1 - exp(-k * n / m))^k\n\nconst optimalHashFunctions = (m: number, n: number) => Math.round((m / n) * Math.log(2));`
  );
  const [seconds, setSeconds] = useState(145);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!room) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyBranch = () => {
    navigator.clipboard.writeText(`git checkout ${room.branchName}`);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  const handleLeave = () => {
    leavePairingRoom(room.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={room.title} maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Top Room Meta Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              {room.branchName}
            </span>
            <button
              onClick={handleCopyBranch}
              className="text-slate-400 hover:text-brand-400 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Copy checkout command"
            >
              {copiedBranch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Huddle • {formatTimer(seconds)}</span>
            </div>
          </div>
        </div>

        {/* Video / Audio Participant Dock */}
        <div className="grid grid-cols-2 gap-3">
          {room.participants.map((participant, idx) => (
            <div
              key={idx}
              className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center gap-3 overflow-hidden shadow-md"
            >
              {/* Audio visualizer glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative">
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/60"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center text-[8px] text-white">
                  ✓
                </span>
              </div>

              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{participant.name}</span>
                  {idx === 0 && (
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300">
                      Host
                    </span>
                  )}
                </h5>
                <p className="text-[11px] text-slate-400">{participant.role}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Speaking (WebRTC HD)</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Collaborative Scratchpad */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-brand-500" />
              Shared Coding Scratchpad (Live Synchronized)
            </span>
            <span className="font-mono text-[10px] text-slate-400">TypeScript / Markdown</span>
          </div>

          <textarea
            rows={7}
            value={scratchpadText}
            onChange={(e) => setScratchpadText(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-900 border border-slate-800 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none shadow-inner"
          />
        </div>

        {/* Huddle Controls Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant={isMuted ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              icon={isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            >
              {isMuted ? 'Unmute' : 'Mute Mic'}
            </Button>

            <Button
              variant={isScreenSharing ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              icon={<Monitor className="w-3.5 h-3.5 text-brand-400" />}
            >
              {isScreenSharing ? 'Screen Sharing Active' : 'Share Screen'}
            </Button>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLeave}
            icon={<PhoneOff className="w-3.5 h-3.5" />}
          >
            Leave Huddle
          </Button>
        </div>
      </div>
    </Modal>
  );
};
