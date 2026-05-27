import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n';
import './SplashScreen.css';

export function SplashScreen() {
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    const id = window.setTimeout(() => navigate('/welcome', { replace: true }), 1400);
    return () => clearTimeout(id);
  }, [navigate]);

  return (
    <div className="splash-screen fade-in" role="status" aria-live="polite">
      <div className="splash-screen__logo" aria-hidden>
        ॐ
      </div>
      <h1 className="splash-screen__title heading-serif">{t('appName')}</h1>
      <p className="splash-screen__tagline">{t('splash')}</p>
    </div>
  );
}
