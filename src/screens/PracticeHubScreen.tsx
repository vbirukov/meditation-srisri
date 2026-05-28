import { useCallback, useEffect, useMemo } from 'react';
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
import { useOnline } from '@/hooks/useOnline';
import { acquireScreenWakeLock } from '@/hooks/useWakeLock';
import { useSessionStore } from '@/store/sessionStore';
import { useCustomTrackStore } from '@/store/customTrackStore';
import { useRecentPracticeStore } from '@/store/recentPracticeStore';
import { sadhanaTotalSeconds } from '@/utils/sadhana';
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
  const online = useOnline();
  const tab = useMemo(() => parseTab(params.get('tab')), [params]);

  const setMode = useSessionStore((s) => s.setMode);
  const setTargetDuration = useSessionStore((s) => s.setTargetDuration);
  const customTrack = useCustomTrackStore((s) => s.track);
  const lastMeditationId = useRecentPracticeStore((s) => s.lastMeditationId);
  const lastSadhanaId = useRecentPracticeStore((s) => s.lastSadhanaId);
  const lastTab = useRecentPracticeStore((s) => s.lastTab);
  const setLastMeditation = useRecentPracticeStore((s) => s.setLastMeditation);
  const setLastSadhana = useRecentPracticeStore((s) => s.setLastSadhana);
  const pageTextures = usePageTextures(PRACTICE_HUB_TEXTURE_POOLS);

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
    online ? list : list.filter((m) => m.isOfflinePrecached);

  const visibleAudio = visible(audio);
  const visibleVideo = visible(video);
  const audioSplit = splitRecent(visibleAudio, lastMeditationId);
  const videoSplit = splitRecent(visibleVideo, lastMeditationId);
  const recentMeditation =
    audioSplit.recent ?? (videoSplit.recent?.id === lastMeditationId ? videoSplit.recent : null);
  const sadhanaSplit = splitRecent(sadhanas, lastSadhanaId);

  const startGuided = (id: string) => {
    const m = meditations.find((x) => x.id === id);
    if (!m) return;
    setLastMeditation(id);
    setMode('guided', id);
    setTargetDuration(m.durationSeconds);
    void acquireScreenWakeLock();
    navigate(sessionUrl(false));
  };

  const startSadhana = (id: string) => {
    const practice = sadhanas.find((x) => x.id === id);
    if (!practice) return;
    setLastSadhana(id);
    setMode('sadhana', id);
    setTargetDuration(sadhanaTotalSeconds(practice, sadhanaBlocks).totalSeconds);
    navigate(sessionUrl(true));
  };

  const startTimer = () => {
    setMode('timer');
    setTargetDuration(600);
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

        <PracticeTabs
          active={tab}
          onChange={setTab}
          labels={{ meditations: t('hub.meditations'), sadhana: t('hub.sadhana') }}
        />

        {tab === 'meditations' && recentMeditation && (
          <RecentContinueCard
            label={t('hub.recent')}
            title={recentMeditation.title}
            meta={`${recentMeditation.type} · ${formatTime(recentMeditation.durationSeconds)}`}
            cta={t('hub.continue')}
            onContinue={() => startGuided(recentMeditation.id)}
          />
        )}

        {tab === 'sadhana' && sadhanaSplit.recent && (
          <RecentContinueCard
            label={t('hub.recent')}
            title={sadhanaSplit.recent.title}
            meta={t('hub.phasesCount').replace(
              '{count}',
              String(sadhanaSplit.recent.phases.length),
            )}
            cta={t('hub.continue')}
            onContinue={() => startSadhana(sadhanaSplit.recent!.id)}
          />
        )}

        {tab === 'meditations' && (
          <PracticeTools
            onStartTimer={startTimer}
            onStartCustom={customTrack ? startCustom : undefined}
            textureUrl={pageTextures['practice-tools']}
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
              <p className="text-muted practice-hub__hint">{t('hub.sadhanaHint')}</p>
              {sadhanaSplit.rest.map((practice) => (
                <SadhanaCard
                  key={practice.id}
                  practice={practice}
                  onSelect={startSadhana}
                  textureUrl={pageTextures['sadhana-card']}
                  blocks={sadhanaBlocks}
                />
              ))}
            </section>
            <PracticeTools
              onStartTimer={startTimer}
              onStartCustom={customTrack ? startCustom : undefined}
              textureUrl={pageTextures['practice-tools']}
            />
          </div>
        )}
      </div>
    </div>
  );
}
