import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useT } from '@/i18n';
import './InstallPrompt.css';

export function InstallPrompt() {
  const t = useT();
  const { showInstallBanner, showIOSHint, canInstall, install, dismiss } = usePwaInstall();

  if (!showInstallBanner) return null;

  return (
    <div className="install-prompt" role="region" aria-label={t('pwa.installTitle')}>
      <div className="install-prompt__body">
        <p className="install-prompt__title">{t('pwa.installTitle')}</p>
        <p className="install-prompt__text">
          {showIOSHint ? t('pwa.installIos') : t('pwa.installHint')}
        </p>
        <div className="install-prompt__actions">
          {canInstall && (
            <button type="button" className="btn-primary" onClick={() => void install()}>
              {t('pwa.installAction')}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={dismiss}>
            {t('pwa.installLater')}
          </button>
        </div>
      </div>
    </div>
  );
}
