import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp, VK_APP_URL } from '@/utils/vk';

export function buildShareMessage(params: {
  locale: 'ru' | 'en';
  practiceTitle: string;
  durationLabel: string;
  streakDays: number;
}): string {
  const { locale, practiceTitle, durationLabel, streakDays } = params;
  if (locale === 'en') {
    return [
      `I finished a practice: ${practiceTitle} (${durationLabel}).`,
      streakDays > 1 ? `Streak: ${streakDays} days.` : null,
      `Meditate with Sri Sri — ${VK_APP_URL}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `Завершил(а) практику: ${practiceTitle} (${durationLabel}).`,
    streakDays > 1 ? `Серия: ${streakDays} дн.` : null,
    `Медитация с Шри Шри — ${VK_APP_URL}`,
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

export async function shareToStory(backgroundUrl: string): Promise<boolean> {
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
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareLink(): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShare', { link: VK_APP_URL });
    return true;
  } catch {
    return shareToWall(VK_APP_URL);
  }
}
