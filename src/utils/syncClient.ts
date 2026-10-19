import {
  SiteSettings,
  MealPlan,
  MealItem,
  MemberAccount,
  MealRedemption,
  MealDeletionRefundRecord,
} from '../types';
import { normalizeMalaysianPhone } from './malaysiaPhone';

export interface SyncStorePayload {
  siteSettings?: SiteSettings;
  packages?: MealPlan[];
  menuItems?: MealItem[];
  members?: MemberAccount[];
  redemptions?: MealRedemption[];
  refundRecords?: MealDeletionRefundRecord[];
  adminCredentials?: { username: string; password: string };
  deletedMemberId?: string;
  deletedRedemptionId?: string;
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
 * Returns a canonical key for deduplicating & merging MemberAccount records across devices.
 * Prioritizes normalized Malaysian handphone number so accounts created with 012-xxx, +6012xxx, or 012xxx unify cleanly.
 */
export function getMemberCanonicalKey(member: Partial<MemberAccount> | null | undefined): string {
  if (!member) return '';
  const normPhone = normalizeMalaysianPhone(member.phone || member.memberNumber || '');
  if (normPhone && normPhone.length >= 9) {
    return normPhone;
  }
  const rawDigits = (member.phone || member.memberNumber || '').replace(/\D/g, '');
  if (rawDigits.length >= 8) {
    return rawDigits;
  }
  return (member.id || member.email || '').trim().toLowerCase();
}

/**
 * Checks whether a MemberAccount matches a login identifier (phone in any format, memberNumber, id, or email).
 */
export function doesMemberMatchLoginInput(member: MemberAccount, rawInput: string): boolean {
  if (!member || !rawInput) return false;
  const cleanInput = rawInput.trim();
  if (!cleanInput) return false;

  // 1. Check email match
  const mEmail = (member.email || '').toLowerCase().trim();
  if (mEmail && cleanInput.toLowerCase() === mEmail) {
    return true;
  }

  // 2. Check exact ID or Member Number string match
  if (
    (member.id && member.id.toLowerCase() === cleanInput.toLowerCase()) ||
    (member.memberNumber && member.memberNumber.toLowerCase() === cleanInput.toLowerCase())
  ) {
    return true;
  }

  // 3. Check normalized Malaysian phone match (handles +6012..., 6012..., 012-..., 12...)
  const inputNorm = normalizeMalaysianPhone(cleanInput);
  const memberPhoneNorm = normalizeMalaysianPhone(member.phone || '');
  const memberNumNorm = normalizeMalaysianPhone(member.memberNumber || '');
  const memberIdNorm = normalizeMalaysianPhone(member.id || '');

  if (inputNorm.length >= 9) {
    if (
      inputNorm === memberPhoneNorm ||
      inputNorm === memberNumNorm ||
      inputNorm === memberIdNorm
    ) {
      return true;
    }
  }

  // 4. Fallback: compare last 8 digits of phone number for flexible formatting across devices
  const inputDigits = cleanInput.replace(/\D/g, '');
  const mPhoneDigits = (member.phone || '').replace(/\D/g, '');
  const mNumDigits = (member.memberNumber || '').replace(/\D/g, '');

  if (inputDigits.length >= 8) {
    const inputTail = inputDigits.slice(-8);
    if (
      (mPhoneDigits.length >= 8 && mPhoneDigits.slice(-8) === inputTail) ||
      (mNumDigits.length >= 8 && mNumDigits.slice(-8) === inputTail)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Merges two MemberAccount objects representing the same customer, preserving active packages,
 * credit history, official receipts, addresses, and custom passwords.
 */
export function mergeSingleMember(existing: MemberAccount, incoming: MemberAccount): MemberAccount {
  const mergedCreditsMap = new Map<string, MemberAccount['creditsHistory'][0]>();
  for (const c of [...(incoming.creditsHistory || []), ...(existing.creditsHistory || [])]) {
    if (c && c.id) {
      mergedCreditsMap.set(c.id, c);
    }
  }

  const mergedReceiptsMap = new Map<string, NonNullable<MemberAccount['officialReceipts']>[0]>();
  for (const r of [...(incoming.officialReceipts || []), ...(existing.officialReceipts || [])]) {
    if (r && (r.id || r.receiptNumber)) {
      mergedReceiptsMap.set(r.id || r.receiptNumber, r);
    }
  }

  // Prefer incoming activePackage if present; if incoming has null but existing has an activePackage, keep existing unless incoming explicitly burned it
  const resolvedActivePackage =
    incoming.activePackage !== undefined && incoming.activePackage !== null
      ? incoming.activePackage
      : existing.activePackage || null;

  return {
    ...existing,
    ...incoming,
    id: existing.id || incoming.id,
    memberNumber: incoming.memberNumber || existing.memberNumber || normalizeMalaysianPhone(incoming.phone || existing.phone),
    phone: normalizeMalaysianPhone(incoming.phone || existing.phone) || incoming.phone || existing.phone,
    password:
      incoming.password && incoming.password !== '123456'
        ? incoming.password
        : existing.password || incoming.password || '123456',
    address: incoming.address || existing.address || '',
    area: incoming.area || existing.area || '',
    postalCode: incoming.postalCode || existing.postalCode || '',
    address2: incoming.address2 || existing.address2,
    area2: incoming.area2 || existing.area2,
    postalCode2: incoming.postalCode2 || existing.postalCode2,
    activePackage: resolvedActivePackage,
    creditsHistory: Array.from(mergedCreditsMap.values()),
    officialReceipts:
      mergedReceiptsMap.size > 0 ? Array.from(mergedReceiptsMap.values()) : existing.officialReceipts,
  };
}

/**
 * Merges local and remote MemberAccount arrays without losing any registered accounts on either device.
 */
export function mergeMembersLists(
  localMembers: MemberAccount[],
  remoteMembers: MemberAccount[],
  currentMember?: MemberAccount | null,
  deletedMemberId?: string
): MemberAccount[] {
  const deletedKey = deletedMemberId ? getMemberCanonicalKey({ id: deletedMemberId, phone: deletedMemberId }) : '';
  const map = new Map<string, MemberAccount>();

  // 1. Seed with local members first
  for (const m of localMembers || []) {
    if (!m) continue;
    const key = getMemberCanonicalKey(m);
    if (!key) continue;
    if (deletedMemberId && (m.id === deletedMemberId || key === deletedKey)) continue;
    map.set(key, m);
  }

  // 2. Merge remote members on top (remote updates win for shared fields while preserving local-only accounts)
  for (const m of remoteMembers || []) {
    if (!m) continue;
    const key = getMemberCanonicalKey(m);
    if (!key) continue;
    if (deletedMemberId && (m.id === deletedMemberId || key === deletedKey)) continue;
    const existing = map.get(key);
    if (existing) {
      map.set(key, mergeSingleMember(existing, m));
    } else {
      map.set(key, m);
    }
  }

  // 3. Ensure active logged-in member on this device is also present unless explicitly deleted
  if (currentMember) {
    const curKey = getMemberCanonicalKey(currentMember);
    if (curKey && (!deletedMemberId || (currentMember.id !== deletedMemberId && curKey !== deletedKey))) {
      const existing = map.get(curKey);
      if (existing) {
        map.set(curKey, mergeSingleMember( currentMember, existing));
      } else {
        map.set(curKey, currentMember);
      }
    }
  }

  return Array.from(map.values());
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
        if (store) {
          onReceiveStore(store, false);
        }
      });
    }
  };
  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // Periodic background poll every 6 seconds as fallback for restrictive mobile/tablet proxies
  const pollInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchSyncFromServer().then((store) => {
        if (store) {
          onReceiveStore(store, false);
        }
      });
    }
  }, 6000);

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
