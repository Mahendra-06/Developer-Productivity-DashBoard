import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Flame, 
  CheckCircle2, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Clock, 
  BrainCircuit,
  Headphones
} from 'lucide-react';

interface DeepWorkTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeepWorkTimerModal: React.FC<DeepWorkTimerModalProps> = ({ isOpen, onClose }) => {
  const { user, addTask, recordDeepWorkSession } = useDashboard();
  
  // Timer state
  const [sessionMinutes, setSessionMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'binaural' | 'whitenoise'>('off');

  // Web Audio Context reference for synthesized ambient audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Initialize time when minutes change
  const setSessionPreset = (mins: number) => {
    setIsRunning(false);
    setIsCompleted(false);
    setSessionMinutes(mins);
    setTimeLeft(mins * 60);
  };

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      setIsCompleted(true);
      // Play soft completion chime
      playChime();
      // Persist focus hours & audit trail to MongoDB
      recordDeepWorkSession(sessionMinutes);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Web Audio ambient sound synthesizer
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.error(e);
    }
  };

  const startAmbientNoise = (type: string) => {
    try {
      stopAmbientNoise();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate pink / brown / white noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Brown noise (simulates steady rain)
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else if (type === 'binaural') {
          // Low hum
          lastOut = (lastOut + 0.01 * white) / 1.01;
          data[i] = lastOut * 2.5;
        } else {
          // Pure soothing white noise
          data[i] = white * 0.08;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.value = type === 'rain' ? 800 : 400;

      const gain = ctx.createGain();
      gain.gain.value = 0.15;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(0);
      noiseNodeRef.current = noise;
    } catch (e) {
      console.error(e);
    }
  };

  const stopAmbientNoise = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const handleSoundChange = (type: 'off' | 'rain' | 'binaural' | 'whitenoise') => {
    setAmbientSound(type);
    if (type === 'off') {
      stopAmbientNoise();
    } else {
      startAmbientNoise(type);
    }
  };

  // Clean up audio on unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      stopAmbientNoise();
      setAmbientSound('off');
      setIsRunning(false);
    }
  }, [isOpen]);

  const toggleTimer = () => {
    if (!isRunning && ambientSound !== 'off' && !noiseNodeRef.current) {
      startAmbientNoise(ambientSound);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(sessionMinutes * 60);
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((sessionMinutes * 60 - timeLeft) / (sessionMinutes * 60)) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deep Work & Flow State Protocol"
      subtitle="Eliminate distractions, focus on uninterrupted engineering execution"
      maxWidth={isFullscreen ? 'max-w-4xl' : 'max-w-xl'}
    >
      <div className={`space-y-6 ${isFullscreen ? 'p-6' : ''}`}>
        {/* Preset Selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSessionPreset(25)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                sessionMinutes === 25
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              25m Pomodoro
            </button>
            <button
              onClick={() => setSessionPreset(50)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                sessionMinutes === 50
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              50m Deep Flow
            </button>
            <button
              onClick={() => setSessionPreset(15)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                sessionMinutes === 15
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              15m Sprint
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Expand Mode' : 'Expand Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Circular Countdown Display */}
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white relative shadow-2xl overflow-hidden">
          {/* Subtle pulsating glow */}
          <div className={`absolute inset-0 bg-brand-500/5 rounded-3xl transition-opacity duration-1000 ${isRunning ? 'animate-pulse' : 'opacity-0'}`} />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-brand-400 font-medium mb-2">
              <BrainCircuit className="w-4 h-4" />
              <span>{isRunning ? 'In The Flow Zone' : isCompleted ? 'Session Achieved 🎉' : 'Ready To Focus'}</span>
            </div>

            <div className="font-mono text-5xl sm:text-7xl font-extrabold tracking-tight my-2 text-slate-100 select-none">
              {formatTime(timeLeft)}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Active Focus: <strong className="text-slate-200 font-semibold">{user.focusStatus}</strong>
            </p>

            {/* Progress bar */}
            <div className="w-48 sm:w-64 h-1.5 bg-slate-800 rounded-full mt-5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Completed Feedback Banner */}
        {isCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-semibold">Deep Work Session Logged!</p>
                <p className="text-[11px] text-emerald-400/80">+{sessionMinutes} minutes added to your weekly productivity quota.</p>
              </div>
            </div>
            <span className="font-mono font-bold bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
              +{(sessionMinutes / 60).toFixed(1)}h Shipped
            </span>
          </div>
        )}

        {/* Ambient Sound Selector */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <Headphones className="w-4 h-4 text-brand-500" />
            <span>Ambient Focus Audio:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'off', label: 'Mute', icon: VolumeX },
              { id: 'rain', label: 'Rainfall', icon: Volume2 },
              { id: 'binaural', label: 'Deep Hum', icon: Volume2 },
              { id: 'whitenoise', label: 'White Noise', icon: Volume2 },
            ].map((snd) => {
              const Icon = snd.icon;
              const isSelected = ambientSound === snd.id;
              return (
                <button
                  key={snd.id}
                  onClick={() => handleSoundChange(snd.id as any)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{snd.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Controls: Play / Pause / Reset */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant={isRunning ? 'secondary' : 'primary'}
            size="lg"
            icon={isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            onClick={toggleTimer}
            className="w-44 shadow-lg"
          >
            {isRunning ? 'Pause Session' : 'Start Focus Session'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={resetTimer}
            title="Reset timer"
          >
            Reset
          </Button>
        </div>
      </div>
    </Modal>
  );
};
