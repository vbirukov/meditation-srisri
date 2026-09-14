import { isVkMiniApp } from '@/utils/vk';
import { resolveReminderClock, useOnboardingStore } from '@/store/onboardingStore';
import { usePracticeStatsStore } from '@/store/practiceStatsStore';
import { useVkUserStore } from '@/store/vkUserStore';
import {
  useVkNotificationsStore,
  vkNotificationsAlreadyEnabled,
} from '@/vk/notifications';

function launchQuery(): string {
  if (typeof window === 'undefined') return '';
  return window.location.search || '';
}

/** Upsert reminder row on the host. Fail-open — never block UX. */
export async function registerVkReminder(opts?: {
  enabled?: boolean;
  lastSessionAt?: string | null;
}): Promise<boolean> {
  if (!isVkMiniApp()) return false;

  const allowed =
    useVkNotificationsStore.getState().allowed || vkNotificationsAlreadyEnabled();
  if (!allowed && opts?.enabled !== true) return false;

  const userId = useVkUserStore.getState().user?.id;
  const fromLaunch = Number(
    new URLSearchParams(launchQuery()).get('vk_user_id') || 0,
  );
  const vkUserId = userId || fromLaunch;
  if (!vkUserId) return false;

  const onboarding = useOnboardingStore.getState();
  const { hour, minute, slot } = resolveReminderClock(onboarding);
  const last =
    opts?.lastSessionAt ??
    (() => {
      const ts = usePracticeStatsStore.getState().lastSession?.completedAt;
      return ts ? new Date(ts).toISOString() : null;
    })();

  const body: Record<string, unknown> = {
    vk_user_id: vkUserId,
    launch: launchQuery(),
    enabled: opts?.enabled !== false,
    last_session_at: last,
    prefer_hour: hour,
    prefer_minute: minute,
  };
  if (slot) body.slot = slot;

  try {
    const res = await fetch('/notify-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
