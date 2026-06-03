import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';
import type { Meditation, PracticeTab, SadhanaCatalog, SadhanaPractice } from '@/types';
import { VideoBackground } from '@/components/VideoBackground';
import { Header } from '@/components/Header';
import { MeditationCard } from '@/components/MeditationCard';
import { SadhanaCard } from '@/components/SadhanaCard';
import { SectionTitle } from '@/components/SectionTitle';
import { PRACTICE_HUB_TEXTURE_POOLS, usePageTextures } from '@/utils/textures';
import { PracticeTabs } from '@/components/PracticeTabs';
import { PracticeTools } from '@/components/PracticeTools';
import { RecentContinueCard } from '@/components/RecentContinueCard';
import { useT } from '@/i18n';
import { OfflineDownloadPanel } from '@/components/OfflineDownloadPanel';
import { useOfflineCatalog } from '@/hooks/useOfflineCatalog';
import { acquireScreenWakeLock } from '@/hooks/useWakeLock';
import { useSessionStore } from '@/store/sessionStore';
import { useCustomTrackStore } from '@/store/customTrackStore';
import { useRecentPracticeStore } from '@/store/recentPracticeStore';
import {
  customPracticeToSadhanaPractice,
  customPracticeTotalSeconds,
  listSavedCustomPractices,
} from '@/utils/customPractice';
import { sadhanaTotalSeconds } from '@/utils/sadhana';
import { useCustomPracticeStore } from '@/store/customPracticeStore';
import { splitRecent } from '@/utils/recentPractice';
import { formatTime } from '@/utils/time';
import '@/components/MeditationCard.css';
import '@/components/SectionTitle.css';
import './PracticeHubScreen.css';

const meditations = meditationsData as Meditation[];
const sadhanaCatalog = sadhanaData as unknown as SadhanaCatalog;
const sadhanas = (sadhanaCatalog.practices ?? []) as SadhanaPractice[];
const sadhanaBlocks = sadhanaCatalog.blocks ?? [];

function parseTab(value: string | null): PracticeTab {
  return value === 'sadhana' ? 'sadhana' : 'meditations';
}

