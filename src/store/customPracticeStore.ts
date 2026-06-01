import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomPractice, CustomPracticeStep, SadhanaBlock } from '@/types';
import { createEmptyPractice, createStepFromBlock, newInstanceId } from '@/utils/customPractice';

interface CustomPracticeState {
  practices: CustomPractice[];
  editingId: string | null;
  getEditing: () => CustomPractice | null;
  startNew: () => string;
  loadForEdit: (id: string) => void;
  updateEditing: (patch: Partial<Pick<CustomPractice, 'title' | 'description' | 'steps'>>) => void;
  saveEditing: () => string | null;
  removePractice: (id: string) => void;
  duplicatePractice: (id: string) => string;
  addBlock: (block: SadhanaBlock) => void;
  updateStep: (instanceId: string, patch: Partial<CustomPracticeStep>) => void;
  removeStep: (instanceId: string) => void;
  moveStep: (instanceId: string, direction: -1 | 1) => void;
  duplicateStep: (instanceId: string) => void;
}

function findPractice(practices: CustomPractice[], id: string | null): CustomPractice | null {
  if (!id) return null;
  return practices.find((p) => p.id === id) ?? null;
}

export const useCustomPracticeStore = create(
  persist<CustomPracticeState>(
    (set, get) => ({
      practices: [],
      editingId: null,

      getEditing: () => findPractice(get().practices, get().editingId),

      startNew: () => {
        const practice = createEmptyPractice();
        set((s) => ({
          practices: [...s.practices, practice],
          editingId: practice.id,
        }));
        return practice.id;
      },

      loadForEdit: (id) => {
        if (!findPractice(get().practices, id)) return;
        set({ editingId: id });
      },

      updateEditing: (patch) => {
        const { editingId, practices } = get();
        if (!editingId) return;
        set({
          practices: practices.map((p) =>
            p.id === editingId ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        });
      },

      saveEditing: () => {
        const practice = get().getEditing();
        if (!practice || practice.steps.length === 0) return null;
        const title =
          practice.title.trim() ||
          practice.steps[0]?.blockId ||
          'Практика';
        if (title !== practice.title) {
          get().updateEditing({ title });
        }
        return practice.id;
      },

      removePractice: (id) => {
        set((s) => ({
          practices: s.practices.filter((p) => p.id !== id),
          editingId: s.editingId === id ? null : s.editingId,
        }));
      },

      duplicatePractice: (id) => {
        const source = findPractice(get().practices, id);
        if (!source) return '';
        const copy: CustomPractice = {
          ...source,
          id: newInstanceId(),
          title: `${source.title} (копия)`,
          steps: source.steps.map((st) => ({ ...st, instanceId: newInstanceId() })),
          updatedAt: Date.now(),
        };
        set((s) => ({
          practices: [...s.practices, copy],
          editingId: copy.id,
        }));
        return copy.id;
      },

      addBlock: (block) => {
        const { editingId, practices } = get();
        let id = editingId;
        if (!id) {
          id = get().startNew();
        }
        const step = createStepFromBlock(block);
        set({
          practices: practices.map((p) =>
            p.id === id
              ? { ...p, steps: [...p.steps, step], updatedAt: Date.now() }
              : p,
          ),
        });
      },

      updateStep: (instanceId, patch) => {
        const { editingId, practices } = get();
        if (!editingId) return;
        set({
          practices: practices.map((p) =>
            p.id !== editingId
              ? p
              : {
                  ...p,
                  steps: p.steps.map((st) =>
                    st.instanceId === instanceId ? { ...st, ...patch } : st,
                  ),
                  updatedAt: Date.now(),
                },
          ),
        });
      },

      removeStep: (instanceId) => {
        const { editingId, practices } = get();
        if (!editingId) return;
        set({
          practices: practices.map((p) =>
            p.id !== editingId
              ? p
              : {
                  ...p,
                  steps: p.steps.filter((st) => st.instanceId !== instanceId),
                  updatedAt: Date.now(),
                },
          ),
        });
      },

      moveStep: (instanceId, direction) => {
        const { editingId, practices } = get();
        if (!editingId) return;
        set({
          practices: practices.map((p) => {
            if (p.id !== editingId) return p;
            const idx = p.steps.findIndex((st) => st.instanceId === instanceId);
            const next = idx + direction;
            if (idx < 0 || next < 0 || next >= p.steps.length) return p;
            const steps = [...p.steps];
            [steps[idx], steps[next]] = [steps[next], steps[idx]];
            return { ...p, steps, updatedAt: Date.now() };
          }),
        });
      },

      duplicateStep: (instanceId) => {
        const { editingId, practices } = get();
        if (!editingId) return;
        set({
          practices: practices.map((p) => {
            if (p.id !== editingId) return p;
            const idx = p.steps.findIndex((st) => st.instanceId === instanceId);
            if (idx < 0) return p;
            const copy = { ...p.steps[idx], instanceId: newInstanceId() };
            const steps = [...p.steps];
            steps.splice(idx + 1, 0, copy);
            return { ...p, steps, updatedAt: Date.now() };
          }),
        });
      },
    }),
    { name: 'meditate-custom-practices' },
  ),
);
