import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/types';
import en from './en.json';
import ru from './ru.json';

const dictionaries = { en, ru } as const;

type Dictionary = typeof en;

export const useLocaleStore = create(
  persist<{ locale: Locale; setLocale: (l: Locale) => void }>(
    (set) => ({
      locale: 'ru',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'meditate-locale' },
  ),
);

function get(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : path;
}

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const dict = dictionaries[locale] as Dictionary;
  return (key: string) => get(dict as unknown as Record<string, unknown>, key);
}
