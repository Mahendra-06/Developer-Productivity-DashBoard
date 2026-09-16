import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { PairingRoom } from '../../types';
import { 
  Radio, 
  Mic, 
  Monitor, 
  Users, 
  GitBranch, 
  Plus, 
  ExternalLink, 
  Volume2,
  PhoneCall
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ActivePairingRoomsProps {
  onJoinRoom: (room: PairingRoom) => void;
  onCreateRoom: () => void;
}

export const ActivePairingRooms: React.FC<ActivePairingRoomsProps> = ({
  onJoinRoom,
  onCreateRoom
}) => {
  const { pairingRooms } = useDashboard();

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Active Virtual Pairing Rooms</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                {pairingRooms.length} Live
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drop-in collaborative coding stations with live audio & branch syncing
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onCreateRoom}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Start New Room
        </Button>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {pairingRooms.map((room) => (
          <div
            key={room.id}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-brand-500/40 transition-all group"
          >
            <div>
              {/* Room Badges & Duration */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" />
                  {room.branchName}
                </span>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Mic className="w-3 h-3 animate-pulse" /> Audio Active
                  </span>
                  <span>• Started {room.startedAt}</span>
                </div>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-1 mb-1">
                {room.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {room.topic}
              </p>
            </div>

            {/* Participants & Join Action */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {room.participants.map((p, idx) => (
                    <img
                      key={idx}
                      src={p.avatar}
                      alt={p.name}
                      title={p.name}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {room.participants.map(p => p.name.split(' ')[0]).join(' & ')}
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onJoinRoom(room)}
                icon={<PhoneCall className="w-3.5 h-3.5 text-emerald-400" />}
              >
                Join Room
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
