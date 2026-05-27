import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoBackground } from '@/components/VideoBackground';
import { Header } from '@/components/Header';
import { useT } from '@/i18n';
import { getTexturePool, pickRandomFromUrls, textureStyle, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './WelcomeScreen.css';

const GREETING_TEXTURE_NAMES = ['end-stats.png', 'end-stats1.png'];

function pickWelcomeGreetingTexture(): string | undefined {
  const pool = getTexturePool('end-stats').filter((url) =>
    GREETING_TEXTURE_NAMES.some((name) => url.endsWith(`/${name}`)),
  );
  return pickRandomFromUrls(pool);
}

export function WelcomeScreen() {
  const navigate = useNavigate();
  const t = useT();
  const greetingTexture = useMemo(() => pickWelcomeGreetingTexture(), []);

  return (
    <div className="screen screen--immersive welcome-screen">
      <VideoBackground scene="welcome" overlay={0.5} variant="welcome" />
      <Header transparent />
      <div className="welcome-screen__body fade-in">
        <div className="welcome-screen__card glass-bar">
          <h1
            className={withTexture(
              'heading-serif welcome-screen__greeting',
              greetingTexture,
              'textured-surface--welcome-greeting',
            )}
            style={textureStyle(greetingTexture)}
          >
            <span className="welcome-screen__greeting-text">{t('welcome.greeting')}</span>
          </h1>
          <button
            type="button"
            className="btn-terracotta btn-terracotta--lg welcome-screen__cta"
            onClick={() => navigate('/practice')}
          >
            {t('welcome.cta')}
          </button>
        </div>
      </div>
    </div>
  );
}
