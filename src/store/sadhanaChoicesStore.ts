import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SadhanaChoicesStore {
  /** practiceId → slotIndex → выбранный blockId */
  choices: Record<string, Record<number, string>>;
  setChoice: (practiceId: string, slotIndex: number, blockId: string) => void;
  getChoices: (practiceId: string) => Record<number, string>;
  clearPractice: (practiceId: string) => void;
}

export const useSadhanaChoicesStore = create(
  persist<SadhanaChoicesStore>(
    (set, get) => ({
      choices: {},

      setChoice: (practiceId, slotIndex, blockId) =>
        set((state) => ({
          choices: {
            ...state.choices,
            [practiceId]: { ...state.choices[practiceId], [slotIndex]: blockId },
          },
        })),

      getChoices: (practiceId) => get().choices[practiceId] ?? {},

      clearPractice: (practiceId) =>
        set((state) => {
          const next = { ...state.choices };
          delete next[practiceId];
          return { choices: next };
        }),
    }),
    {
      name: 'meditate-sadhana-choices',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ choices: state.choices }) as SadhanaChoicesStore,
    },
  ),
);
