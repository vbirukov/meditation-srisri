import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatTime, wallClockProgress } from '@/utils/time';
import { formatPhaseDuration } from '@/utils/sadhana';
import './SadhanaPhaseTimer.css';

type Phase = {
  id: string;
  label: string;
  durationSeconds?: number;
  audioUrl?: string;
  startingAudioUrl?: string;
  finishingAudioUrl?: string;
};

interface SadhanaPhaseTimerProps {
  phases: Phase[];
  onComplete: () => void;
  running: boolean;
  onRunningChange: (running: boolean) => void;
  setupMode?: boolean;
  onTotalDurationChange?: (totalSeconds: number) => void;
  labels: {
    phases: string;
    total: string;
    start: string;
    pause: string;
    resume: string;
    restart: string;
    remaining: string;
    phaseOf: string;
  };
}

const durationCache = new Map<string, Promise<number>>();

function loadAudioDurationSeconds(url: string): Promise<number> {
  const cached = durationCache.get(url);
  if (cached) return cached;

  const p = new Promise<number>((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.src = url;
    const cleanup = () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('error', onErr);
    };
    const onMeta = () => {
      cleanup();
      const d = Number(a.duration);
      resolve(Number.isFinite(d) && d > 0 ? Math.ceil(d) : 0);
    };
    const onErr = () => {
      cleanup();
      resolve(0);
    };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('error', onErr);
  });

  durationCache.set(url, p);
  return p;
}

