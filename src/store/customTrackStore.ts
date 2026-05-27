import { create } from 'zustand';
import {
  deleteCustomTrack,
  getCustomTrack,
  saveCustomTrack,
  type StoredCustomTrack,
} from '@/storage/customTrackDb';
import { MAX_CUSTOM_TRACK_BYTES, probeAudioDuration } from '@/utils/audioMeta';

export interface CustomTrackMeta {
  name: string;
  mimeType: string;
  durationSeconds: number;
  objectUrl: string;
  addedAt: number;
}

interface CustomTrackStore {
  track: CustomTrackMeta | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  init: () => Promise<void>;
  upload: (file: File) => Promise<void>;
  remove: () => Promise<void>;
  clearError: () => void;
}

function revokeUrl(url: string | undefined) {
  if (url) URL.revokeObjectURL(url);
}

function toMeta(stored: StoredCustomTrack): CustomTrackMeta {
  return {
    name: stored.name,
    mimeType: stored.mimeType,
    durationSeconds: stored.durationSeconds,
    objectUrl: URL.createObjectURL(stored.blob),
    addedAt: stored.addedAt,
  };
}

export const useCustomTrackStore = create<CustomTrackStore>((set, get) => ({
  track: null,
  loading: false,
  error: null,
  hydrated: false,

  init: async () => {
    if (get().hydrated) return;
    set({ loading: true, error: null });
    try {
      const stored = await getCustomTrack();
      set({
        track: stored ? toMeta(stored) : null,
        hydrated: true,
        loading: false,
      });
    } catch {
      set({ hydrated: true, loading: false, error: 'load_failed' });
    }
  },

  upload: async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      set({ error: 'invalid_type' });
      return;
    }
    if (file.size > MAX_CUSTOM_TRACK_BYTES) {
      set({ error: 'too_large' });
      return;
    }

    set({ loading: true, error: null });
    try {
      let durationSeconds = 0;
      try {
        durationSeconds = await probeAudioDuration(file);
      } catch {
        durationSeconds = 0;
      }

      const stored: StoredCustomTrack = {
        name: file.name,
        mimeType: file.type || 'audio/mpeg',
        durationSeconds,
        blob: file,
        addedAt: Date.now(),
      };

      await saveCustomTrack(stored);

      const prev = get().track;
      revokeUrl(prev?.objectUrl);

      set({ track: toMeta(stored), loading: false });
    } catch {
      set({ loading: false, error: 'save_failed' });
    }
  },

  remove: async () => {
    set({ loading: true, error: null });
    try {
      await deleteCustomTrack();
      const prev = get().track;
      revokeUrl(prev?.objectUrl);
      set({ track: null, loading: false });
    } catch {
      set({ loading: false, error: 'delete_failed' });
    }
  },

  clearError: () => set({ error: null }),
}));
