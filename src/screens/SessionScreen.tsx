import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';
import type { Meditation, SadhanaCatalog, SadhanaPractice } from '@/types';
import { SadhanaPhaseTimer } from '@/components/SadhanaPhaseTimer';
import { VideoBackground } from '@/components/VideoBackground';
import { Header } from '@/components/Header';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Timer } from '@/components/Timer';
import { CustomTrackPanel } from '@/components/CustomTrackPanel';
import { useT } from '@/i18n';
import { useSessionStore } from '@/store/sessionStore';
import { usePracticeStatsStore } from '@/store/practiceStatsStore';
import { useCustomPracticeStore } from '@/store/customPracticeStore';
import { useCustomTrackStore } from '@/store/customTrackStore';
import { resolveCustomPracticeSteps } from '@/utils/customPractice';
import { formatTime } from '@/utils/time';
import { useSessionPanelTexture, textureStyle, withTexture } from '@/utils/textures';
import { resolveSadhanaPhases } from '@/utils/sadhana';
import { acquireScreenWakeLock, useWakeLock } from '@/hooks/useWakeLock';
import { useSadhanaDebug } from '@/hooks/useSadhanaDebug';
import '@/styles/textured-surface.css';
import './SessionScreen.css';

const meditations = meditationsData as Meditation[];
const sadhanaCatalog = sadhanaData as unknown as SadhanaCatalog;
const sadhanas = (sadhanaCatalog.practices ?? []) as SadhanaPractice[];
const sadhanaBlocks = sadhanaCatalog.blocks ?? [];

export function SessionScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const t = useT();
  const [focusMode, setFocusMode] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showExit, setShowExit] = useState(false);

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
    }),
    [t],
  );

  const returnTab = params.get('tab') === 'sadhana' ? 'sadhana' : 'meditations';
  const practicePath =
    returnTab === 'sadhana' ? '/practice?tab=sadhana' : '/practice';

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
  const resolvedSadhanaPhases = useMemo(
    () => (sadhana ? resolveSadhanaPhases(sadhana, sadhanaBlocks) : null),
    [sadhana],
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

  const onTimerRunningChange = useCallback(
    (running: boolean) => {
      if (running) void acquireScreenWakeLock();
      setTimerRunning(running);
      if (running) start();
    },
    [start],
  );

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
  ]);

  const handleBack = () => {
    if (timerRunning || progressSeconds > 0) {
      setShowExit(true);
      return;
    }
    navigate(practicePath);
  };

  const confirmExit = () => navigate(practicePath);

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

  return (
    <div
      className={`screen session-screen ${focusMode ? 'session-screen--focus' : ''}`}
      onClick={toggleFocus}
      role="presentation"
    >
      <VideoBackground scene="session" overlay={0.5} />
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
            onProgress={tick}
            onComplete={handleComplete}
            hidden={focusMode}
            textureUrl={panelTexture}
          />
        )}

        {mode === 'guided' && meditation?.type === 'video' && (
          <div className="session-screen__video-wrap">
            <video
              className="session-screen__guided-video"
              src={meditation.mediaUrl}
              controls={!focusMode}
              playsInline
              onEnded={handleComplete}
              onTimeUpdate={(e) => tick(e.currentTarget.currentTime)}
            />
          </div>
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
              debugMode={debugMode}
              onDebugModeChange={setDebugMode}
              onTotalDurationChange={(totalSeconds) => setTargetDuration(totalSeconds)}
              labels={sadhanaTimerLabels}
            />
          )}

        {mode === 'sadhana' && sadhana && resolvedSadhanaPhases && (
          <SadhanaPhaseTimer
            phases={resolvedSadhanaPhases}
            onComplete={handleComplete}
            running={timerRunning}
            onRunningChange={onTimerRunningChange}
            setupMode={setup}
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
            setupMode={setup}
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
              setupMode={setup}
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
            <p>{t('session.exitConfirm')}</p>
            <div className="session-dialog__actions">
              <button type="button" className="btn-secondary" onClick={() => setShowExit(false)}>
                {t('session.exitNo')}
              </button>
              <button type="button" className="btn-primary" onClick={confirmExit}>
                {t('session.exitYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
