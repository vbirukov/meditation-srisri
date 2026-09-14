import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp } from '@/utils/vk';

/** После первой завершённой сессии — не раньше. */
export const NOTIFICATIONS_AFTER_SESSIONS = 1;

interface VkNotificationsState {
  asked: boolean;
  allowed: boolean;
  markAsked: () => void;
  markAllowed: () => void;
}

export const useVkNotificationsStore = create(
  persist<VkNotificationsState>(
    (set) => ({
      asked: false,
      allowed: false,
      markAsked: () => set({ asked: true }),
      markAllowed: () => set({ asked: true, allowed: true }),
    }),
    { name: 'meditate-vk-notifications' },
  ),
);

export function vkNotificationsAlreadyEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('vk_are_notifications_enabled') === '1';
  } catch {
    return false;
  }
}

export function shouldOfferNotifications(totalSessions: number): boolean {
  if (!isVkMiniApp()) return false;
  if (vkNotificationsAlreadyEnabled()) {
    const s = useVkNotificationsStore.getState();
    if (!s.allowed) s.markAllowed();
    return false;
  }
  const { asked, allowed } = useVkNotificationsStore.getState();
  if (asked || allowed) return false;
  return totalSessions >= NOTIFICATIONS_AFTER_SESSIONS;
}

/** VK bridge prompt. Returns true if user allowed. */
export async function allowVkNotifications(): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    const data = await bridge.send('VKWebAppAllowNotifications');
    const ok = Boolean(data?.result);
    if (ok) useVkNotificationsStore.getState().markAllowed();
    else useVkNotificationsStore.getState().markAsked();
    return ok;
  } catch {
    useVkNotificationsStore.getState().markAsked();
    return false;
  }
}
