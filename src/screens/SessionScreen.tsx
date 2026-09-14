import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { track } from '@/analytics/track';
import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';
import type { Meditation, SadhanaCatalog, SadhanaPractice } from '@/types';
import { SadhanaPhaseTimer } from '@/components/SadhanaPhaseTimer';
import { VideoBackground } from '@/components/VideoBackground';
import { Header } from '@/components/Header';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuidedVideoPlayer } from '@/components/GuidedVideoPlayer';
import { Timer } from '@/components/Timer';
import { CustomTrackPanel } from '@/components/CustomTrackPanel';
import { useT } from '@/i18n';
import { canSoftSaveAbandon, sessionElapsedSeconds, useSessionStore } from '@/store/sessionStore';
import { usePracticeStatsStore } from '@/store/practiceStatsStore';
import { useCustomPracticeStore } from '@/store/customPracticeStore';
import { useCustomTrackStore } from '@/store/customTrackStore';
import { resolveCustomPracticeSteps } from '@/utils/customPractice';
import { preferredVideoHeight, videoRenditionUrl } from '@/utils/connection';
import { formatTime } from '@/utils/time';
import { useSessionPanelTexture, textureStyle, withTexture } from '@/utils/textures';
import { useSadhanaChoicesStore } from '@/store/sadhanaChoicesStore';
import { resolveSadhanaPractice, sadhanaTotalSeconds } from '@/utils/sadhana';
import { acquireScreenWakeLock, useWakeLock } from '@/hooks/useWakeLock';
import { useSadhanaDebug } from '@/hooks/useSadhanaDebug';
import '@/styles/textured-surface.css';
import './SessionScreen.css';

const meditations = meditationsData as Meditation[];
const sadhanaCatalog = sadhanaData as unknown as SadhanaCatalog;
const sadhanas = (sadhanaCatalog.practices ?? []) as SadhanaPractice[];
const sadhanaBlocks = sadhanaCatalog.blocks ?? [];
const EMPTY_BLOCK_CHOICES: Record<number, string> = {};

