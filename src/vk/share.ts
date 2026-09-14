import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp, VK_APP_URL } from '@/utils/vk';
import { buildShareAppUrl, type PracticeDeepLink } from '@/utils/deepLink';

export type ShareParams = {
  locale: 'ru' | 'en';
  practiceTitle: string;
  durationLabel: string;
  streakDays: number;
  /** Formatted month total, e.g. "42 мин" / "42 min" */
  monthLabel?: string;
  deepLink?: PracticeDeepLink;
};

function appUrl(params: ShareParams): string {
  return params.deepLink ? buildShareAppUrl(params.deepLink) : VK_APP_URL;
}

/** Текст для поста на стену / шаринга со ссылкой. */
export function buildShareMessage(params: ShareParams): string {
  const { locale, practiceTitle, durationLabel, streakDays, monthLabel } = params;
  const url = appUrl(params);
  if (locale === 'en') {
    return [
      `I just meditated with Meditate with Sri Sri.`,
      `Practice: ${practiceTitle} (${durationLabel}).`,
      streakDays > 1 ? `Streak: ${streakDays} days.` : null,
      monthLabel ? `This month: ${monthLabel}.` : null,
      `Try it too: ${url}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `Я только что помедитировал(а) с помощью приложения «Медитация с Шри Шри».`,
    `Практика: ${practiceTitle} (${durationLabel}).`,
    streakDays > 1 ? `Серия: ${streakDays} дн.` : null,
    monthLabel ? `В этом месяце: ${monthLabel}.` : null,
    `Попробуй тоже: ${url}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Короткий текст для стикера в сторис (ссылка — через attachment). */
export function buildStoryText(params: ShareParams): string {
  const { locale, practiceTitle, durationLabel, streakDays, monthLabel } = params;
  if (locale === 'en') {
    return [
      `I just meditated with`,
      `Meditate with Sri Sri`,
      `${practiceTitle} · ${durationLabel}`,
      streakDays > 1 ? `Streak: ${streakDays} days` : null,
      monthLabel ? `This month: ${monthLabel}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `Я только что помедитировал(а)`,
    `с помощью «Медитация с Шри Шри»`,
    `${practiceTitle} · ${durationLabel}`,
    streakDays > 1 ? `Серия: ${streakDays} дн.` : null,
    monthLabel ? `Месяц: ${monthLabel}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Фон сторис: ротация подов по streak/режиму, не один welcome1. */
export function pickStoryBackground(opts: {
  streakDays: number;
  mode?: string | null;
}): string {
  if (opts.mode === 'sadhana') return '/media/posters/session.jpg';
  if (opts.streakDays >= 7) return '/media/posters/welcome3.jpg';
  if (opts.streakDays >= 3) return '/media/posters/welcome5.jpg';
  return '/media/posters/welcome1.jpg';
}

export async function shareToWall(
  message: string,
  attachmentUrl: string = VK_APP_URL,
): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShowWallPostBox', {
      message,
      attachments: attachmentUrl,
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareToStory(
  backgroundUrl: string,
  text: string,
  attachmentUrl: string = VK_APP_URL,
): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShowStoryBox', {
      background_type: 'image',
      url: backgroundUrl,
      attachment: {
        text: 'open',
        type: 'url',
        url: attachmentUrl,
      },
      stickers: [
        {
          sticker_type: 'native',
          sticker: {
            action_type: 'text',
            action: {
              text,
              style: 'classic',
              background_style: 'solid',
              selection_color: '#FFFFFF',
              alignment: 'center',
            },
            transform: {
              gravity: 'center_top',
              translation_y: 0.18,
            },
          },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareLink(
  message?: string,
  linkUrl: string = VK_APP_URL,
): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShare', { link: linkUrl });
    return true;
  } catch {
    return shareToWall(message ?? `Медитация с Шри Шри — ${linkUrl}`, linkUrl);
  }
}
