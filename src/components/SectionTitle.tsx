import { textureStyle, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './SectionTitle.css';

interface SectionTitleProps {
  children: string;
  textureUrl?: string;
}

export function SectionTitle({ children, textureUrl }: SectionTitleProps) {
  return (
    <h2
      className={withTexture(
        'section-title section-title--banner',
        textureUrl,
        'textured-surface--section-header',
      )}
      style={textureStyle(textureUrl)}
    >
      <span className="section-title__label">{children}</span>
    </h2>
  );
}