export function PracticeHubScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const t = useT();
  const tab = useMemo(() => parseTab(params.get('tab')), [params]);

  const setMode = useSessionStore((s) => s.setMode);
  const setTargetDuration = useSessionStore((s) => s.setTargetDuration);
  const customTrack = useCustomTrackStore((s) => s.track);
  const lastMeditationId = useRecentPracticeStore((s) => s.lastMeditationId);
  const lastSadhanaId = useRecentPracticeStore((s) => s.lastSadhanaId);
  const lastCustomPracticeId = useRecentPracticeStore((s) => s.lastCustomPracticeId);
  const lastTab = useRecentPracticeStore((s) => s.lastTab);
  const setLastMeditation = useRecentPracticeStore((s) => s.setLastMeditation);
  const setLastSadhana = useRecentPracticeStore((s) => s.setLastSadhana);
  const setLastCustomPractice = useRecentPracticeStore((s) => s.setLastCustomPractice);
  const clearLastCustomPracticeIf = useRecentPracticeStore((s) => s.clearLastCustomPracticeIf);
  const removeCustomPractice = useCustomPracticeStore((s) => s.removePractice);
  const customPractices = useCustomPracticeStore((s) => s.practices);
  const {
    online,
    refresh: refreshOffline,
    isMeditationAvailable,
    isSadhanaAvailable,
    isCustomPracticeAvailable,
  } = useOfflineCatalog(customPractices);
  const offlineLabel = t('offline.notCached');
  const pageTextures = usePageTextures(PRACTICE_HUB_TEXTURE_POOLS);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderEditId, setBuilderEditId] = useState<string | null>(null);

  const handleBuilderOpenChange = useCallback((open: boolean) => {
    setBuilderOpen(open);
    if (open) setBuilderEditId(null);
  }, []);

  const openBuilderForEdit = useCallback((id: string) => {
    setBuilderEditId(id);
    setBuilderOpen(true);
  }, []);

  const deleteCustomPractice = useCallback(
    (id: string) => {
      removeCustomPractice(id);
      clearLastCustomPracticeIf(id);
      if (builderEditId === id) {
        setBuilderEditId(null);
        setBuilderOpen(false);
      }
    },
    [builderEditId, clearLastCustomPracticeIf, removeCustomPractice],
  );

  useEffect(() => {
    if (params.has('tab') || !lastTab) return;
    setParams({ tab: lastTab }, { replace: true });
  }, [lastTab, params, setParams]);

  const setTab = useCallback(
    (next: PracticeTab) => {
      setParams({ tab: next }, { replace: true });
    },
    [setParams],
  );

  const sessionUrl = (setup: boolean) => {
    const q = new URLSearchParams();
    if (setup) q.set('setup', '1');
    q.set('tab', tab);
    return `/session?${q.toString()}`;
  };

  const audio = meditations.filter((m) => m.type === 'audio');
  const video = meditations.filter((m) => m.type === 'video');
  const visible = (list: Meditation[]) =>
    online ? list : list.filter((m) => m.isOfflinePrecached && isMeditationAvailable(m.id));

  const visibleSadhanas = (list: SadhanaPractice[]) =>
    online ? list : list.filter((p) => isSadhanaAvailable(p.id));

  const visibleAudio = visible(audio);
  const visibleVideo = visible(video);
  const audioSplit = splitRecent(visibleAudio, lastMeditationId);
  const videoSplit = splitRecent(visibleVideo, lastMeditationId);
  const recentMeditation =
    audioSplit.recent ?? (videoSplit.recent?.id === lastMeditationId ? videoSplit.recent : null);
  const sadhanaSplit = splitRecent(visibleSadhanas(sadhanas), lastSadhanaId);
  const savedCustomPractices = useMemo(
    () => listSavedCustomPractices(customPractices),
    [customPractices],
  );
  const customSadhanaCards = useMemo(
    () =>
      savedCustomPractices.map((p) =>
        customPracticeToSadhanaPractice(p, t('customPractice.untitled')),
      ),
    [savedCustomPractices, t],
  );

  const sadhanaRecentCustom = lastCustomPracticeId
    ? customSadhanaCards.find((p) => p.id === lastCustomPracticeId)
    : undefined;

  const startGuided = (id: string) => {
    if (!isMeditationAvailable(id)) return;
    const m = meditations.find((x) => x.id === id);
    if (!m) return;
    setLastMeditation(id);
    setMode('guided', id);
    setTargetDuration(m.durationSeconds);
    void acquireScreenWakeLock();
    navigate(sessionUrl(false));
  };

  const startSadhana = (id: string) => {
    if (!isSadhanaAvailable(id)) return;
    const practice = sadhanas.find((x) => x.id === id);
    if (!practice) return;
    setLastSadhana(id);
    setMode('sadhana', id);
    setTargetDuration(sadhanaTotalSeconds(practice, sadhanaBlocks).totalSeconds);
    navigate(sessionUrl(true));
  };

  const startCustom = () => {
    if (!customTrack) return;
    const defaultDuration =
      customTrack.durationSeconds > 0
        ? Math.ceil(customTrack.durationSeconds)
        : 600;
    setMode('custom');
    setTargetDuration(defaultDuration);
    navigate(sessionUrl(true));
  };

  const startCustomPractice = (id: string) => {
    if (!isCustomPracticeAvailable(id)) return;
    const practice = customPractices.find((p) => p.id === id);
    if (!practice || practice.steps.length === 0) return;
    setLastCustomPractice(id);
    setMode('custom-practice', id);
    setTargetDuration(customPracticeTotalSeconds(practice, sadhanaBlocks).totalSeconds);
    void acquireScreenWakeLock();
    navigate(sessionUrl(true));
  };

  return (
    <div className="screen screen--immersive practice-hub">
      <VideoBackground scene="picker" overlay={0.32} blur={2} variant="soft" />
      <div className="screen__body screen__body--scroll fade-in">
        <Header showBack onBack={() => navigate('/welcome')} transparent title={t('hub.title')} />

        {!online && (
          <p className="offline-badge" role="status">
            {t('common.offline')} — {t('picker.offlineHint')}
          </p>
        )}

        <OfflineDownloadPanel onCached={() => void refreshOffline()} />

        <PracticeTabs
          active={tab}
          onChange={setTab}
          labels={{ meditations: t('hub.meditations'), sadhana: t('hub.sadhana') }}
        />

        {tab === 'meditations' && recentMeditation && isMeditationAvailable(recentMeditation.id) && (
          <RecentContinueCard
            label={t('hub.recent')}
            title={recentMeditation.title}
            meta={`${recentMeditation.type} · ${formatTime(recentMeditation.durationSeconds)}`}
            cta={t('hub.continue')}
            onContinue={() => startGuided(recentMeditation.id)}
          />
        )}

        {tab === 'sadhana' &&
          (sadhanaRecentCustom
            ? isCustomPracticeAvailable(sadhanaRecentCustom.id)
            : sadhanaSplit.recent && isSadhanaAvailable(sadhanaSplit.recent.id)) &&
          (sadhanaRecentCustom || sadhanaSplit.recent) && (
          <RecentContinueCard
            label={t('hub.recent')}
            title={sadhanaRecentCustom?.title ?? sadhanaSplit.recent!.title}
            meta={t('hub.phasesCount').replace(
              '{count}',
              String(
                sadhanaRecentCustom?.phases.length ?? sadhanaSplit.recent!.phases.length,
              ),
            )}
            cta={t('hub.continue')}
            onContinue={() =>
              sadhanaRecentCustom
                ? startCustomPractice(sadhanaRecentCustom.id)
                : startSadhana(sadhanaSplit.recent!.id)
            }
          />
        )}

        {tab === 'meditations' && (
          <PracticeTools
            onStartCustom={customTrack ? startCustom : undefined}
            sadhanaBlocks={sadhanaBlocks}
            textureUrl={pageTextures['practice-tools']}
            builderOpen={builderOpen}
            onBuilderOpenChange={handleBuilderOpenChange}
            builderEditId={builderEditId}
          />
        )}

        {tab === 'meditations' ? (
          <div className="practice-hub__catalog" role="tabpanel">
            {audioSplit.rest.length > 0 && (
              <section>
                <SectionTitle textureUrl={pageTextures['section-header']}>
                  {t('picker.audioSection')}
                </SectionTitle>
                {audioSplit.rest.map((m) => (
                  <MeditationCard
                    key={m.id}
                    meditation={m}
                    onSelect={startGuided}
                    textureUrl={pageTextures['meditation-card']}
                    offlineUnavailable={!online && !isMeditationAvailable(m.id)}
                    offlineLabel={offlineLabel}
                  />
                ))}
              </section>
            )}
            {videoSplit.rest.length > 0 && (
              <section>
                <SectionTitle textureUrl={pageTextures['section-header']}>
                  {t('picker.videoSection')}
                </SectionTitle>
                {videoSplit.rest.map((m) => (
                  <MeditationCard
                    key={m.id}
                    meditation={m}
                    onSelect={startGuided}
                    textureUrl={pageTextures['meditation-card']}
                    offlineUnavailable={!online && !isMeditationAvailable(m.id)}
                    offlineLabel={offlineLabel}
                  />
                ))}
              </section>
            )}
          </div>
        ) : (
          <div className="practice-hub__catalog" role="tabpanel">
            <section>
              <SectionTitle textureUrl={pageTextures['section-header']}>
                {t('hub.sadhanaSection')}
              </SectionTitle>
              <p className="text-muted practice-hub__hint">
                {!online ? t('picker.sadhanaOfflineHint') : t('hub.sadhanaHint')}
              </p>
              {customSadhanaCards.map((practice) => (
                <SadhanaCard
                  key={practice.id}
                  practice={practice}
                  onSelect={startCustomPractice}
                  onEdit={openBuilderForEdit}
                  onDelete={deleteCustomPractice}
                  textureUrl={pageTextures['sadhana-card']}
                  blocks={sadhanaBlocks}
                  badgeLabel={t('customPractice.badge')}
                  offlineUnavailable={!online && !isCustomPracticeAvailable(practice.id)}
                  offlineLabel={offlineLabel}
                />
              ))}
              {sadhanaSplit.rest.map((practice) => (
                <SadhanaCard
                  key={practice.id}
                  practice={practice}
                  onSelect={startSadhana}
                  textureUrl={pageTextures['sadhana-card']}
                  blocks={sadhanaBlocks}
                  offlineUnavailable={!online && !isSadhanaAvailable(practice.id)}
                  offlineLabel={offlineLabel}
                />
              ))}
            </section>
            <PracticeTools
              onStartCustom={customTrack ? startCustom : undefined}
              sadhanaBlocks={sadhanaBlocks}
              textureUrl={pageTextures['practice-tools']}
              builderOpen={builderOpen}
              onBuilderOpenChange={handleBuilderOpenChange}
              builderEditId={builderEditId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
