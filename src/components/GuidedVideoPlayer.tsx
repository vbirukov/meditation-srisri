import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n';
import { acquireScreenWakeLock } from '@/hooks/useWakeLock';
import { encodeMediaUrl } from '@/utils/mediaUrl';
import { textureStyle, withTexture } from '@/utils/textures';
import { formatTime } from '@/utils/time';
import '@/styles/textured-surface.css';
import './GuidedVideoPlayer.css';

interface GuidedVideoPlayerProps {
  src: string;
  durationSeconds: number;
  onComplete?: () => void;
  onProgress?: (seconds: number) => void;
  onStart?: () => void;
  hidden?: boolean;
  autoPlay?: boolean;
  initialTime?: number;
  textureUrl?: string;
}

function pauseBackgroundVideos() {
  document.querySelectorAll<HTMLVideoElement>('.video-bg__video').forEach((v) => {
    v.pause();
  });
}

export function GuidedVideoPlayer({
  src,
  durationSeconds,
  onComplete,
  onProgress,
  onStart,
  hidden = false,
  autoPlay = true,
  initialTime = 0,
  textureUrl,
}: GuidedVideoPlayerProps) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const initialSeekDoneRef = useRef(false);
  const lastUiSecondRef = useRef(-1);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  const onStartRef = useRef(onStart);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(initialTime);
  const [duration, setDuration] = useState(durationSeconds);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const encodedSrc = encodeMediaUrl(src);

  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;
  onStartRef.current = onStart;

  const markStarted = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void acquireScreenWakeLock();
    onStartRef.current?.();
  }, []);

  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    pauseBackgroundVideos();
    void v
      .play()
      .then(() => {
        setPlaying(true);
        setLoading(false);
        markStarted();
      })
      .catch(() => setError(true));
  }, [markStarted]);

  const pause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) play();
    else pause();
  }, [pause, play]);

  const seek = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(v.duration || durationSeconds, v.currentTime + delta));
    },
    [durationSeconds],
  );

  useEffect(() => {
    pauseBackgroundVideos();
    initialSeekDoneRef.current = false;
    lastUiSecondRef.current = -1;
    startedRef.current = false;
    setLoading(true);
    setError(false);
  }, [encodedSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => {
      const t = v.currentTime;
      const sec = Math.floor(t);
      if (sec === lastUiSecondRef.current) return;
      lastUiSecondRef.current = sec;
      setCurrent(t);
      onProgressRef.current?.(t);
    };
    const onMeta = () => {
      setLoading(false);
      if (Number.isFinite(v.duration) && v.duration > 0) {
        setDuration(v.duration);
      }
      if (!initialSeekDoneRef.current && initialTime > 0) {
        initialSeekDoneRef.current = true;
        v.currentTime = initialTime;
        setCurrent(initialTime);
        lastUiSecondRef.current = Math.floor(initialTime);
      }
    };
    const onPlay = () => {
      setPlaying(true);
      setLoading(false);
      markStarted();
    };
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      onCompleteRef.current?.();
    };
    const onErr = () => {
      setLoading(false);
      setError(true);
    };

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnd);
    v.addEventListener('error', onErr);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnd);
      v.removeEventListener('error', onErr);
    };
  }, [encodedSrc, initialTime, markStarted]);

  useEffect(() => {
    if (!autoPlay || error) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => play();
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('canplay', tryPlay, { once: true });
    return () => v.removeEventListener('canplay', tryPlay);
  }, [autoPlay, encodedSrc, error, play]);

  const panelClass = hidden
    ? `guided-video guided-video--hidden${error ? ' guided-video--error' : ''}`
    : withTexture(
        `guided-video glass-panel${error ? ' guided-video--error' : ''}`,
        textureUrl,
        'textured-surface--session-panel',
      );

  return (
    <div className={panelClass} style={hidden ? undefined : textureStyle(textureUrl)}>
      <div className={`guided-video__screen${hidden ? ' guided-video__screen--hidden' : ''}`}>
        <video
          ref={videoRef}
          className="guided-video__element"
          src={encodedSrc}
          preload="auto"
          playsInline
          onClick={hidden ? undefined : toggle}
        />
        {loading && !error && !hidden && (
          <div className="guided-video__loading" aria-live="polite">
            …
          </div>
        )}
      </div>

      {!hidden && error && (
        <p className="guided-video__error" role="status">
          {t('session.offlineFallback')}
        </p>
      )}

      {!hidden && !error && (
        <>
          <div className="guided-video__times">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="guided-video__controls">
            <button type="button" className="btn-icon" onClick={() => seek(-15)} aria-label="Back 15s">
              −15
            </button>
            <button
              type="button"
              className="btn-primary guided-video__play"
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <button type="button" className="btn-icon" onClick={() => seek(15)} aria-label="Forward 15s">
              +15
            </button>
          </div>
        </>
      )}
    </div>
  );
}
