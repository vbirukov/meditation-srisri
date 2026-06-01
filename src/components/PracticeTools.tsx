import { useState } from 'react';
import type { SadhanaBlock } from '@/types';
import { CustomPracticeBuilder } from '@/components/CustomPracticeBuilder';
import { CustomTrackPanel } from '@/components/CustomTrackPanel';
import { useT } from '@/i18n';
import { textureStyle, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './PracticeTools.css';

interface PracticeToolsProps {
  onStartCustom?: () => void;
  sadhanaBlocks?: readonly SadhanaBlock[];
  textureUrl?: string;
  builderOpen?: boolean;
  onBuilderOpenChange?: (open: boolean) => void;
  builderEditId?: string | null;
}

export function PracticeTools({
  onStartCustom,
  sadhanaBlocks = [],
  textureUrl,
  builderOpen = false,
  onBuilderOpenChange,
  builderEditId = null,
}: PracticeToolsProps) {
  const t = useT();
  const [trackOpen, setTrackOpen] = useState(false);

  const setBuilderOpen = (open: boolean) => {
    onBuilderOpenChange?.(open);
  };

  return (
    <section
      className={withTexture(
        'practice-tools glass-panel',
        textureUrl,
        'textured-surface--corner-br',
      )}
      style={textureStyle(textureUrl)}
      aria-label={t('hub.toolsTitle')}
    >
      <h2 className="practice-tools__heading">{t('hub.toolsTitle')}</h2>
      <div className="practice-tools__row">
        <button
          type="button"
          className={`practice-tools__chip ${trackOpen ? 'practice-tools__chip--active' : ''}`}
          onClick={() => {
            setBuilderOpen(false);
            setTrackOpen((o) => !o);
          }}
          aria-expanded={trackOpen}
        >
          <span className="practice-tools__chip-icon" aria-hidden>
            ♪
          </span>
          <span className="practice-tools__chip-label">{t('picker.customSection')}</span>
        </button>
        {onBuilderOpenChange && sadhanaBlocks.length > 0 && (
          <button
            type="button"
            className={`practice-tools__chip ${builderOpen ? 'practice-tools__chip--active' : ''}`}
            onClick={() => {
              setTrackOpen(false);
              setBuilderOpen(!builderOpen);
            }}
            aria-expanded={builderOpen}
          >
            <span className="practice-tools__chip-icon" aria-hidden>
              ⊞
            </span>
            <span className="practice-tools__chip-label">{t('customPractice.builder')}</span>
          </button>
        )}
      </div>
      {trackOpen && (
        <div className="practice-tools__track">
          <CustomTrackPanel onStart={onStartCustom} />
        </div>
      )}
      {builderOpen && onBuilderOpenChange && (
        <div className="practice-tools__track">
          <CustomPracticeBuilder blocks={sadhanaBlocks} editPracticeId={builderEditId} />
        </div>
      )}
    </section>
  );
}
