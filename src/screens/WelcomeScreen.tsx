import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/analytics/track';
import { VideoBackground } from '@/components/VideoBackground';
import { Header } from '@/components/Header';
import { useT } from '@/i18n';
import { useVkUserStore } from '@/store/vkUserStore';
import { getTexturePool, pickRandomFromUrls, textureStyle, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './WelcomeScreen.css';

const GREETING_TEXTURE_NAMES = ['end-stats', 'end-stats1'];

function pickWelcomeGreetingTexture(): string | undefined {
  const pool = getTexturePool('end-stats').filter((url) =>
    GREETING_TEXTURE_NAMES.some((name) => {
      const base = url.split('/').pop() ?? '';
      return base.replace(/\.[^.]+$/, '') === name;
    }),
  );
  return pickRandomFromUrls(pool);
}

export function WelcomeScreen() {
  const navigate = useNavigate();
  const t = useT();
  const greetingTexture = useMemo(() => pickWelcomeGreetingTexture(), []);
  const user = useVkUserStore((s) => s.user);

  const greeting = user?.firstName
    ? t('welcome.greetingNamed').replace('{name}', user.firstName)
    : t('welcome.greeting');

  return (
    <div className="screen screen--immersive welcome-screen">
      <VideoBackground scene="welcome" overlay={0.5} variant="welcome" />
      <Header transparent />
      <div className="welcome-screen__body fade-in">
        <div className="welcome-screen__card glass-bar">
          {user?.photoUrl && (
            <img
              className="welcome-screen__avatar"
              src={user.photoUrl}
              alt=""
              width={56}
              height={56}
              decoding="async"
            />
          )}
          <h1
            className={withTexture(
              'heading-serif welcome-screen__greeting',
              greetingTexture,
              'textured-surface--welcome-greeting',
            )}
            style={textureStyle(greetingTexture)}
          >
            <span className="welcome-screen__greeting-text">{greeting}</span>
          </h1>
          <button
            type="button"
            className="btn-terracotta btn-terracotta--lg welcome-screen__cta"
            onClick={() => {
              track('welcome_cta');
              navigate('/practice');
            }}
          >
            {t('welcome.cta')}
          </button>
          <p className="welcome-screen__disclaimer text-muted">{t('welcome.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
