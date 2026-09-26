import React, { useState, useEffect, useRef } from 'react';
import { Bell, Music, Sparkles, X } from 'lucide-react';

export type ZenSoundType = 'NONE' | 'BOWL' | 'WOOD_BLOCK' | 'RAIN';

export const ZenAudioPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeSound, setActiveSound] = useState<ZenSoundType>('NONE');
  const [volume, setVolume] = useState<number>(0.5);
  const [mindfulBellInterval, setMindfulBellInterval] = useState<number>(0); // 0 = off, 15 = 15 min, 30 = 30 min

  const audioCtxRef = useRef<AudioContext | null>(null);
  const rainSourceRef = useRef<AudioNode | null>(null);
  const woodBlockTimerRef = useRef<any>(null);
  const mindfulTimerRef = useRef<any>(null);

  // Initialize Web Audio Context
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // 1. Play Tibetan Singing Bowl sound (Chuông Bát Thiền)
  const playSingingBowl = () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const baseFreq = 261.63; // C4
      const harmonics = [1, 2.76, 5.4, 8.93];
      const gains = [0.6, 0.3, 0.15, 0.08];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, now);
      masterGain.connect(ctx.destination);

      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * h, now);

        g.gain.setValueAtTime(gains[i] * 0.4, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  };

  // 2. Play Wood Block sound (Tiếng Mõ)
  const playWoodBlock = () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(580, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn('Wood block error', e);
    }
  };

  // 3. Start Soft Rain Noise
  const startRain = () => {
    try {
      const ctx = getAudioContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 850;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.35, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      rainSourceRef.current = noise;
    } catch (e) {
      console.warn('Rain audio error', e);
    }
  };

  const stopRain = () => {
    if (rainSourceRef.current) {
      try {
        (rainSourceRef.current as any).stop();
        rainSourceRef.current.disconnect();
      } catch { }
      rainSourceRef.current = null;
    }
  };

  // Switch Sound Effect Loop
  useEffect(() => {
    stopRain();
    if (woodBlockTimerRef.current) {
      clearInterval(woodBlockTimerRef.current);
      woodBlockTimerRef.current = null;
    }

    if (activeSound === 'BOWL') {
      playSingingBowl();
      // Ring periodically every 25 seconds
      woodBlockTimerRef.current = setInterval(playSingingBowl, 25000);
    } else if (activeSound === 'WOOD_BLOCK') {
      playWoodBlock();
      // Tap rhythmically every 3 seconds
      woodBlockTimerRef.current = setInterval(playWoodBlock, 3000);
    } else if (activeSound === 'RAIN') {
      startRain();
    }

    return () => {
      stopRain();
      if (woodBlockTimerRef.current) clearInterval(woodBlockTimerRef.current);
    };
  }, [activeSound, volume]);

  // Mindfulness Interval Bell
  useEffect(() => {
    if (mindfulTimerRef.current) {
      clearInterval(mindfulTimerRef.current);
      mindfulTimerRef.current = null;
    }

    if (mindfulBellInterval > 0) {
      const ms = mindfulBellInterval * 60 * 1000;
      mindfulTimerRef.current = setInterval(() => {
        playSingingBowl();
      }, ms);
    }

    return () => {
      if (mindfulTimerRef.current) clearInterval(mindfulTimerRef.current);
    };
  }, [mindfulBellInterval, volume]);

  return (
    <div className="relative">
      {/* Floating Zen Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${activeSound !== 'NONE'
          ? 'bg-amber-900 text-amber-100 border border-amber-700 shadow-sm'
          : 'bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 border border-amber-900/15'
          }`}
        title="Không gian âm thanh"
      >
        <Music className="w-3.5 h-3.5 text-amber-700" />
        <span className="hidden sm:inline">
          {activeSound === 'NONE' ? 'Âm Thanh' : 'Đang Phát'}
        </span>
        {activeSound !== 'NONE' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        )}
      </button>

      {/* Zen Audio Drawer Popup */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-amber-900/20 p-3.5 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-amber-900/10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Cài đặt Âm Thanh</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Choices */}
          <div className="space-y-1.5 mb-3">
            <button
              onClick={() => setActiveSound('NONE')}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${activeSound === 'NONE'
                ? 'bg-amber-100 text-amber-950 font-bold'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <span>Tắt Âm Thanh</span>
              {activeSound === 'NONE' && <span className="text-amber-800 text-[10px]">●</span>}
            </button>

            <button
              onClick={() => setActiveSound('BOWL')}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${activeSound === 'BOWL'
                ? 'bg-amber-100 text-amber-950 font-bold'
                : 'text-gray-700 hover:bg-amber-50'
                }`}
            >
              <span>🔔 Tiếng Chuông</span>
              {activeSound === 'BOWL' && <span className="text-amber-800 text-[10px]">● Đang bật</span>}
            </button>

            <button
              onClick={() => setActiveSound('WOOD_BLOCK')}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${activeSound === 'WOOD_BLOCK'
                ? 'bg-amber-100 text-amber-950 font-bold'
                : 'text-gray-700 hover:bg-amber-50'
                }`}
            >
              <span>🪵 Tiếng Mõ</span>
              {activeSound === 'WOOD_BLOCK' && <span className="text-amber-800 text-[10px]">● Đang bật</span>}
            </button>

            <button
              onClick={() => setActiveSound('RAIN')}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${activeSound === 'RAIN'
                ? 'bg-amber-100 text-amber-950 font-bold'
                : 'text-gray-700 hover:bg-amber-50'
                }`}
            >
              <span>🌧️ Tiếng mưa</span>
              {activeSound === 'RAIN' && <span className="text-amber-800 text-[10px]">● Đang bật</span>}
            </button>
          </div>

          {/* Volume Slider */}
          {activeSound !== 'NONE' && (
            <div className="pt-2 border-t border-gray-100 mb-2">
              <div className="flex items-center justify-between text-[11px] text-amber-900/70 font-semibold mb-1">
                <span>Âm lượng</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-900"
              />
            </div>
          )}

          {/* Mindfulness Bell Reminder */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950 mb-1.5">
              <Bell className="w-3 h-3 text-amber-700" />
              <span>Âm thanh định kỳ</span>
            </div>
            <div className="flex gap-1">
              {[
                { label: 'Tắt', val: 0 },
                { label: '15 phút', val: 15 },
                { label: '30 phút', val: 30 }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setMindfulBellInterval(opt.val)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${mindfulBellInterval === opt.val
                    ? 'bg-amber-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
