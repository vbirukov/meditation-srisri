import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { track } from '@/analytics/track';
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
import { StreakPath } from '@/components/StreakPath';
import { useT } from '@/i18n';
import { OfflineDownloadPanel } from '@/components/OfflineDownloadPanel';
import { useOfflineCatalog } from '@/hooks/useOfflineCatalog';
import { acquireScreenWakeLock } from '@/hooks/useWakeLock';
import { sessionElapsedSeconds, useSessionStore } from '@/store/sessionStore';
import { useCustomTrackStore } from '@/store/customTrackStore';
import { useRecentPracticeStore } from '@/store/recentPracticeStore';
import { usePracticeStatsStore } from '@/store/practiceStatsStore';
import {
  STARTER_GUIDED_IDS,
  STARTER_TIMER_SECONDS,
  STREAK_GOAL_DAYS,
  useOnboardingStore,
} from '@/store/onboardingStore';
import {
  customPracticeToSadhanaPractice,
  customPracticeTotalSeconds,
  listSavedCustomPractices,
} from '@/utils/customPractice';
import { sadhanaTotalSeconds } from '@/utils/sadhana';
import { useCustomPracticeStore } from '@/store/customPracticeStore';
import { splitRecent } from '@/utils/recentPractice';
import { getStreakView } from '@/utils/practiceStats';
import {
  CONTENT_LANG_FILTERS,
  filterMeditationsByContentLang,
  type ContentLangFilter,
} from '@/utils/contentLanguage';
import { getNewMeditations, getPracticeOfTheWeek } from '@/utils/featured';
import { formatTime } from '@/utils/time';
import '@/components/MeditationCard.css';
import '@/components/SectionTitle.css';
import './PracticeHubScreen.css';


const meditations = meditationsData as Meditation[];
const sadhanaCatalog = sadhanaData as unknown as SadhanaCatalog;
const sadhanas = (sadhanaCatalog.practices ?? []) as SadhanaPractice[];
const sadhanaBlocks = sadhanaCatalog.blocks ?? [];
const DEFAULT_TIMER_SECONDS = 600;
const CONTENT_LANG_KEY = 'meditate-content-lang';

function parseTab(value: string | null): PracticeTab {
  return value === 'sadhana' ? 'sadhana' : 'meditations';
}

function readContentLang(): ContentLangFilter {
  try {
    const raw = localStorage.getItem(CONTENT_LANG_KEY);
    if (raw && (CONTENT_LANG_FILTERS as string[]).includes(raw)) {
      return raw as ContentLangFilter;
    }
  } catch {
    /* ignore */
  }
  return 'all';
}

