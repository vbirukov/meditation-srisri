import { useCallback, useEffect, useState } from 'react';
import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';
import type { CustomPractice, Meditation, SadhanaCatalog, SadhanaPractice } from '@/types';
import { useOnline } from '@/hooks/useOnline';
import {
  isCustomPracticeOfflineReady,
  isMeditationOfflineReady,
  isSadhanaOfflineReady,
} from '@/utils/offlineMedia';

const meditations = meditationsData as Meditation[];
const sadhanaCatalog = sadhanaData as unknown as SadhanaCatalog;
const sadhanas = (sadhanaCatalog.practices ?? []) as SadhanaPractice[];
const sadhanaBlocks = sadhanaCatalog.blocks ?? [];

export function useOfflineCatalog(customPractices: readonly CustomPractice[]) {
  const online = useOnline();
  const [meditationIds, setMeditationIds] = useState<Set<string>>(() => new Set());
  const [sadhanaIds, setSadhanaIds] = useState<Set<string>>(() => new Set());
  const [customIds, setCustomIds] = useState<Set<string>>(() => new Set());
  const [scanning, setScanning] = useState(true);

  const refresh = useCallback(async () => {
    setScanning(true);
    const med = new Set<string>();
    const sadh = new Set<string>();
    const custom = new Set<string>();

    await Promise.all(
      meditations.map(async (m) => {
        if (m.isOfflinePrecached && (await isMeditationOfflineReady(m))) {
          med.add(m.id);
        }
      }),
    );

    await Promise.all(
      sadhanas.map(async (p) => {
        if (await isSadhanaOfflineReady(p, sadhanaBlocks)) sadh.add(p.id);
      }),
    );

    const saved = customPractices.filter((p) => p.isDraft !== true && p.steps.length > 0);
    await Promise.all(
      saved.map(async (p) => {
        if (await isCustomPracticeOfflineReady(p, sadhanaBlocks)) custom.add(p.id);
      }),
    );

    setMeditationIds(med);
    setSadhanaIds(sadh);
    setCustomIds(custom);
    setScanning(false);
  }, [customPractices]);

  useEffect(() => {
    void refresh();
  }, [online, refresh]);

  const isMeditationAvailable = useCallback(
    (id: string) => online || meditationIds.has(id),
    [online, meditationIds],
  );

  const isSadhanaAvailable = useCallback(
    (id: string) => online || sadhanaIds.has(id),
    [online, sadhanaIds],
  );

  const isCustomPracticeAvailable = useCallback(
    (id: string) => online || customIds.has(id),
    [online, customIds],
  );

  return {
    online,
    scanning,
    meditationIds,
    sadhanaIds,
    customIds,
    refresh,
    isMeditationAvailable,
    isSadhanaAvailable,
    isCustomPracticeAvailable,
  };
}
