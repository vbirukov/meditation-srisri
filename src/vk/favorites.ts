import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp } from '@/utils/vk';

/** Показать предложение после N завершённых сессий */
export const FAVORITES_AFTER_SESSIONS = 2;

interface VkFavoritesState {
  asked: boolean;
  added: boolean;
  markAsked: () => void;
  markAdded: () => void;
}

export const useVkFavoritesStore = create(
  persist<VkFavoritesState>(
    (set) => ({
      asked: false,
      added: false,
      markAsked: () => set({ asked: true }),
      markAdded: () => set({ asked: true, added: true }),
    }),
    { name: 'meditate-vk-favorites' },
  ),
);

export function shouldOfferFavorites(totalSessions: number): boolean {
  if (!isVkMiniApp()) return false;
  const { asked, added } = useVkFavoritesStore.getState();
  if (asked || added) return false;
  return totalSessions >= FAVORITES_AFTER_SESSIONS;
}

export async function addAppToFavorites(): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  try {
    const data = await bridge.send('VKWebAppAddToFavorites');
    const ok = Boolean(data?.result);
    if (ok) useVkFavoritesStore.getState().markAdded();
    else useVkFavoritesStore.getState().markAsked();
    return ok;
  } catch {
    useVkFavoritesStore.getState().markAsked();
    return false;
  }
}
