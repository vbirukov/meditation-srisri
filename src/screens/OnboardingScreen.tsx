import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/analytics/track';
import meditationsData from '@/data/meditations.json';
import type { Meditation } from '@/types';
import { Header } from '@/components/Header';
import { StreakPath } from '@/components/StreakPath';
import { VideoBackground } from '@/components/VideoBackground';
import { useT } from '@/i18n';
import { acquireScreenWakeLock } from '@/hooks/useWakeLock';
import {
  SLOT_DEFAULT_HOUR,
  STARTER_GUIDED_IDS,
  STARTER_TIMER_SECONDS,
  STREAK_GOAL_DAYS,
  useOnboardingStore,
  type PracticeSlot,
} from '@/store/onboardingStore';
import { ReminderTimePicker } from '@/components/ReminderTimePicker';
import { useRecentPracticeStore } from '@/store/recentPracticeStore';
import { useSessionStore } from '@/store/sessionStore';
import { formatTime } from '@/utils/time';
import './OnboardingScreen.css';

const meditations = meditationsData as Meditation[];

type Step = 'promise' | 'slot' | 'pick';
type PickId = (typeof STARTER_GUIDED_IDS)[number] | 'timer';

const STEPS: Step[] = ['promise', 'slot', 'pick'];
const SLOTS: PracticeSlot[] = ['morning', 'day', 'evening'];

function recommendPick(slot: PracticeSlot | null): PickId {
  if (slot === 'evening') return 'smile';
  if (slot === 'day') return 'timer';
  return 'om-short';
}

