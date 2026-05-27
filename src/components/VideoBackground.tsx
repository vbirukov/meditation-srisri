import { useEffect, useMemo, useRef, useState } from 'react';
import posterManifest from '@/data/poster-manifest.json';
import type { VideoScene } from '@/types';
import { shouldUseStaticBackground } from '@/utils/connection';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import './VideoBackground.css';

const SCENE_POSTERS = posterManifest as Record<VideoScene, string[]>;

type SceneVideoSources = { webm?: string; mp4?: string | string[] };

const SCENE_VIDEOS: Record<VideoScene, SceneVideoSources> = {
  welcome: { mp4: '/media/video/welcome.mp4' },
  picker: { mp4: ['/media/video/picker.mp4', '/media/video/picker2.mp4'] },
  session: { mp4: ['/media/video/session.mp4', '/media/video/session2.mp4'] },
};

function pickOne(item: string | string[] | undefined): string | undefined {
  if (!item) return undefined;
  if (typeof item === 'string') return item;
  if (item.length === 0) return undefined;
  return item[Math.floor(Math.random() * item.length)];
}

const pickMp4 = pickOne;

type OverlayVariant = 'dark' | 'soft' | 'welcome';

interface VideoBackgroundProps {
  scene: VideoScene;
  overlay?: number;
  blur?: number;
  variant?: OverlayVariant;
  className?: string;
}

export function VideoBackground({
  scene,
  overlay = 0.45,
  blur = 0,
  variant = 'dark',
  className = '',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [useVideo, setUseVideo] = useState(false);
  const sources = SCENE_VIDEOS[scene];
  const poster = useMemo(() => pickOne(SCENE_POSTERS[scene]), [scene]);
  const mp4Src = useMemo(() => pickMp4(sources.mp4), [scene]);

  useEffect(() => {
    const preferStatic = reducedMotion || shouldUseStaticBackground() || !mp4Src;
    setUseVideo(!preferStatic);
  }, [reducedMotion, mp4Src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !useVideo) return;
    v.play().catch(() => setUseVideo(false));
  }, [useVideo, mp4Src]);

  return (
    <div
      className={`video-bg video-bg--${variant} ${className}`.trim()}
      style={
        {
          '--overlay': overlay,
          '--blur': `${blur}px`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      {poster && (
        <div
          className="video-bg__poster"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}
      {useVideo && mp4Src && (
        <video
          key={mp4Src}
          ref={videoRef}
          className="video-bg__video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
        >
          {sources.webm && <source src={sources.webm} type="video/webm" />}
          <source src={mp4Src} type="video/mp4" />
        </video>
      )}
      <div className="video-bg__overlay" />
    </div>
  );
}
