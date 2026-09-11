import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp, VK_APP_URL } from '@/utils/vk';

type ShareParams = {
  locale: 'ru' | 'en';
  practiceTitle: string;
  durationLabel: string;
  streakDays: number;
};

/** Текст для поста на стену / шаринга со ссылкой. */
export function buildShareMessage(params: ShareParams): string {
  const { locale, practiceTitle, durationLabel, streakDays } = params;
  if (locale === 'en') {
    return [
      `I just meditated with Meditate with Sri Sri.`,
      `Practice: ${practiceTitle} (${durationLabel}).`,
      streakDays > 1 ? `Streak: ${streakDays} days.` : null,
      `Try it too: ${VK_APP_URL}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `Я только что помедитировал(а) с помощью приложения «Медитация с Шри Шри».`,
    `Практика: ${practiceTitle} (${durationLabel}).`,
    streakDays > 1 ? `Серия: ${streakDays} дн.` : null,
    `Попробуй тоже: ${VK_APP_URL}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Короткий текст для стикера в сторис (ссылка — через attachment). */
export function buildStoryText(params: ShareParams): string {
  const { locale, practiceTitle, durationLabel, streakDays } = params;
  if (locale === 'en') {
    return [
      `I just meditated with`,
      `Meditate with Sri Sri`,
      `${practiceTitle} · ${durationLabel}`,
      streakDays > 1 ? `Streak: ${streakDays} days` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `Я только что помедитировал(а)`,
    `с помощью «Медитация с Шри Шри»`,
    `${practiceTitle} · ${durationLabel}`,
    streakDays > 1 ? `Серия: ${streakDays} дн.` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function shareToWall(message: string): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShowWallPostBox', {
      message,
      attachments: VK_APP_URL,
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareToStory(
  backgroundUrl: string,
  text: string,
): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShowStoryBox', {
      background_type: 'image',
      url: backgroundUrl,
      attachment: {
        text: 'open',
        type: 'url',
        url: VK_APP_URL,
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

export async function shareLink(message?: string): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShare', { link: VK_APP_URL });
    return true;
  } catch {
    return shareToWall(message ?? `Медитация с Шри Шри — ${VK_APP_URL}`);
  }
}
