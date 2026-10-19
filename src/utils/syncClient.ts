import {
  SiteSettings,
  MealPlan,
  MealItem,
  MemberAccount,
  MealRedemption,
  MealDeletionRefundRecord,
} from '../types';

export interface SyncStorePayload {
  siteSettings?: SiteSettings;
  packages?: MealPlan[];
  menuItems?: MealItem[];
  members?: MemberAccount[];
  redemptions?: MealRedemption[];
  refundRecords?: MealDeletionRefundRecord[];
  adminCredentials?: { username: string; password: string };
  forceBroadcast?: boolean;
  updatedAt?: string;
  hasCustomUpdates?: boolean;
}

export const SYNC_CLIENT_ID = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('chillhealthy_sync_channel');
  }
} catch {
  broadcastChannel = null;
}

/**
 * Push partial or full Back Office / Store updates to the server and broadcast across all tabs & devices
 */
export async function pushSyncToServer(payload: SyncStorePayload): Promise<SyncStorePayload | null> {
  // 1. Broadcast immediately over BroadcastChannel for instant same-browser multi-tab sync
  try {
    broadcastChannel?.postMessage({
      type: 'SYNC_UPDATE',
      sourceClientId: SYNC_CLIENT_ID,
      store: payload,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // ignore BroadcastChannel errors
  }

  // 2. Persist & broadcast via backend server (/api/sync) to all mobile, tablet, and website devices
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        sourceClientId: SYNC_CLIENT_ID,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.store || null;
  } catch {
    return null;
  }
}

/**
 * Fetch the latest authoritative store from the server
 */
export async function fetchSyncFromServer(): Promise<SyncStorePayload | null> {
  try {
    const response = await fetch(`/api/sync?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!response.ok) return null;
    const store: SyncStorePayload = await response.json();
    return store;
  } catch {
    return null;
  }
}

/**
 * Subscribe to real-time updates via Server-Sent Events (SSE), BroadcastChannel, and visibility focus
 */
export function subscribeToRealtimeSync(
  onReceiveStore: (store: SyncStorePayload, isInitial?: boolean) => void
): () => void {
  let eventSource: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isDisposed = false;

  const connectSSE = () => {
    if (isDisposed || typeof window === 'undefined' || !('EventSource' in window)) return;
    try {
      eventSource = new EventSource('/api/sync/stream');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (!parsed || !parsed.store) return;
          if (parsed.sourceClientId && parsed.sourceClientId === SYNC_CLIENT_ID) {
            return;
          }
          onReceiveStore(parsed.store, parsed.type === 'INITIAL_STATE');
        } catch {
          // ignore malformed event
        }
      };
      eventSource.onerror = () => {
        try {
          eventSource?.close();
        } catch {}
        eventSource = null;
        if (!isDisposed) {
          reconnectTimer = setTimeout(connectSSE, 3000);
        }
      };
    } catch {
      // ignore SSE error
    }
  };

  connectSSE();

  // Listen to BroadcastChannel for instant cross-tab sync
  const handleBroadcastMessage = (event: MessageEvent) => {
    const data = event.data;
    if (data && data.type === 'SYNC_UPDATE' && data.sourceClientId !== SYNC_CLIENT_ID && data.store) {
      onReceiveStore(data.store, false);
    }
  };
  broadcastChannel?.addEventListener('message', handleBroadcastMessage);

  // Sync whenever tablet/mobile/website tab becomes visible or regains focus
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      fetchSyncFromServer().then((store) => {
        if (store && store.hasCustomUpdates) {
          onReceiveStore(store, false);
        }
      });
    }
  };
  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // Periodic background poll every 8 seconds as fallback for restrictive mobile/tablet proxies
  const pollInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchSyncFromServer().then((store) => {
        if (store && store.hasCustomUpdates) {
          onReceiveStore(store, false);
        }
      });
    }
  }, 8000);

  return () => {
    isDisposed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    clearInterval(pollInterval);
    try {
      eventSource?.close();
    } catch {}
    broadcastChannel?.removeEventListener('message', handleBroadcastMessage);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
  };
}

export const pushSyncStore = pushSyncToServer;
export const fetchSyncStore = fetchSyncFromServer;
export const subscribeToRealTimeSync = subscribeToRealtimeSync;

