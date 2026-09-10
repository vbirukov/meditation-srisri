export function shouldUseStaticBackground(): boolean {
  if (typeof navigator === 'undefined') return false;

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) {
    return true;
  }
  return false;
}

export type VideoRendition = 480 | 720;

/** Выбор высоты рендишна. Файлы: foo.mp4 → foo.720p.mp4 / foo.480p.mp4 */
export function preferredVideoHeight(): VideoRendition {
  if (typeof navigator === 'undefined') return 720;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (conn?.saveData) return 480;
  if (conn?.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) {
    return 480;
  }
  return 720;
}

export function videoRenditionUrl(src: string, height: VideoRendition = preferredVideoHeight()): string {
  if (!/\.mp4$/i.test(src)) return src;
  if (/\.\d{3,4}p\.mp4$/i.test(src)) return src;
  return src.replace(/\.mp4$/i, `.${height}p.mp4`);
}
