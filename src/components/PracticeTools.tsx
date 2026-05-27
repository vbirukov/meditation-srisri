import { useState } from 'react';
import { useT } from '@/i18n';
import { CustomTrackPanel } from '@/components/CustomTrackPanel';
import { textureStyle, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './PracticeTools.css';

interface PracticeToolsProps {
  onStartTimer: () => void;
  onStartCustom?: () => void;
  textureUrl?: string;
}

export function PracticeTools({ onStartTimer, onStartCustom, textureUrl }: PracticeToolsProps) {
  const t = useT();
  const [trackOpen, setTrackOpen] = useState(false);

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
        <button type="button" className="practice-tools__chip" onClick={onStartTimer}>
          <span className="practice-tools__chip-icon" aria-hidden>
            ◯
          </span>
          <span className="practice-tools__chip-label">{t('picker.timerSection')}</span>
        </button>
        <button
          type="button"
          className={`practice-tools__chip ${trackOpen ? 'practice-tools__chip--active' : ''}`}
          onClick={() => setTrackOpen((o) => !o)}
          aria-expanded={trackOpen}
        >
          <span className="practice-tools__chip-icon" aria-hidden>
            ♪
          </span>
          <span className="practice-tools__chip-label">{t('picker.customSection')}</span>
        </button>
      </div>
      {trackOpen && (
        <div className="practice-tools__track">
          <CustomTrackPanel onStart={onStartCustom} />
        </div>
      )}
    </section>
  );
}