export function SadhanaPhaseTimer({
  phases,
  onComplete,
  running,
  onRunningChange,
  setupMode = false,
  onTotalDurationChange,
  labels,
}: SadhanaPhaseTimerProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const pausedProgressRef = useRef(0);
  const completedRef = useRef(false);
  const startingAudioRef = useRef<HTMLAudioElement>(null);
  const phaseAudioRef = useRef<HTMLAudioElement>(null);
  const finishingAudioRef = useRef<HTMLAudioElement>(null);
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const [phaseOverlay, setPhaseOverlay] = useState<'starting' | 'finishing' | null>(null);
  const phaseRunIdRef = useRef(0);

  const overlayActive = phaseOverlay !== null;

  const currentPhase = phases[phaseIndex];
  const currentAudioDuration = currentPhase?.audioUrl ? audioDurations[currentPhase.audioUrl] : undefined;
  const targetSeconds =
    typeof currentPhase?.durationSeconds === 'number'
      ? currentPhase.durationSeconds
      : typeof currentAudioDuration === 'number' && currentAudioDuration > 0
        ? currentAudioDuration
        : null;

  const remaining = targetSeconds == null ? 0 : Math.max(0, targetSeconds - progress);
  const pct = targetSeconds && targetSeconds > 0 ? Math.min(1, progress / targetSeconds) : 0;
  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference * (1 - pct);

  const totalSeconds = useMemo(() => {
    let sum = 0;
    for (const p of phases) {
      if (typeof p.durationSeconds === 'number' && Number.isFinite(p.durationSeconds)) {
        sum += p.durationSeconds;
      } else if (p.audioUrl) {
        const d = audioDurations[p.audioUrl];
        if (typeof d === 'number' && d > 0) sum += d;
      }
    }
    return sum;
  }, [audioDurations, phases]);

  useEffect(() => {
    onTotalDurationChange?.(totalSeconds);
  }, [onTotalDurationChange, totalSeconds]);

  // Prefetch audio durations for phases missing durationSeconds.
  useEffect(() => {
    let cancelled = false;
    const urls = phases
      .map((p) => (p.audioUrl && typeof p.durationSeconds !== 'number' ? p.audioUrl : null))
      .filter((u): u is string => Boolean(u));
    if (urls.length === 0) return;

    (async () => {
      const updates: Record<string, number> = {};
      await Promise.all(
        urls.map(async (url) => {
          if (audioDurations[url] != null) return;
          updates[url] = await loadAudioDurationSeconds(url);
        }),
      );
      if (cancelled) return;
      if (Object.keys(updates).length > 0) {
        setAudioDurations((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases]);

  const resetAll = useCallback(() => {
    setPhaseIndex(0);
    setProgress(0);
    startedAtRef.current = null;
    pausedAtRef.current = null;
    pausedProgressRef.current = 0;
    completedRef.current = false;
    setPhaseOverlay(null);
  }, []);

  const playOneShot = useCallback(async (el: HTMLAudioElement | null, url: string): Promise<void> => {
    if (!el) return;
    el.src = url;
    el.currentTime = 0;
    try {
      await el.play();
    } catch {
      return;
    }
    await new Promise<void>((resolve) => {
      const done = () => {
        el.removeEventListener('ended', done);
        el.removeEventListener('error', done);
        resolve();
      };
      el.addEventListener('ended', done);
      el.addEventListener('error', done);
    });
  }, []);

  const start = useCallback(() => {
    resetAll();
    startedAtRef.current = Date.now();
    onRunningChange(true);
  }, [onRunningChange, resetAll]);

  const pause = useCallback(() => {
    startingAudioRef.current?.pause();
    phaseAudioRef.current?.pause();
    if (!startedAtRef.current || pausedAtRef.current) return;
    pausedProgressRef.current = wallClockProgress(startedAtRef.current, null, 0);
    pausedAtRef.current = Date.now();
    setProgress(pausedProgressRef.current);
    onRunningChange(false);
  }, [onRunningChange]);

  const resume = useCallback(() => {
    if (!pausedAtRef.current) return;
    const pauseDur = Date.now() - pausedAtRef.current;
    startedAtRef.current = (startedAtRef.current ?? Date.now()) + pauseDur;
    pausedAtRef.current = null;
    onRunningChange(true);
  }, [onRunningChange]);

  const advancePhase = useCallback(() => {
    if (phaseIndex >= phases.length - 1) {
      completedRef.current = true;
      onRunningChange(false);
      onComplete();
      return;
    }
    setPhaseIndex((i) => i + 1);
    setProgress(0);
    startedAtRef.current = null;
    pausedAtRef.current = null;
    pausedProgressRef.current = 0;
    setPhaseOverlay(null);
  }, [phaseIndex, phases.length, onComplete, onRunningChange]);

  const playFinishing = useCallback(async (): Promise<void> => {
    const url = currentPhase?.finishingAudioUrl;
    if (!url) return;
    setPhaseOverlay('finishing');
    phaseAudioRef.current?.pause();
    await playOneShot(finishingAudioRef.current, url);
    setPhaseOverlay(null);
  }, [currentPhase?.finishingAudioUrl, playOneShot]);

  // Старт фазы: startingAudioUrl → основной трек + таймер.
  useEffect(() => {
    if (!running || !currentPhase || setupMode) return;

    const runId = ++phaseRunIdRef.current;

    (async () => {
      startingAudioRef.current?.pause();
      phaseAudioRef.current?.pause();
      startedAtRef.current = null;

      if (currentPhase.startingAudioUrl) {
        setPhaseOverlay('starting');
        await playOneShot(startingAudioRef.current, currentPhase.startingAudioUrl);
        if (phaseRunIdRef.current !== runId) return;
        setPhaseOverlay(null);
      }

      if (!running || phaseRunIdRef.current !== runId) return;

      startedAtRef.current = Date.now();
      pausedAtRef.current = null;
      pausedProgressRef.current = 0;

      const main = phaseAudioRef.current;
      if (currentPhase.audioUrl && main) {
        main.src = currentPhase.audioUrl;
        main.currentTime = 0;
        main.play().catch(() => {});
      }
    })();

    return () => {
      phaseRunIdRef.current += 1;
    };
  }, [currentPhase, phaseIndex, playOneShot, running, setupMode]);

  useEffect(() => {
    const a = phaseAudioRef.current;
    if (!a) return;
    if (!running || overlayActive) {
      a.pause();
      return;
    }
    if (currentPhase?.audioUrl && startedAtRef.current) {
      a.play().catch(() => {});
    }
  }, [currentPhase?.audioUrl, overlayActive, running]);

  useEffect(() => {
    if (!running || !currentPhase) return;
    if (overlayActive) return;
    if (targetSeconds == null) return;
    if (!startedAtRef.current) return;
    const id = window.setInterval(() => {
      const p = wallClockProgress(
        startedAtRef.current,
        pausedAtRef.current,
        pausedProgressRef.current,
      );
      setProgress(p);
      if (p >= targetSeconds && !completedRef.current) {
        completedRef.current = true;
        (async () => {
          if (currentPhase.finishingAudioUrl) {
            await playFinishing();
          }
          advancePhase();
        })();
      }
    }, 250);
    return () => clearInterval(id);
  }, [advancePhase, currentPhase, overlayActive, playFinishing, running, targetSeconds]);

  if (setupMode) {
    const total = phases.reduce((s, p) => s + (p.durationSeconds ?? 0), 0);
    return (
      <div className="sadhana-timer-setup glass-panel">
        <p className="section-title">{labels.phases}</p>
        <ol className="sadhana-timer-setup__list">
          {phases.map((phase, i) => (
            <li key={phase.id}>
              <span className="sadhana-timer-setup__num">{i + 1}</span>
              <span className="sadhana-timer-setup__label">{phase.label}</span>
              <span className="sadhana-timer-setup__dur">
                {typeof phase.durationSeconds === 'number'
                  ? formatPhaseDuration(phase.durationSeconds)
                  : phase.audioUrl
                    ? formatPhaseDuration(audioDurations[phase.audioUrl] ?? 0)
                    : '—'}
              </span>
            </li>
          ))}
        </ol>
        <p className="sadhana-timer-setup__total text-muted">
          {labels.total}: {formatPhaseDuration(totalSeconds || total)}
        </p>
        <button type="button" className="btn-primary timer-start-btn" onClick={start}>
          {labels.start}
        </button>
      </div>
    );
  }

  if (!currentPhase) return null;

  return (
    <div className="sadhana-timer-active">
      <audio ref={startingAudioRef} preload="auto" />
      <audio ref={phaseAudioRef} preload="auto" />
      <audio ref={finishingAudioRef} preload="auto" />
      <p className="sadhana-timer-active__phase-meta">
        {labels.phaseOf.replace('{current}', String(phaseIndex + 1)).replace('{total}', String(phases.length))}
      </p>
      <p className="sadhana-timer-active__phase-name">{currentPhase.label}</p>
      <div className="timer-ring-wrap" aria-live="polite">
        <svg className="timer-ring" viewBox="0 0 200 200" role="img">
          <circle className="timer-ring__track" cx="100" cy="100" r="88" />
          <circle
            className="timer-ring__progress"
            cx="100"
            cy="100"
            r="88"
            style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="timer-ring__label">
          <span className="timer-ring__main">{targetSeconds == null ? '…' : formatTime(remaining)}</span>
          <span className="timer-ring__sub">{labels.remaining}</span>
        </div>
      </div>
      <ul className="sadhana-timer-active__steps">
        {phases.map((phase, i) => (
          <li
            key={phase.id}
            className={
              i === phaseIndex
                ? 'sadhana-timer-active__step--current'
                : i < phaseIndex
                  ? 'sadhana-timer-active__step--done'
                  : ''
            }
          >
            {phase.label}
          </li>
        ))}
      </ul>
      <div className="timer-active__controls">
        {running ? (
          <button type="button" className="btn-secondary" onClick={pause}>
            {labels.pause}
          </button>
        ) : progress > 0 && phaseIndex < phases.length ? (
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
            resetAll();
            onRunningChange(false);
          }}
        >
          {labels.restart}
        </button>
      </div>
    </div>
  );
}