export function PracticeHubScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const t = useT();
  const tab = useMemo(() => parseTab(params.get('tab')), [params]);

  const setMode = useSessionStore((s) => s.setMode);
  const setTargetDuration = useSessionStore((s) => s.setTargetDuration);
  const interrupted = useSessionStore((s) => s.interrupted);
  const interruptedMode = useSessionStore((s) => s.mode);
  const interruptedMeditationId = useSessionStore((s) => s.meditationId);
  const interruptedSadhanaId = useSessionStore((s) => s.sadhanaId);
  const interruptedCustomPracticeId = useSessionStore((s) => s.customPracticeId);
  const interruptedProgress = useSessionStore((s) =>
    sessionElapsedSeconds({
      progressSeconds: s.progressSeconds,
      guidedAudioSeconds: s.guidedAudioSeconds,
      sadhanaPhaseIndex: s.sadhanaPhaseIndex,
      sadhanaPhaseProgress: s.sadhanaPhaseProgress,
    }),
  );
  const interruptedTarget = useSessionStore((s) => s.targetDurationSeconds);
  const clearInterrupted = useSessionStore((s) => s.clearInterrupted);
  const resetInterrupted = useSessionStore((s) => s.reset);
  const customTrack = useCustomTrackStore((s) => s.track);
  const lastMeditationId = useRecentPracticeStore((s) => s.lastMeditationId);
  const lastSadhanaId = useRecentPracticeStore((s) => s.lastSadhanaId);
  const lastCustomPracticeId = useRecentPracticeStore((s) => s.lastCustomPracticeId);
  const lastTab = useRecentPracticeStore((s) => s.lastTab);
  const setLastMeditation = useRecentPracticeStore((s) => s.setLastMeditation);
  const setLastSadhana = useRecentPracticeStore((s) => s.setLastSadhana);
  const setLastCustomPractice = useRecentPracticeStore((s) => s.setLastCustomPractice);
  const setLastTab = useRecentPracticeStore((s) => s.setLastTab);
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
  const [showAll, setShowAll] = useState(false);
  const [contentLang, setContentLang] = useState<ContentLangFilter>(() => readContentLang());
  const continueRef = useRef<HTMLDivElement>(null);
  const focusContinue = params.get('focus') === 'continue';
  const streakDays = usePracticeStatsStore((s) => s.streakDays);
  const lastPracticeDate = usePracticeStatsStore((s) => s.lastPracticeDate);
  const streak = useMemo(
    () => getStreakView(lastPracticeDate, streakDays),
    [lastPracticeDate, streakDays],
  );
  const lastSession = usePracticeStatsStore((s) => s.lastSession);
  const onboardingDone = useOnboardingStore((s) => s.completed);
  const isReturning =
    Boolean(lastSession) ||
    Boolean(lastMeditationId) ||
    Boolean(lastSadhanaId) ||
    Boolean(lastCustomPracticeId);
  const showStarterPack = !isReturning && !showAll;

  const handleBuilderOpenChange = useCallback((open: boolean) => {
    setBuilderOpen(open);
    if (open) setBuilderEditId(null);
  }, []);

  const loadForEdit = useCustomPracticeStore((s) => s.loadForEdit);

  const openBuilderForEdit = useCallback(
    (id: string) => {
      loadForEdit(id);
      setBuilderEditId(id);
      setBuilderOpen(true);
    },
    [loadForEdit],
  );

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

  useEffect(() => {
    track('practice_hub_view', { tab, focus: focusContinue ? 'continue' : undefined });
  }, [tab, focusContinue]);

  const setTab = useCallback(
    (next: PracticeTab) => {
      setLastTab(next);
      setParams({ tab: next }, { replace: true });
    },
    [setLastTab, setParams],
  );

  const sessionUrl = (setup: boolean) => {
    const q = new URLSearchParams();
    if (setup) q.set('setup', '1');
    q.set('tab', tab);
    return `/session?${q.toString()}`;
  };

  const setContentLangFilter = useCallback((next: ContentLangFilter) => {
    setContentLang(next);
    try {
      localStorage.setItem(CONTENT_LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const potw = useMemo(() => getPracticeOfTheWeek(), []);
  const newMeditations = useMemo(() => getNewMeditations(), []);

  const audio = filterMeditationsByContentLang(
    meditations.filter((m) => m.type === 'audio'),
    contentLang,
  );
  const video = filterMeditationsByContentLang(
    meditations.filter((m) => m.type === 'video'),
    contentLang,
  );
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

  const startTimer = () => {
    setMode('timer');
    setTargetDuration(showStarterPack ? STARTER_TIMER_SECONDS : DEFAULT_TIMER_SECONDS);
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

  useEffect(() => {
    if (!focusContinue || !continueRef.current) return;
    continueRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusContinue, recentMeditation, sadhanaRecentCustom, tab]);

  const starterGuided = useMemo(
    () =>
      STARTER_GUIDED_IDS.map((id) => meditations.find((m) => m.id === id)).filter(
        (m): m is Meditation => Boolean(m) && isMeditationAvailable(m!.id),
      ),
    [isMeditationAvailable],
  );

  const interruptedTitle = useMemo(() => {
    if (interruptedMode === 'guided') {
      return meditations.find((m) => m.id === interruptedMeditationId)?.title ?? t('end.practiceFallback');
    }
    if (interruptedMode === 'sadhana') {
      return sadhanas.find((s) => s.id === interruptedSadhanaId)?.title ?? t('hub.sadhana');
    }
    if (interruptedMode === 'custom-practice') {
      return (
        customPractices.find((p) => p.id === interruptedCustomPracticeId)?.title.trim() ||
        t('customPractice.untitled')
      );
    }
    if (interruptedMode === 'custom') return customTrack?.name ?? t('customTrack.yours');
    return t('timer.title');
  }, [
    customPractices,
    customTrack?.name,
    interruptedCustomPracticeId,
    interruptedMeditationId,
    interruptedMode,
    interruptedSadhanaId,
    t,
  ]);

  const resumeInterrupted = () => {
    clearInterrupted();
    const tab =
      interruptedMode === 'sadhana' || interruptedMode === 'custom-practice'
        ? 'sadhana'
        : 'meditations';
    navigate(`/session?tab=${tab}`);
  };

  const discardInterrupted = () => {
    resetInterrupted();
  };

  return (
    <div className="screen screen--immersive practice-hub">
      <VideoBackground scene="picker" overlay={0.28} blur={2} variant="soft" />
      <div className="screen__body screen__body--scroll fade-in">
        <Header showBack onBack={() => navigate('/welcome')} transparent title={t('hub.title')} />

        {!online && (
          <p className="offline-badge" role="status">
            {t('common.offlineBanner')}
          </p>
        )}

        <OfflineDownloadPanel onCached={() => void refreshOffline()} />

        {(potw.meditation || potw.sadhana) && (
          <section className="practice-hub__featured glass-panel" aria-label={t('hub.practiceOfWeek')}>
            <SectionTitle banner textureUrl={pageTextures['section-header']}>
              {t('hub.practiceOfWeek')}
            </SectionTitle>
            {potw.meditation && (
              <MeditationCard
                meditation={potw.meditation}
                textureUrl={pageTextures['meditation-card']}
                onSelect={startGuided}
                offlineUnavailable={!online && !isMeditationAvailable(potw.meditation.id)}
                offlineLabel={offlineLabel}
              />
            )}
            {potw.sadhana ? (
              <SadhanaCard
                practice={potw.sadhana}
                blocks={sadhanaBlocks}
                textureUrl={pageTextures['sadhana-card']}
                onSelect={startSadhana}
                offlineUnavailable={!online && !isSadhanaAvailable(potw.sadhana.id)}
                offlineLabel={offlineLabel}
              />
            ) : null}
          </section>
        )}

        <PracticeTabs
          active={tab}
          onChange={setTab}
          labels={{ meditations: t('hub.meditations'), sadhana: t('hub.sadhana') }}
        />

        {tab === 'meditations' && (
          <div
            className="practice-hub__lang"
            role="group"
            aria-label={t('hub.contentLang')}
          >
            {CONTENT_LANG_FILTERS.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`practice-hub__lang-btn${contentLang === lang ? ' is-active' : ''}`}
                onClick={() => setContentLangFilter(lang)}
              >
                {lang === 'all' ? t('hub.contentLangAll') : lang.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {interrupted && (
          <div className="practice-hub__resume">
            <RecentContinueCard
              label={t('hub.resumeSession')}
              title={interruptedTitle}
              meta={`${formatTime(interruptedProgress)} / ${formatTime(interruptedTarget)}`}
              cta={t('hub.resumeCta')}
              onContinue={resumeInterrupted}
            />
            <button
              type="button"
              className="practice-hub__resume-discard"
              onClick={discardInterrupted}
            >
              {t('hub.resumeDiscard')}
            </button>
          </div>
        )}

        {onboardingDone && (
          <div
            className={`practice-hub__streak${streak.atRisk ? ' practice-hub__streak--risk' : ''}`}
          >
            <StreakPath
              current={streak.days}
              goal={STREAK_GOAL_DAYS}
              label={
                streak.atRisk
                  ? t('welcome.streakRisk').replace('{days}', String(streak.days))
                  : t('hub.streakLabel').replace('{goal}', String(STREAK_GOAL_DAYS))
              }
              highlightNext={streak.atRisk}
              compact
            />
          </div>
        )}

        {tab === 'meditations' && recentMeditation && isMeditationAvailable(recentMeditation.id) && (
          <div
            ref={continueRef}
            className={
              focusContinue ? 'practice-hub__continue practice-hub__continue--focus' : 'practice-hub__continue'
            }
          >
            <RecentContinueCard
              label={t('hub.recent')}
              title={recentMeditation.title}
              meta={`${recentMeditation.type} · ${formatTime(recentMeditation.durationSeconds)}`}
              cta={t('hub.continue')}
              onContinue={() => startGuided(recentMeditation.id)}
            />
          </div>
        )}

        {tab === 'sadhana' &&
          (sadhanaRecentCustom
            ? isCustomPracticeAvailable(sadhanaRecentCustom.id)
            : sadhanaSplit.recent && isSadhanaAvailable(sadhanaSplit.recent.id)) &&
          (sadhanaRecentCustom || sadhanaSplit.recent) && (
          <div
            ref={continueRef}
            className={
              focusContinue ? 'practice-hub__continue practice-hub__continue--focus' : 'practice-hub__continue'
            }
          >
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
          </div>
        )}

        {tab === 'meditations' && showStarterPack && (
          <section className="practice-hub__starter" aria-label={t('hub.starterTitle')}>
            <SectionTitle textureUrl={pageTextures['section-header']}>
              {t('hub.starterTitle')}
            </SectionTitle>
            <p className="practice-hub__starter-lead text-muted">{t('hub.starterLead')}</p>
            {starterGuided.map((m) => (
              <MeditationCard
                key={m.id}
                meditation={m}
                onSelect={startGuided}
                textureUrl={pageTextures['meditation-card']}
                offlineUnavailable={!online && !isMeditationAvailable(m.id)}
                offlineLabel={offlineLabel}
              />
            ))}
            <button type="button" className="btn-primary practice-hub__starter-timer" onClick={startTimer}>
              {t('onboarding.timerPick')} · {formatTime(STARTER_TIMER_SECONDS)}
            </button>
            <button
              type="button"
              className="btn-secondary practice-hub__show-all"
              onClick={() => setShowAll(true)}
            >
              {t('hub.showAll')}
            </button>
          </section>
        )}

        {tab === 'meditations' && !showStarterPack && (
          <PracticeTools
            onStartCustom={customTrack ? startCustom : undefined}
            onStartTimer={startTimer}
            sadhanaBlocks={sadhanaBlocks}
            textureUrl={pageTextures['practice-tools']}
            builderOpen={builderOpen}
            onBuilderOpenChange={handleBuilderOpenChange}
            builderEditId={builderEditId}
          />
        )}

        {tab === 'meditations' && !showStarterPack ? (
          <div className="practice-hub__catalog" role="tabpanel">
            {filterMeditationsByContentLang(newMeditations, contentLang).length > 0 && (
              <section aria-label={t('hub.newPractices')}>
                <SectionTitle textureUrl={pageTextures['section-header']}>
                  {t('hub.newPractices')}
                </SectionTitle>
                {filterMeditationsByContentLang(newMeditations, contentLang).map((m) => (
                  <MeditationCard
                    key={`new-${m.id}`}
                    meditation={m}
                    onSelect={startGuided}
                    textureUrl={pageTextures['meditation-card']}
                    offlineUnavailable={!online && !isMeditationAvailable(m.id)}
                    offlineLabel={offlineLabel}
                  />
                ))}
              </section>
            )}
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
        ) : tab === 'sadhana' ? (
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
              onStartTimer={startTimer}
              sadhanaBlocks={sadhanaBlocks}
              textureUrl={pageTextures['practice-tools']}
              builderOpen={builderOpen}
              onBuilderOpenChange={handleBuilderOpenChange}
              builderEditId={builderEditId}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
