import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n';
import { useOnboardingStore } from '@/store/onboardingStore';
import { usePracticeStatsStore } from '@/store/practiceStatsStore';
import { useRecentPracticeStore } from '@/store/recentPracticeStore';
import './SplashScreen.css';

function waitHydration(stores: Array<{ persist: { hasHydrated: () => boolean; onFinishHydration: (cb: () => void) => () => void } }>) {
  return Promise.all(
    stores.map(
      (store) =>
        new Promise<void>((resolve) => {
          if (store.persist.hasHydrated()) {
            resolve();
            return;
          }
          const unsub = store.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        }),
    ),
  );
}

function resolveDestination(): string {
  const lastSession = usePracticeStatsStore.getState().lastSession;
  const recent = useRecentPracticeStore.getState();
  const onboardingDone = useOnboardingStore.getState().completed;
  const hasHistory =
    Boolean(lastSession) ||
    Boolean(recent.lastMeditationId) ||
    Boolean(recent.lastSadhanaId) ||
    Boolean(recent.lastCustomPracticeId);

  if (hasHistory) {
    if (!onboardingDone) useOnboardingStore.getState().complete();
    const tab = recent.lastTab === 'sadhana' ? 'sadhana' : 'meditations';
    return `/practice?tab=${tab}&focus=continue`;
  }
  if (!onboardingDone) return '/onboarding';
  return '/welcome';
}

export function SplashScreen() {
  const navigate = useNavigate();
  const t = useT();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    void waitHydration([
      usePracticeStatsStore,
      useRecentPracticeStore,
      useOnboardingStore,
    ]).then(() => {
      if (cancelled) return;
      setBooting(false);
      const dest = resolveDestination();
      const delay = dest.includes('focus=continue') ? 700 : 1100;
      timer = window.setTimeout(() => navigate(dest, { replace: true }), delay);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="splash-screen fade-in" role="status" aria-live="polite">
      <div className="splash-screen__logo" aria-hidden>
        ॐ
      </div>
      <h1 className="splash-screen__title heading-display">{t('appName')}</h1>
      <p className="splash-screen__tagline">
        {booting ? t('splash') : t('splashReady')}
      </p>
    </div>
  );
}
