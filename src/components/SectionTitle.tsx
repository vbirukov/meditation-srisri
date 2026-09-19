import { textureStyle, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './SectionTitle.css';

interface SectionTitleProps {
  children: string;
  textureUrl?: string;
  /** Uppercase textured banner — use at most once per screen. */
  banner?: boolean;
}

export function SectionTitle({ children, textureUrl, banner = false }: SectionTitleProps) {
  if (!banner) {
    return <h2 className="section-heading">{children}</h2>;
  }

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
