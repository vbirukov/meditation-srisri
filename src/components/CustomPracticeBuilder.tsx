import { useMemo, useState } from 'react';
import type { CustomPracticeStep, SadhanaBlock } from '@/types';
import { useT } from '@/i18n';
import { useCustomPracticeStore } from '@/store/customPracticeStore';
import {
  blockDurationLabel,
  customPracticeTotalSeconds,
  formatCustomPracticeTotal,
} from '@/utils/customPractice';
import { formatPhaseDuration } from '@/utils/sadhana';
import './CustomPracticeBuilder.css';

interface CustomPracticeBuilderProps {
  blocks: readonly SadhanaBlock[];
  onStart: (practiceId: string) => void;
}

function stepLabel(step: CustomPracticeStep, block: SadhanaBlock | undefined): string {
  return step.label?.trim() || block?.title || step.blockId;
}

function blockById(blocks: readonly SadhanaBlock[]): Record<string, SadhanaBlock> {
  return Object.fromEntries(blocks.map((b) => [b.id, b]));
}

export function CustomPracticeBuilder({ blocks, onStart }: CustomPracticeBuilderProps) {
  const t = useT();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const practices = useCustomPracticeStore((s) => s.practices);
  const editingId = useCustomPracticeStore((s) => s.editingId);
  const startNew = useCustomPracticeStore((s) => s.startNew);
  const loadForEdit = useCustomPracticeStore((s) => s.loadForEdit);
  const updateEditing = useCustomPracticeStore((s) => s.updateEditing);
  const saveEditing = useCustomPracticeStore((s) => s.saveEditing);
  const removePractice = useCustomPracticeStore((s) => s.removePractice);
  const duplicatePractice = useCustomPracticeStore((s) => s.duplicatePractice);
  const addBlock = useCustomPracticeStore((s) => s.addBlock);
  const updateStep = useCustomPracticeStore((s) => s.updateStep);
  const removeStep = useCustomPracticeStore((s) => s.removeStep);
  const moveStep = useCustomPracticeStore((s) => s.moveStep);
  const duplicateStep = useCustomPracticeStore((s) => s.duplicateStep);

  const byId = useMemo(() => blockById(blocks), [blocks]);
  const practice = practices.find((p) => p.id === editingId) ?? null;
  const total = practice ? customPracticeTotalSeconds(practice, blocks) : null;

  const handleStart = () => {
    const id = saveEditing();
    if (!id) return;
    onStart(id);
  };

  return (
    <div className="custom-practice-builder">
      {practices.length > 0 && (
        <ul className="custom-practice-builder__saved">
          {practices.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`custom-practice-builder__saved-btn${
                  p.id === editingId ? ' custom-practice-builder__saved-btn--active' : ''
                }`}
                onClick={() => loadForEdit(p.id)}
              >
                <span className="custom-practice-builder__saved-title">
                  {p.title.trim() || t('customPractice.untitled')}
                </span>
                <span className="text-muted custom-practice-builder__saved-meta">
                  {p.steps.length} · {formatCustomPracticeTotal(p, blocks)}
                </span>
              </button>
              <div className="custom-practice-builder__saved-actions">
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => duplicatePractice(p.id)}
                  aria-label={t('customPractice.duplicate')}
                >
                  ⧉
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => removePractice(p.id)}
                  aria-label={t('customPractice.delete')}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn-secondary custom-practice-builder__new"
        onClick={() => startNew()}
      >
        {t('customPractice.new')}
      </button>

      {!practice && (
        <p className="text-muted custom-practice-builder__hint">{t('customPractice.hint')}</p>
      )}

      {practice && (
        <>
          <label className="custom-practice-builder__field">
            <span>{t('customPractice.name')}</span>
            <input
              type="text"
              value={practice.title}
              placeholder={t('customPractice.namePlaceholder')}
              onChange={(e) => updateEditing({ title: e.target.value })}
            />
          </label>

          <p className="section-title custom-practice-builder__section">{t('customPractice.blocks')}</p>
          <div className="custom-practice-builder__catalog">
            {blocks.map((block) => (
              <button
                key={block.id}
                type="button"
                className="custom-practice-builder__block-chip"
                onClick={() => addBlock(block)}
              >
                <span>{block.title}</span>
                {blockDurationLabel(block) && (
                  <span className="text-muted">{blockDurationLabel(block)}</span>
                )}
              </button>
            ))}
          </div>

          <p className="section-title custom-practice-builder__section">
            {t('customPractice.sequence')}
            {total && (
              <span className="text-muted custom-practice-builder__total">
                {total.hasUnknown
                  ? `≈ ${formatPhaseDuration(total.totalSeconds)}`
                  : formatPhaseDuration(total.totalSeconds)}
              </span>
            )}
          </p>

          {practice.steps.length === 0 ? (
            <p className="text-muted">{t('customPractice.emptySequence')}</p>
          ) : (
            <ol className="custom-practice-builder__sequence">
              {practice.steps.map((step, index) => {
                const block = byId[step.blockId];
                const open = expandedStep === step.instanceId;
                const durMin =
                  typeof step.durationSeconds === 'number'
                    ? Math.round(step.durationSeconds / 60)
                    : typeof block?.durationSeconds === 'number'
                      ? Math.round(block.durationSeconds / 60)
                      : '';

                return (
                  <li key={step.instanceId} className={open ? 'custom-practice-builder__step--open' : ''}>
                    <div className="custom-practice-builder__step-head">
                      <button
                        type="button"
                        className="custom-practice-builder__step-toggle"
                        onClick={() =>
                          setExpandedStep(open ? null : step.instanceId)
                        }
                      >
                        <span className="custom-practice-builder__step-num">{index + 1}</span>
                        <span>{stepLabel(step, block)}</span>
                      </button>
                      <div className="custom-practice-builder__step-actions">
                        <button
                          type="button"
                          className="btn-icon"
                          disabled={index === 0}
                          onClick={() => moveStep(step.instanceId, -1)}
                          aria-label={t('customPractice.moveUp')}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          disabled={index === practice.steps.length - 1}
                          onClick={() => moveStep(step.instanceId, 1)}
                          aria-label={t('customPractice.moveDown')}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => duplicateStep(step.instanceId)}
                          aria-label={t('customPractice.duplicateStep')}
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => removeStep(step.instanceId)}
                          aria-label={t('customPractice.removeStep')}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="custom-practice-builder__step-form">
                        <label className="custom-practice-builder__field">
                          <span>{t('customPractice.stepTitle')}</span>
                          <input
                            type="text"
                            value={step.label ?? ''}
                            placeholder={block?.title ?? ''}
                            onChange={(e) =>
                              updateStep(step.instanceId, {
                                label: e.target.value || undefined,
                              })
                            }
                          />
                        </label>
                        <label className="custom-practice-builder__field">
                          <span>{t('customPractice.stepDescription')}</span>
                          <textarea
                            rows={2}
                            value={step.description ?? ''}
                            placeholder={block?.description ?? ''}
                            onChange={(e) =>
                              updateStep(step.instanceId, {
                                description: e.target.value || undefined,
                              })
                            }
                          />
                        </label>
                        <label className="custom-practice-builder__field">
                          <span>{t('customPractice.durationMin')}</span>
                          <input
                            type="number"
                            min={0}
                            max={180}
                            step={1}
                            value={durMin}
                            onChange={(e) => {
                              const min = Number(e.target.value);
                              updateStep(step.instanceId, {
                                durationSeconds:
                                  Number.isFinite(min) && min > 0 ? min * 60 : undefined,
                              });
                            }}
                          />
                        </label>
                        {(block?.audioUrl || block?.startAudioUrl) && (
                          <label className="custom-practice-builder__check">
                            <input
                              type="checkbox"
                              checked={step.playMainAudio !== false}
                              onChange={(e) =>
                                updateStep(step.instanceId, {
                                  playMainAudio: e.target.checked,
                                })
                              }
                            />
                            <span>{t('customPractice.playMain')}</span>
                          </label>
                        )}
                        {block?.startingAudioUrl && (
                          <label className="custom-practice-builder__check">
                            <input
                              type="checkbox"
                              checked={step.playStartingAudio !== false}
                              onChange={(e) =>
                                updateStep(step.instanceId, {
                                  playStartingAudio: e.target.checked,
                                })
                              }
                            />
                            <span>{t('customPractice.playStart')}</span>
                          </label>
                        )}
                        {block?.finishingAudioUrl && (
                          <label className="custom-practice-builder__check">
                            <input
                              type="checkbox"
                              checked={step.playFinishingAudio !== false}
                              onChange={(e) =>
                                updateStep(step.instanceId, {
                                  playFinishingAudio: e.target.checked,
                                })
                              }
                            />
                            <span>{t('customPractice.playEnd')}</span>
                          </label>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          <button
            type="button"
            className="btn-primary custom-practice-builder__start"
            disabled={practice.steps.length === 0}
            onClick={handleStart}
          >
            {t('customPractice.start')}
          </button>
        </>
      )}
    </div>
  );
}
