import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SplashScreen } from '@/screens/SplashScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { PracticeHubScreen } from '@/screens/PracticeHubScreen';
import { PickerScreen } from '@/screens/PickerScreen';
import { SessionScreen } from '@/screens/SessionScreen';
import { EndScreen } from '@/screens/EndScreen';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useCustomTrackStore } from '@/store/customTrackStore';
import { useVkUserStore } from '@/store/vkUserStore';
import { isVkMiniApp } from '@/utils/vk';
import { assertPickNewerWorks, startPracticeStatsVkSync } from '@/vk/statsSync';
import { startRecentPracticeVkSync } from '@/vk/recentSync';

export function App() {
  useEffect(() => {
    useCustomTrackStore.getState().init();
  }, []);

  useEffect(() => {
    if (!isVkMiniApp()) return;
    try {
      assertPickNewerWorks();
    } catch {
      /* ignore self-check in prod */
    }
    void useVkUserStore.getState().fetch();
    const stopStats = startPracticeStatsVkSync();
    const stopRecent = startRecentPracticeVkSync();
    return () => {
      stopStats();
      stopRecent();
    };
  }, []);

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/practice" element={<PracticeHubScreen />} />
        <Route path="/picker" element={<PickerScreen />} />
        <Route path="/session" element={<SessionScreen />} />
        <Route path="/end" element={<EndScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isVkMiniApp() && <InstallPrompt />}
    </div>
  );
}