export function SessionScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const t = useT();
  const [focusMode, setFocusMode] = useState(false);
  const [timerRunning, setTimerRunning] = useState(
    () => useSessionStore.getState().timerRunning ?? false,
  );
  const [showExit, setShowExit] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const startedTrackedRef = useRef(false);
  const progress50TrackedRef = useRef(false);

  const mode = useSessionStore((s) => s.mode);
  const meditationId = useSessionStore((s) => s.meditationId);
  const sadhanaId = useSessionStore((s) => s.sadhanaId);
  const customPracticeId = useSessionStore((s) => s.customPracticeId);
  const targetDurationSeconds = useSessionStore((s) => s.targetDurationSeconds);
  const progressSeconds = useSessionStore((s) => s.progressSeconds);
  const setTargetDuration = useSessionStore((s) => s.setTargetDuration);
  const tick = useSessionStore((s) => s.tick);
  const complete = useSessionStore((s) => s.complete);
  const start = useSessionStore((s) => s.start);
  const setMode = useSessionStore((s) => s.setMode);
  const isCompleted = useSessionStore((s) => s.isCompleted);
  const sadhanaPhaseIndex = useSessionStore((s) => s.sadhanaPhaseIndex) ?? 0;
  const sadhanaPhaseProgress = useSessionStore((s) => s.sadhanaPhaseProgress) ?? 0;
  const storedTimerRunning = useSessionStore((s) => s.timerRunning) ?? false;
  const guidedAudioSeconds = useSessionStore((s) => s.guidedAudioSeconds) ?? 0;
  const guidedResumeRef = useRef(guidedAudioSeconds);
  const setTimerRunningStore = useSessionStore((s) => s.setTimerRunning);
  const setSadhanaPhaseState = useSessionStore((s) => s.setSadhanaPhaseState);
  const setGuidedAudioSeconds = useSessionStore((s) => s.setGuidedAudioSeconds);
  const resetSession = useSessionStore((s) => s.reset);
  const markInterrupted = useSessionStore((s) => s.markInterrupted);
  const clearInterrupted = useSessionStore((s) => s.clearInterrupted);
  const pauseSession = useSessionStore((s) => s.pause);

  const customTrack = useCustomTrackStore((s) => s.track);
  const customPractices = useCustomPracticeStore((s) => s.practices);
  const { debugMode, setDebugMode } = useSadhanaDebug(params);

  const sadhanaTimerLabels = useMemo(
    () => ({
      phases: t('sadhana.phases'),
      total: t('sadhana.total'),
      start: t('timer.start'),
      pause: t('timer.pause'),
      resume: t('timer.resume'),
      restart: t('timer.restart'),
      remaining: t('session.remaining'),
      phaseOf: t('sadhana.phaseOf'),
      prevPhase: t('sadhana.prevPhase'),
      nextPhase: t('sadhana.nextPhase'),
      debugMode: t('sadhana.debugMode'),
      debugHint: t('sadhana.debugHint'),
      debugSkip: t('sadhana.debugSkip'),
      debugAudioMain: t('sadhana.debugAudioMain'),
      debugAudioStart: t('sadhana.debugAudioStart'),
      debugAudioEnd: t('sadhana.debugAudioEnd'),
      chooseBlock: t('sadhana.chooseBlock'),
    }),
    [t],
  );

  const returnTab = params.get('tab') === 'sadhana' ? 'sadhana' : 'meditations';
  const practicePath =
    returnTab === 'sadhana' ? '/practice?tab=sadhana' : '/practice';

  // Deep-link bootstrap: #/session?m=... | s=... | t=1
  useEffect(() => {
    const m = params.get('m')?.trim();
    const s = params.get('s')?.trim();
    const timer = params.get('t') === '1' || params.get('mode') === 'timer';
    const state = useSessionStore.getState();
    const busy =
      Boolean(state.startedAt) ||
      state.progressSeconds > 0 ||
      (state.guidedAudioSeconds ?? 0) > 0 ||
      (state.sadhanaPhaseProgress ?? 0) > 0 ||
      state.timerRunning ||
      state.interrupted;

    if (busy) return;

    if (m) {
      const med = meditations.find((x) => x.id === m);
      if (!med) return;
      if (state.mode === 'guided' && state.meditationId === m) return;
      setMode('guided', m);
      setTargetDuration(med.durationSeconds);
      return;
    }
    if (s) {
      const practice = sadhanas.find((x) => x.id === s);
      if (!practice) return;
      if (state.mode === 'sadhana' && state.sadhanaId === s) return;
      setMode('sadhana', s);
      setTargetDuration(sadhanaTotalSeconds(practice, sadhanaBlocks).totalSeconds || 600);
      return;
    }
    if (timer && state.mode !== 'timer') {
      setMode('timer');
      setTargetDuration(state.targetDurationSeconds || 600);
    }
  }, [params, setMode, setTargetDuration]);

  const setup =
    params.get('setup') === '1' &&
    (mode === 'timer' ||
      mode === 'custom' ||
      mode === 'sadhana' ||
      mode === 'custom-practice') &&
    !timerRunning;
  const meditation = meditations.find((m) => m.id === meditationId);
  const sadhana = sadhanas.find((s) => s.id === sadhanaId);
  const customPractice = customPractices.find((p) => p.id === customPracticeId);
  const sadhanaBlockChoices = useSadhanaChoicesStore((s) =>
    sadhanaId ? s.choices[sadhanaId] : undefined,
  ) ?? EMPTY_BLOCK_CHOICES;
  const setSadhanaBlockChoice = useSadhanaChoicesStore((s) => s.setChoice);

  const resolvedSadhana = useMemo(
    () =>
      sadhana
        ? resolveSadhanaPractice(sadhana, sadhanaBlocks, sadhanaBlockChoices)
        : null,
    [sadhana, sadhanaBlockChoices],
  );
  const resolvedSadhanaPhases = resolvedSadhana?.phases ?? null;
  const resolvedSadhanaSlots = resolvedSadhana?.slots;

  const onSadhanaBlockChoiceChange = useCallback(
    (slotIndex: number, blockId: string) => {
      if (!sadhanaId) return;
      setSadhanaBlockChoice(sadhanaId, slotIndex, blockId);
    },
    [sadhanaId, setSadhanaBlockChoice],
  );
  const resolvedCustomPhases = useMemo(
    () =>
      customPractice ? resolveCustomPracticeSteps(customPractice, sadhanaBlocks) : null,
    [customPractice],
  );

  const keepAwake =
    !setup &&
    (mode === 'guided' ||
      ((mode === 'sadhana' ||
        mode === 'timer' ||
        mode === 'custom' ||
        mode === 'custom-practice') &&
        timerRunning));

  useWakeLock(keepAwake);

  const sessionTrackProps = useCallback(() => {
    const practiceId =
      mode === 'guided'
        ? meditationId
        : mode === 'sadhana'
          ? sadhanaId
          : mode === 'custom-practice'
            ? customPracticeId
            : undefined;
    return {
      mode,
      practice_id: practiceId,
      duration: targetDurationSeconds,
    };
  }, [mode, meditationId, sadhanaId, customPracticeId, targetDurationSeconds]);

  const markSessionStarted = useCallback(() => {
    if (startedTrackedRef.current) return;
    startedTrackedRef.current = true;
    track('session_start', sessionTrackProps());
  }, [sessionTrackProps]);

  const onTimerRunningChange = useCallback(
    (running: boolean) => {
      if (running) void acquireScreenWakeLock();
      setTimerRunning(running);
      setTimerRunningStore(running);
      if (running) {
        clearInterrupted();
        // resume must not call start() — it zeroes progressSeconds
        if (!useSessionStore.getState().startedAt) start();
        markSessionStarted();
        if (params.get('setup') === '1') {
          const next = new URLSearchParams(params);
          next.delete('setup');
          navigate(`/session?${next.toString()}`, { replace: true });
        }
      }
    },
    [clearInterrupted, markSessionStarted, navigate, params, setTimerRunningStore, start],
  );

  const onSadhanaPhaseStateChange = useCallback(
    (state: { phaseIndex: number; phaseProgress: number; running: boolean }) => {
      setSadhanaPhaseState(state.phaseIndex, state.phaseProgress);
      setTimerRunningStore(state.running);
    },
    [setSadhanaPhaseState, setTimerRunningStore],
  );

  useEffect(() => {
    if (isCompleted) {
      navigate('/end', { replace: true });
      return;
    }
    const hasSadhanaProgress =
      sadhanaPhaseIndex > 0 || sadhanaPhaseProgress > 0 || storedTimerRunning;
    const hasTimerProgress =
      (mode === 'timer' || mode === 'custom') &&
      (timerRunning || storedTimerRunning || progressSeconds > 0);
    if (
      params.get('setup') === '1' &&
      (((mode === 'sadhana' || mode === 'custom-practice') && hasSadhanaProgress) ||
        hasTimerProgress)
    ) {
      const next = new URLSearchParams(params);
      next.delete('setup');
      navigate(`/session?${next.toString()}`, { replace: true });
      return;
    }
    if (!sessionRestored && storedTimerRunning) {
      setTimerRunning(true);
    }
    setSessionRestored(true);
  }, [
    isCompleted,
    mode,
    navigate,
    params,
    progressSeconds,
    sadhanaPhaseIndex,
    sadhanaPhaseProgress,
    sessionRestored,
    storedTimerRunning,
    timerRunning,
  ]);

  useEffect(() => {
    if (mode === 'custom' && !customTrack) {
      navigate(practicePath, { replace: true });
    }
    if (mode === 'sadhana' && !sadhana) {
      navigate('/practice?tab=sadhana', { replace: true });
    }
    if (mode === 'custom-practice' && !customPractice) {
      navigate('/practice?tab=sadhana', { replace: true });
    }
  }, [mode, customTrack, sadhana, customPractice, navigate, practicePath]);

  const recordSession = usePracticeStatsStore((s) => s.recordSession);

  const handleComplete = useCallback(() => {
    const durationSeconds = Math.max(
      1,
      Math.round(progressSeconds) || targetDurationSeconds,
    );
    track('session_complete', {
      ...sessionTrackProps(),
      duration: durationSeconds,
    });
    recordSession({
      mode,
      meditationId: mode === 'guided' ? meditationId : undefined,
      sadhanaId: mode === 'sadhana' ? sadhanaId : undefined,
      customPracticeId: mode === 'custom-practice' ? customPracticeId : undefined,
      durationSeconds,
    });
    complete();
    navigate('/end');
  }, [
    complete,
    navigate,
    recordSession,
    mode,
    meditationId,
    sadhanaId,
    customPracticeId,
    progressSeconds,
    targetDurationSeconds,
    sessionTrackProps,
  ]);

  const handleGuidedProgress = useCallback(
    (seconds: number) => {
      markSessionStarted();
      tick(seconds);
      setGuidedAudioSeconds(seconds);
      if (
        !progress50TrackedRef.current &&
        targetDurationSeconds > 0 &&
        seconds / targetDurationSeconds >= 0.5
      ) {
        progress50TrackedRef.current = true;
        track('session_progress_50', sessionTrackProps());
      }
    },
    [markSessionStarted, sessionTrackProps, setGuidedAudioSeconds, targetDurationSeconds, tick],
  );

  useEffect(() => {
    if (
      !progress50TrackedRef.current &&
      targetDurationSeconds > 0 &&
      progressSeconds / targetDurationSeconds >= 0.5
    ) {
      progress50TrackedRef.current = true;
      track('session_progress_50', sessionTrackProps());
    }
  }, [progressSeconds, sessionTrackProps, targetDurationSeconds]);

  const handleBack = () => {
    if (timerRunning || progressSeconds > 0) {
      setShowExit(true);
      return;
    }
    navigate(practicePath);
  };

  const confirmExit = () => {
    const state = useSessionStore.getState();
    const elapsed = sessionElapsedSeconds(state);
    const pct =
      state.targetDurationSeconds > 0
        ? Math.round((elapsed / state.targetDurationSeconds) * 100)
        : 0;

    if (canSoftSaveAbandon(state)) {
      pauseSession();
      markInterrupted();
      track('session_abandon', { ...sessionTrackProps(), pct, saved: true });
      setShowExit(false);
      navigate(practicePath);
      return;
    }

    track('session_abandon', { ...sessionTrackProps(), pct, saved: false });
    resetSession();
    navigate(practicePath);
  };

  const discardExit = () => {
    const state = useSessionStore.getState();
    const elapsed = sessionElapsedSeconds(state);
    const pct =
      state.targetDurationSeconds > 0
        ? Math.round((elapsed / state.targetDurationSeconds) * 100)
        : 0;
    track('session_abandon', { ...sessionTrackProps(), pct, saved: false });
    resetSession();
    navigate(practicePath);
  };

  const softSaveEligible = canSoftSaveAbandon({
    isCompleted,
    targetDurationSeconds,
    progressSeconds,
    guidedAudioSeconds,
    sadhanaPhaseIndex,
    sadhanaPhaseProgress,
    timerRunning,
  });

  const toggleFocus = () => setFocusMode((f) => !f);

  const remaining =
    mode === 'guided' && meditation
      ? Math.max(0, meditation.durationSeconds - progressSeconds)
      : Math.max(0, targetDurationSeconds - progressSeconds);

  const sessionTitle =
    mode === 'custom'
      ? customTrack?.name ?? t('customTrack.yours')
      : mode === 'timer'
        ? t('timer.title')
        : mode === 'sadhana'
          ? sadhana?.title ?? t('hub.sadhana')
          : mode === 'custom-practice'
            ? customPractice?.title.trim() || t('customPractice.untitled')
            : meditation?.title;

  const panelTexture = useSessionPanelTexture();
  const isGuidedVideo = mode === 'guided' && meditation?.type === 'video';
  const guidedVideoSrc = useMemo(() => {
    if (!meditation?.mediaUrl) return '';
    return videoRenditionUrl(meditation.mediaUrl, preferredVideoHeight());
  }, [meditation?.mediaUrl]);

  const handleGuidedStart = useCallback(() => {
    void acquireScreenWakeLock();
    const s = useSessionStore.getState();
    if (!s.startedAt) start();
    else clearInterrupted();
    markSessionStarted();
  }, [clearInterrupted, markSessionStarted, start]);

  return (
    <div
      className={`screen session-screen ${focusMode ? 'session-screen--focus' : ''}`}
      onClick={toggleFocus}
      role="presentation"
    >
      <VideoBackground
        scene="session"
        overlay={0.44}
        blur={1}
        variant="session"
        staticOnly={isGuidedVideo}
      />
      {!focusMode && <Header showBack onBack={handleBack} transparent />}

      <div
        className="screen-content session-screen__content"
        onClick={(e) => e.stopPropagation()}
      >
        {!focusMode && (
          <div
            className={withTexture(
              'session-screen__chrome glass-panel',
              panelTexture,
              'textured-surface--session-panel',
            )}
            style={textureStyle(panelTexture)}
          >
            <h1 className="heading-serif heading-serif--sm session-screen__title">
              <span className="session-screen__title-text">{sessionTitle}</span>
            </h1>
            {mode === 'guided' && (
              <p className="session-screen__progress text-muted">
                <span className="session-screen__progress-text">
                  {t('session.remaining')}: {formatTime(remaining)} · {t('session.elapsed')}:{' '}
                  {formatTime(progressSeconds)}
                </span>
              </p>
            )}
          </div>
        )}

        {focusMode && (
          <div className="session-screen__focus-timer glass-panel" aria-live="polite">
            {formatTime(remaining)}
          </div>
        )}

        {mode === 'guided' && meditation?.type === 'audio' && (
          <AudioPlayer
            src={meditation.mediaUrl}
            durationSeconds={meditation.durationSeconds}
            initialTime={guidedResumeRef.current}
            onProgress={handleGuidedProgress}
            onComplete={handleComplete}
            hidden={focusMode}
            textureUrl={panelTexture}
          />
        )}

        {isGuidedVideo && meditation && (
          <GuidedVideoPlayer
            src={guidedVideoSrc}
            fallbackSrc={videoRenditionUrl(meditation.mediaUrl, 480)}
            durationSeconds={meditation.durationSeconds}
            initialTime={guidedResumeRef.current}
            onProgress={handleGuidedProgress}
            onComplete={handleComplete}
            onStart={handleGuidedStart}
            hidden={focusMode}
            textureUrl={panelTexture}
          />
        )}

        {mode === 'custom-practice' &&
          customPractice &&
          resolvedCustomPhases &&
          resolvedCustomPhases.length > 0 && (
            <SadhanaPhaseTimer
              phases={resolvedCustomPhases}
              onComplete={handleComplete}
              running={timerRunning}
              onRunningChange={onTimerRunningChange}
              setupMode={setup}
              initialPhaseIndex={sadhanaPhaseIndex}
              initialPhaseProgress={sadhanaPhaseProgress}
              initialRunning={storedTimerRunning}
              onPhaseStateChange={onSadhanaPhaseStateChange}
              debugMode={debugMode}
              onDebugModeChange={setDebugMode}
              onTotalDurationChange={(totalSeconds) => setTargetDuration(totalSeconds)}
              labels={sadhanaTimerLabels}
            />
          )}

        {mode === 'sadhana' && sadhana && resolvedSadhanaPhases && (
          <SadhanaPhaseTimer
            phases={resolvedSadhanaPhases}
            slots={resolvedSadhanaSlots}
            onBlockChoiceChange={onSadhanaBlockChoiceChange}
            onComplete={handleComplete}
            running={timerRunning}
            onRunningChange={onTimerRunningChange}
            setupMode={setup}
            initialPhaseIndex={sadhanaPhaseIndex}
            initialPhaseProgress={sadhanaPhaseProgress}
            initialRunning={storedTimerRunning}
            onPhaseStateChange={onSadhanaPhaseStateChange}
            debugMode={debugMode}
            onDebugModeChange={setDebugMode}
            onTotalDurationChange={(totalSeconds) => setTargetDuration(totalSeconds)}
            labels={sadhanaTimerLabels}
          />
        )}

        {mode === 'timer' && (
          <Timer
            targetSeconds={targetDurationSeconds}
            onTargetChange={setTargetDuration}
            onComplete={handleComplete}
            running={timerRunning}
            onRunningChange={onTimerRunningChange}
            onProgress={tick}
            setupMode={setup}
            initialProgress={progressSeconds}
            textureUrl={panelTexture}
            labels={{
              presets: t('timer.presets'),
              custom: t('timer.custom'),
              start: t('timer.start'),
              pause: t('timer.pause'),
              resume: t('timer.resume'),
              restart: t('timer.restart'),
              remaining: t('session.remaining'),
              elapsed: t('session.elapsed'),
            }}
          />
        )}

        {mode === 'custom' && customTrack && (
          <>
            {setup && <CustomTrackPanel compact />}
            {!setup && (
              <AudioPlayer
                src={customTrack.objectUrl}
                durationSeconds={customTrack.durationSeconds || targetDurationSeconds}
                loop
                hidden={focusMode}
                autoPlay={timerRunning}
                textureUrl={panelTexture}
              />
            )}
            <Timer
              targetSeconds={targetDurationSeconds}
              onTargetChange={setTargetDuration}
              onComplete={handleComplete}
              running={timerRunning}
              onRunningChange={onTimerRunningChange}
              onProgress={tick}
              setupMode={setup}
              initialProgress={progressSeconds}
              textureUrl={panelTexture}
              labels={{
                presets: t('timer.presets'),
                custom: t('timer.custom'),
                start: t('timer.start'),
                pause: t('timer.pause'),
                resume: t('timer.resume'),
                restart: t('timer.restart'),
                remaining: t('session.remaining'),
                elapsed: t('session.elapsed'),
              }}
            />
          </>
        )}

        {!focusMode && (
          <p className="session-screen__hint text-muted">{t('session.focusHint')}</p>
        )}
      </div>

      {showExit && (
        <div className="session-dialog" role="dialog" aria-modal="true">
          <div className="session-dialog__box panel-elevated">
            <p>
              {softSaveEligible ? t('session.exitSaveConfirm') : t('session.exitConfirm')}
            </p>
            <div className="session-dialog__actions">
              <button type="button" className="btn-secondary" onClick={() => setShowExit(false)}>
                {t('session.exitNo')}
              </button>
              <button type="button" className="btn-primary" onClick={confirmExit}>
                {softSaveEligible ? t('session.exitSave') : t('session.exitYes')}
              </button>
            </div>
            {softSaveEligible && (
              <button type="button" className="session-dialog__discard" onClick={discardExit}>
                {t('session.exitDiscard')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
