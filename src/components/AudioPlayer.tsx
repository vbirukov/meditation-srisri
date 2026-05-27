import { useCallback, useEffect, useRef, useState } from 'react';
import { textureStyle, withTexture } from '@/utils/textures';
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
  textureUrl?: string;
}

export function AudioPlayer({
  src,
  durationSeconds,
  onComplete,
  onProgress,
  hidden,
  loop = false,
  autoPlay = true,
  textureUrl,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(1);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => setError(true));
    } else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  const seek = useCallback((delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || durationSeconds, a.currentTime + delta));
  }, [durationSeconds]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => {
      setCurrent(a.currentTime);
      onProgress?.(a.currentTime);
    };
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration);
      }
    };
    const onEnd = () => {
      setPlaying(false);
      onComplete?.();
    };
    const onErr = () => setError(true);

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr);

    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onErr);
    };
  }, [onComplete, onProgress]);

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
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, [src, error, autoPlay]);

  if (hidden) {
    return <audio ref={audioRef} src={src} preload="auto" loop={loop} className="sr-only" />;
  }

  return (
    <div
      className={withTexture(
        `audio-player glass-panel${error ? ' audio-player--error' : ''}`,
        textureUrl,
        'textured-surface--session-panel',
      )}
      style={textureStyle(textureUrl)}
    >
      <audio ref={audioRef} src={src} preload="auto" loop={loop} />
      {error ? (
        <p className="audio-player__error" role="status">
          Audio unavailable
        </p>
      ) : (
        <>
          <div className="audio-player__times">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="audio-player__controls">
            <button type="button" className="btn-icon" onClick={() => seek(-15)} aria-label="Back 15s">
              −15
            </button>
            <button type="button" className="btn-primary audio-player__play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
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