export function OnboardingScreen() {
  const navigate = useNavigate();
  const t = useT();
  const [step, setStep] = useState<Step>('promise');
  const [slotPhase, setSlotPhase] = useState<'choose' | 'time'>('choose');
  const [draftSlot, setDraftSlot] = useState<PracticeSlot | null>(null);
  const [draftHour, setDraftHour] = useState(7);
  const [draftMinute, setDraftMinute] = useState(0);
  const complete = useOnboardingStore((s) => s.complete);
  const setPreferredSlot = useOnboardingStore((s) => s.setPreferredSlot);
  const setReminderTime = useOnboardingStore((s) => s.setReminderTime);
  const preferredSlot = useOnboardingStore((s) => s.preferredSlot);
  const setMode = useSessionStore((s) => s.setMode);
  const setTargetDuration = useSessionStore((s) => s.setTargetDuration);
  const setLastMeditation = useRecentPracticeStore((s) => s.setLastMeditation);

  const starters = useMemo(
    () =>
      STARTER_GUIDED_IDS.map((id) => meditations.find((m) => m.id === id)).filter(
        (m): m is Meditation => Boolean(m),
      ),
    [],
  );

  const recommended = recommendPick(preferredSlot);
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    track('onboarding_view', { step, slot: preferredSlot ?? undefined });
  }, [step, preferredSlot]);

  const finishOnboarding = () => {
    complete();
  };

  const startGuided = (m: Meditation) => {
    finishOnboarding();
    setLastMeditation(m.id);
    setMode('guided', m.id);
    setTargetDuration(m.durationSeconds);
    track('onboarding_start', {
      mode: 'guided',
      practice_id: m.id,
      slot: preferredSlot ?? undefined,
      recommended: m.id === recommended,
    });
    void acquireScreenWakeLock();
    navigate('/session', { replace: true });
  };

  const startTimer = () => {
    finishOnboarding();
    setMode('timer');
    setTargetDuration(STARTER_TIMER_SECONDS);
    track('onboarding_start', {
      mode: 'timer',
      duration: STARTER_TIMER_SECONDS,
      slot: preferredSlot ?? undefined,
      recommended: recommended === 'timer',
    });
    navigate('/session?setup=1', { replace: true });
  };

  const skipToHub = () => {
    finishOnboarding();
    track('onboarding_skip', { step, slot: preferredSlot ?? undefined });
    navigate('/practice', { replace: true });
  };

  const goBack = () => {
    if (step === 'slot' && slotPhase === 'time') {
      setSlotPhase('choose');
      return;
    }
    if (step === 'slot') setStep('promise');
    else if (step === 'pick') {
      setStep('slot');
      setSlotPhase(preferredSlot ? 'time' : 'choose');
    }
  };

  const chooseSlot = (slot: PracticeSlot) => {
    setDraftSlot(slot);
    setDraftHour(SLOT_DEFAULT_HOUR[slot]);
    setDraftMinute(0);
    setSlotPhase('time');
    track('onboarding_view', { step: 'slot_picked', slot });
  };

  const confirmReminderTime = () => {
    const slot = draftSlot ?? preferredSlot ?? 'morning';
    setPreferredSlot(slot);
    setReminderTime(draftHour, draftMinute, slot);
    track('onboarding_view', {
      step: 'reminder_time',
      slot,
      hour: draftHour,
      minute: draftMinute,
    });
    setStep('pick');
  };

  return (
    <div className="screen screen--immersive onboarding">
      <VideoBackground scene="welcome" overlay={0.56} variant="welcome" />
      <div className="screen__body onboarding__body">
        <Header transparent />

        <div className="onboarding__chrome" aria-hidden={false}>
          <div className="onboarding__steps" role="list" aria-label={t('onboarding.stepsLabel')}>
            {STEPS.map((s, i) => (
              <span
                key={s}
                role="listitem"
                className={[
                  'onboarding__step-dot',
                  i < stepIndex ? 'onboarding__step-dot--done' : '',
                  i === stepIndex ? 'onboarding__step-dot--current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </div>
          {step !== 'promise' && (
            <button type="button" className="onboarding__back" onClick={goBack}>
              {t('onboarding.back')}
            </button>
          )}
        </div>

        {step === 'promise' && (
          <div className="onboarding__panel glass-panel onboarding__panel--enter" key="promise">
            <div className="onboarding__mark" aria-hidden>
              ॐ
            </div>
            <p className="onboarding__eyebrow">{t('onboarding.eyebrow')}</p>
            <h1 className="heading-serif onboarding__title">{t('onboarding.title')}</h1>
            <p className="onboarding__lead text-muted">{t('onboarding.lead')}</p>
            <StreakPath
              current={0}
              goal={STREAK_GOAL_DAYS}
              label={t('onboarding.pathLabel')}
              highlightNext
            />
            <p className="onboarding__promise-note text-muted">{t('onboarding.promiseNote')}</p>
            <button
              type="button"
              className="btn-primary onboarding__cta"
              onClick={() => setStep('slot')}
            >
              {t('onboarding.ctaPromise')}
            </button>
            <button type="button" className="onboarding__skip" onClick={skipToHub}>
              {t('onboarding.skip')}
            </button>
            <p className="onboarding__disclaimer">{t('welcome.disclaimer')}</p>
          </div>
        )}

        {step === 'slot' && slotPhase === 'choose' && (
          <div className="onboarding__panel glass-panel onboarding__panel--enter" key="slot">
            <p className="onboarding__eyebrow">{t('onboarding.slotEyebrow')}</p>
            <h1 className="heading-serif onboarding__title onboarding__title--sm">
              {t('onboarding.slotTitle')}
            </h1>
            <p className="onboarding__lead text-muted">{t('onboarding.slotLead')}</p>
            <div className="onboarding__slots">
              {SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`onboarding__slot${preferredSlot === slot ? ' onboarding__slot--active' : ''}`}
                  onClick={() => chooseSlot(slot)}
                >
                  <span className="onboarding__slot-main">
                    <span className="onboarding__slot-title">{t(`onboarding.slot.${slot}`)}</span>
                    <span className="onboarding__slot-hint text-muted">
                      {t(`onboarding.slotHint.${slot}`)}
                    </span>
                  </span>
                  <span className="onboarding__slot-chevron" aria-hidden>
                    →
                  </span>
                </button>
              ))}
            </div>
            <button type="button" className="onboarding__skip" onClick={() => setStep('pick')}>
              {t('onboarding.slotLater')}
            </button>
          </div>
        )}

        {step === 'slot' && slotPhase === 'time' && (
          <div className="onboarding__panel glass-panel onboarding__panel--enter" key="slot-time">
            <p className="onboarding__eyebrow">{t('onboarding.timeEyebrow')}</p>
            <h1 className="heading-serif onboarding__title onboarding__title--sm">
              {t('onboarding.timeTitle')}
            </h1>
            <p className="onboarding__lead text-muted">{t('onboarding.timeLead')}</p>
            <ReminderTimePicker
              slot={draftSlot}
              hour={draftHour}
              minute={draftMinute}
              labels={{
                slotsTitle: t('onboarding.timeSlotsLabel'),
                timeTitle: t('onboarding.timeExactLabel'),
                slot: {
                  morning: t('onboarding.slot.morning'),
                  day: t('onboarding.slot.day'),
                  evening: t('onboarding.slot.evening'),
                },
                confirm: t('onboarding.timeConfirm'),
                custom: t('onboarding.timeCustom'),
              }}
              onSlotChange={(s) => {
                setDraftSlot(s);
                setDraftHour(SLOT_DEFAULT_HOUR[s]);
                setDraftMinute(0);
              }}
              onTimeChange={(h, m) => {
                setDraftHour(h);
                setDraftMinute(m);
              }}
              onConfirm={confirmReminderTime}
            />
            <button
              type="button"
              className="onboarding__skip"
              onClick={() => {
                const slot = draftSlot ?? 'morning';
                setPreferredSlot(slot);
                setReminderTime(SLOT_DEFAULT_HOUR[slot], 0, slot);
                setStep('pick');
              }}
            >
              {t('onboarding.timeDefault')}
            </button>
          </div>
        )}

        {step === 'pick' && (
          <div className="onboarding__panel glass-panel onboarding__panel--enter" key="pick">
            <p className="onboarding__eyebrow">{t('onboarding.pickEyebrow')}</p>
            <h1 className="heading-serif onboarding__title onboarding__title--sm">
              {t('onboarding.pickTitle')}
            </h1>
            <p className="onboarding__lead text-muted">
              {preferredSlot
                ? t(`onboarding.pickLead.${preferredSlot}`)
                : t('onboarding.pickLead.default')}
            </p>
            <div className="onboarding__picks">
              {[...starters]
                .sort((a, b) => {
                  const aRec = a.id === recommended ? -1 : 0;
                  const bRec = b.id === recommended ? -1 : 0;
                  return aRec - bRec;
                })
                .map((m) => {
                  const isRec = m.id === recommended;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`onboarding__pick${isRec ? ' onboarding__pick--recommended' : ''}`}
                      onClick={() => startGuided(m)}
                    >
                      <span className="onboarding__pick-top">
                        {isRec && (
                          <span className="onboarding__pick-badge">{t('onboarding.recommended')}</span>
                        )}
                        <span className="onboarding__pick-duration">{formatTime(m.durationSeconds)}</span>
                      </span>
                      <span className="onboarding__pick-title">{m.title}</span>
                      <span className="onboarding__pick-meta">{m.description}</span>
                    </button>
                  );
                })}
              <button
                type="button"
                className={`onboarding__pick${recommended === 'timer' ? ' onboarding__pick--recommended' : ''}`}
                onClick={startTimer}
              >
                <span className="onboarding__pick-top">
                  {recommended === 'timer' && (
                    <span className="onboarding__pick-badge">{t('onboarding.recommended')}</span>
                  )}
                  <span className="onboarding__pick-duration">
                    {formatTime(STARTER_TIMER_SECONDS)}
                  </span>
                </span>
                <span className="onboarding__pick-title">{t('onboarding.timerPick')}</span>
                <span className="onboarding__pick-meta">{t('onboarding.timerPickMeta')}</span>
              </button>
            </div>
            <button type="button" className="onboarding__skip" onClick={skipToHub}>
              {t('onboarding.skipCatalog')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
