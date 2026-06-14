import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n';
import { textureStyle, withTexture } from '@/utils/textures';
import { acquireScreenWakeLock } from '@/hooks/useWakeLock';
import { formatTime } from '@/utils/time';
import '@/styles/textured-surface.css';
import './AudioPlayer.css';

interface AudioPlayerProps {
  src: string;
  durationSeconds: number;
  onComplete?: () => void;
  onProgress?: (seconds: number) => void;
  hidden?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  initialTime?: number;
  textureUrl?: string;
}

export function AudioPlayer({
  src,
  durationSeconds,
  onComplete,
  onProgress,
  hidden = false,
  loop = false,
  autoPlay = true,
  initialTime = 0,
  textureUrl,
}: AudioPlayerProps) {
  const t = useT();
  const audioRef = useRef<HTMLAudioElement>(null);
  const initialSeekDoneRef = useRef(false);
  const lastUiSecondRef = useRef(-1);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(initialTime);
  const [duration, setDuration] = useState(durationSeconds);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(1);

  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void acquireScreenWakeLock();
      a.play().then(() => setPlaying(true)).catch(() => setError(true));
    } else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  const seek = useCallback(
    (delta: number) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.max(0, Math.min(a.duration || durationSeconds, a.currentTime + delta));
    },
    [durationSeconds],
  );

  useEffect(() => {
    initialSeekDoneRef.current = false;
    lastUiSecondRef.current = -1;
    setError(false);
  }, [src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => {
      const t = a.currentTime;
      const sec = Math.floor(t);
      if (sec === lastUiSecondRef.current) return;
      lastUiSecondRef.current = sec;
      setCurrent(t);
      onProgressRef.current?.(t);
    };
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration);
      }
      if (!initialSeekDoneRef.current && initialTime > 0) {
        initialSeekDoneRef.current = true;
        a.currentTime = initialTime;
        setCurrent(initialTime);
        lastUiSecondRef.current = Math.floor(initialTime);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      onCompleteRef.current?.();
    };
    const onErr = () => setError(true);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);

    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onErr);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, [src, initialTime]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = volume;
      a.loop = loop;
    }
  }, [volume, loop, src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || error || !autoPlay) return;
    void acquireScreenWakeLock();
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, [src, error, autoPlay]);

  const panelClass = hidden
    ? `audio-player audio-player--hidden${error ? ' audio-player--error' : ''}`
    : withTexture(
        `audio-player glass-panel${error ? ' audio-player--error' : ''}`,
        textureUrl,
        'textured-surface--session-panel',
      );

  return (
    <div className={panelClass} style={hidden ? undefined : textureStyle(textureUrl)}>
      <audio ref={audioRef} src={src} preload="auto" loop={loop} className="sr-only" />

      {!hidden && error && (
        <p className="audio-player__error" role="status">
          {t('session.offlineFallback')}
        </p>
      )}

      {!hidden && !error && (
        <>
          <div className="audio-player__times">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="audio-player__controls">
            <button type="button" className="btn-icon" onClick={() => seek(-15)} aria-label="Back 15s">
              −15
            </button>
            <button
              type="button"
              className="btn-primary audio-player__play"
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <button type="button" className="btn-icon" onClick={() => seek(15)} aria-label="Forward 15s">
              +15
            </button>
          </div>
          <label className="audio-player__volume">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        </>
      )}
    </div>
  );
}
