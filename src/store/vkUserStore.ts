import { create } from 'zustand';
import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp } from '@/utils/vk';

export interface VkUserInfo {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface VkUserState {
  user: VkUserInfo | null;
  loaded: boolean;
  fetch: () => Promise<void>;
}

export const useVkUserStore = create<VkUserState>((set, get) => ({
  user: null,
  loaded: false,

  fetch: async () => {
    if (!isVkMiniApp() || get().loaded) return;
    try {
      const data = await bridge.send('VKWebAppGetUserInfo');
      set({
        loaded: true,
        user: {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          photoUrl: data.photo_200,
        },
      });
    } catch {
      set({ loaded: true, user: null });
    }
  },
}));
