import { useCallback, useEffect, useState } from 'react';
import {
  readSadhanaDebugFromSearch,
  readSadhanaDebugFromStorage,
  setSadhanaDebugInStorage,
} from '@/utils/sadhanaDebug';

export function useSadhanaDebug(searchParams: URLSearchParams) {
  const [debugMode, setDebugModeState] = useState(
    () => readSadhanaDebugFromStorage() || readSadhanaDebugFromSearch(searchParams),
  );

  useEffect(() => {
    if (readSadhanaDebugFromSearch(searchParams)) {
      setSadhanaDebugInStorage(true);
      setDebugModeState(true);
    }
  }, [searchParams]);

  const setDebugMode = useCallback((enabled: boolean) => {
    setSadhanaDebugInStorage(enabled);
    setDebugModeState(enabled);
  }, []);

  return { debugMode, setDebugMode };
}
