import { textureStyle } from '@/utils/textures';

interface CardCornerTextureProps {
  url: string;
  warm?: boolean;
}

export function CardCornerTexture({ url, warm = false }: CardCornerTextureProps) {
  return (
    <>
      <span
        className="texture-layer texture-layer--corner-image"
        style={textureStyle(url)}
        aria-hidden
      />
      <span
        className={`texture-layer texture-layer--corner-scrim${warm ? ' texture-layer--corner-scrim--warm' : ''}`}
        aria-hidden
      />
    </>
  );
}
