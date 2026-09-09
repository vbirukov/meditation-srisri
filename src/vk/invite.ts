import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp } from '@/utils/vk';

/** Пригласить друзей в мини-приложение */
export async function showInviteBox(): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    await bridge.send('VKWebAppShowInviteBox');
    return true;
  } catch {
    return false;
  }
}
