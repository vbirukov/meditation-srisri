import { useCallback, useEffect, useState } from 'react';
import { useT } from '@/i18n';
import {
  cacheUrlsForOffline,
  getOfflineDownloadBundleUrls,
  isUrlCached,
} from '@/utils/offlineMedia';
import './OfflineDownloadPanel.css';

interface OfflineDownloadPanelProps {
  onCached?: () => void;
}

export function OfflineDownloadPanel({ onCached }: OfflineDownloadPanelProps) {
  const t = useT();
  const bundle = getOfflineDownloadBundleUrls();
  const [ready, setReady] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: bundle.length });
  const [failed, setFailed] = useState<string[]>([]);

  const checkReady = useCallback(async () => {
    if (bundle.length === 0) {
      setReady(true);
      return;
    }
    const checks = await Promise.all(bundle.map(isUrlCached));
    setReady(checks.every(Boolean));
  }, [bundle]);

  useEffect(() => {
    void checkReady();
  }, [checkReady]);

  const download = async () => {
    setDownloading(true);
    setFailed([]);
    const result = await cacheUrlsForOffline(bundle, setProgress);
    setDownloading(false);
    if (result.failed.length > 0) setFailed(result.failed);
    await checkReady();
    onCached?.();
  };

  if (ready === null) return null;

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 100;

  return (
    <section className="offline-download glass-panel" aria-labelledby="offline-download-title">
      <h2 id="offline-download-title" className="offline-download__title">
        {t('offline.title')}
      </h2>
      <p className="offline-download__text text-muted">
        {ready ? t('offline.ready') : t('offline.hint')}
      </p>
      {!ready && (
        <>
          {downloading && (
            <div className="offline-download__progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="offline-download__bar" style={{ width: `${pct}%` }} />
              <span className="offline-download__pct">{pct}%</span>
            </div>
          )}
          <button
            type="button"
            className="btn-primary offline-download__btn"
            disabled={downloading}
            onClick={() => void download()}
          >
            {downloading ? t('offline.downloading') : t('offline.download')}
          </button>
        </>
      )}
      {failed.length > 0 && (
        <p className="offline-download__failed" role="alert">
          {t('offline.failed').replace('{count}', String(failed.length))}
        </p>
      )}
    </section>
  );
}
