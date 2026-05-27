import { useCallback, useEffect, useRef, useState } from 'react';
import { textureStyle, withTexture } from '@/utils/textures';
import { formatTime, wallClockProgress } from '@/utils/time';
import '@/styles/textured-surface.css';
import './Timer.css';

const PRESETS = [5, 10, 20, 40];

interface TimerProps {
  targetSeconds: number;
  onTargetChange: (seconds: number) => void;
  onComplete: () => void;
  running: boolean;
  onRunningChange: (running: boolean) => void;
  setupMode?: boolean;
  textureUrl?: string;
  labels: {
    presets: string;
    custom: string;
    start: string;
    pause: string;
    resume: string;
    restart: string;
    remaining: string;
    elapsed: string;
  };
}

export function Timer({
  targetSeconds,
  onTargetChange,
  onComplete,
  running,
  onRunningChange,
  setupMode = false,
  textureUrl,
  labels,
}: TimerProps) {
  const [customMin, setCustomMin] = useState(String(Math.round(targetSeconds / 60)));
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const pausedProgressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const bellRef = useRef<HTMLAudioElement>(null);

  const remaining = Math.max(0, targetSeconds - progress);
  const pct = targetSeconds > 0 ? Math.min(1, progress / targetSeconds) : 0;

  const resetClock = useCallback(() => {
    startedAtRef.current = null;
    pausedAtRef.current = null;
    pausedProgressRef.current = 0;
    setProgress(0);
    completedRef.current = false;
  }, []);

  const start = useCallback(() => {
    resetClock();
    startedAtRef.current = Date.now();
    onRunningChange(true);
  }, [onRunningChange, resetClock]);

  const pause = useCallback(() => {
    if (!startedAtRef.current || pausedAtRef.current) return;
    const p = wallClockProgress(startedAtRef.current, null, 0);
    pausedProgressRef.current = p;
    pausedAtRef.current = Date.now();
    setProgress(p);
    onRunningChange(false);
  }, [onRunningChange]);

  const resume = useCallback(() => {
    if (!pausedAtRef.current) return;
    const pauseDur = Date.now() - pausedAtRef.current;
    startedAtRef.current = (startedAtRef.current ?? Date.now()) + pauseDur;
    pausedAtRef.current = null;
    onRunningChange(true);
  }, [onRunningChange]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const p = wallClockProgress(
        startedAtRef.current,
        pausedAtRef.current,
        pausedProgressRef.current,
      );
      setProgress(p);
      if (p >= targetSeconds && !completedRef.current) {
        completedRef.current = true;
        onRunningChange(false);
        bellRef.current?.play().catch(() => {});
        onComplete();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, targetSeconds, onComplete, onRunningChange]);

  const applyPreset = (min: number) => {
    onTargetChange(min * 60);
    setCustomMin(String(min));
    resetClock();
    onRunningChange(false);
  };

  const applyCustom = () => {
    const min = Math.max(1, Math.min(180, Number(customMin) || 10));
    onTargetChange(min * 60);
    setCustomMin(String(min));
    resetClock();
    onRunningChange(false);
  };

  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference * (1 - pct);

  if (setupMode) {
    return (
      <div className="timer-setup glass-panel">
        <p className="section-title">{labels.presets}</p>
        <div className="timer-presets">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              className={`timer-preset ${targetSeconds === m * 60 ? 'timer-preset--active' : ''}`}
              onClick={() => applyPreset(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <label className="timer-custom">
          <span>{labels.custom}</span>
          <input
            type="number"
            min={1}
            max={180}
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onBlur={applyCustom}
          />
        </label>
        <button type="button" className="btn-primary timer-start-btn" onClick={start}>
          {labels.start}
        </button>
      </div>
    );
  }

  return (
    <div className="timer-active">
      <audio ref={bellRef} src="/media/audio/bell.wav" preload="auto" />
      <div className="timer-ring-wrap glass-panel" aria-live="polite">
        <svg className="timer-ring" viewBox="0 0 200 200" role="img" aria-label={`${labels.remaining}: ${formatTime(remaining)}`}>
          <circle className="timer-ring__track" cx="100" cy="100" r="88" />
          <circle
            className="timer-ring__progress"
            cx="100"
            cy="100"
            r="88"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>
        <div
          className={withTexture(
            'timer-ring__label',
            textureUrl,
            'textured-surface--session-panel',
            'textured-surface--session-panel--round',
          )}
          style={textureStyle(textureUrl)}
        >
          <span className="timer-ring__main">{formatTime(remaining)}</span>
          <span className="timer-ring__sub">{labels.remaining}</span>
        </div>
      </div>
      <p
        className={withTexture(
          'text-muted timer-elapsed glass-panel',
          textureUrl,
          'textured-surface--session-panel',
        )}
        style={textureStyle(textureUrl)}
      >
        <span className="timer-elapsed__text">
          {labels.elapsed}: {formatTime(progress)}
        </span>
      </p>
      <div className="timer-active__controls">
        {running ? (
          <button type="button" className="btn-secondary" onClick={pause}>
            {labels.pause}
          </button>
        ) : progress > 0 && progress < targetSeconds ? (
          <button type="button" className="btn-primary" onClick={resume}>
            {labels.resume}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={start}>
            {labels.start}
          </button>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            resetClock();
            onRunningChange(false);
          }}
        >
          {labels.restart}
        </button>
      </div>
    </div>
  );
}
