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
  upsertMember?: MemberAccount;
  deletedMemberId?: string;
  deletedMemberIds?: string[];
  replaceMembers?: boolean;
  redemptions?: MealRedemption[];
  upsertRedemption?: MealRedemption;
  deletedRedemptionId?: string;
  deletedRedemptionIds?: string[];
  refundRecords?: MealDeletionRefundRecord[];
  adminCredentials?: { username: string; password: string };
  clearPaymentQr?: boolean;
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
 * Detects the legacy deleted demo accounts (Agnes Lim, Marcus Tan, uuu) that may still be cached in browser localStorage.
 * If a real customer later registers a fresh account (which stamps `registeredAt`), it will NOT be treated as legacy seed data.
 */
export function isLegacyDeletedSeedAccount(
  member: Partial<MemberAccount> | null | undefined
): boolean {
  if (!member) return true;

  const nameLower = (member.name || '').trim().toLowerCase();
  const emailLower = (member.email || '').trim().toLowerCase();
  const idLower = (member.id || '').trim().toLowerCase();
  const refUpper = (member.referralCode || '').trim().toUpperCase();
  const orderNo = member.activePackage?.signupOrderNo || '';

  // Always block the deleted demo seed account signatures
  if (
    idLower === 'mem-uuu-8587' ||
    nameLower === 'uuu' ||
    refUpper === 'CHILL-UUU8587' ||
    orderNo === 'CH-261007-6834' ||
    emailLower === 'marcus@fitkl.com' ||
    emailLower === 'member@chill-healthy.com' ||
    member.activePackage?.purchasedDate === '2026-09-01' ||
    member.activePackage?.purchasedDate === '2026-09-02'
  ) {
    return true;
  }

  // Any fresh account registered after 2026-10-19T06:50:00Z is a real live customer registration
  if (member.registeredAt) {
    const regMs = new Date(member.registeredAt).getTime();
    if (!Number.isNaN(regMs) && regMs >= new Date('2026-10-19T06:50:00.000Z').getTime()) {
      return false;
    }
  }

  if (
    nameLower === 'marcus tan' ||
    nameLower === 'marcus' ||
    refUpper === 'CHILL-MARCUS4556' ||
    member.id === '0123344556'
  ) {
    return true;
  }

  if (
    nameLower === 'agnes lim' ||
    refUpper === 'CHILL-AGNES9919' ||
    member.id === '0126189919'
  ) {
    return true;
  }

  return false;
}

/**
 * Detects legacy deleted demo redemptions (red-101, red-102, red-103, CH-261007-6834)
 */
export function isLegacyDeletedRedemption(
  redemption: Partial<MealRedemption> | null | undefined
): boolean {
  if (!redemption) return true;
  const id = (redemption.id || '').trim();
  const orderNo = (redemption.orderNumber || '').trim();
  const memberIdLower = (redemption.memberId || '').trim().toLowerCase();
  const memberNameLower = (redemption.memberName || '').trim().toLowerCase();

  if (
    id === 'red-101' ||
    id === 'red-102' ||
    id === 'red-103' ||
    id === 'CH-261007-6834' ||
    id === 'sub-0125698587' ||
    orderNo === 'CH-261007-6834' ||
    memberIdLower === 'mem-uuu-8587' ||
    memberNameLower === 'uuu' ||
    memberNameLower === 'marcus tan' ||
    memberNameLower === 'agnes lim'
  ) {
    return true;
  }

  return false;
}

/**
 * Filters out deleted redemptions and legacy demo redemptions (Agnes Lim, Marcus Tan, uuu)
 */
export function filterOutDeletedRedemptions(
  redemptions: MealRedemption[],
  deletedRedemptionIds?: string[],
  deletedMemberIds?: string[]
): MealRedemption[] {
  const delRedSet = new Set<string>(
    (deletedRedemptionIds || []).map((id) => (id || '').trim()).filter(Boolean)
  );
  const delMemSet = new Set<string>();
  for (const mId of deletedMemberIds || []) {
    if (!mId) continue;
    delMemSet.add(mId.trim().toLowerCase());
    const norm = normalizeMalaysianPhone(mId);
    if (norm) delMemSet.add(norm);
  }

  return (redemptions || []).filter((r) => {
    if (!r) return false;
    if (isLegacyDeletedRedemption(r)) return false;
    if (r.id && delRedSet.has(r.id.trim())) return false;
    if (r.orderNumber && delRedSet.has(r.orderNumber.trim())) return false;

    const rMemId = (r.memberId || '').trim().toLowerCase();
    const rPhoneNorm = normalizeMalaysianPhone(r.memberPhone || '');
    if (delMemSet.has(rMemId) || (rPhoneNorm && delMemSet.has(rPhoneNorm))) {
      return false;
    }
    return true;
  });
}

/**
 * Filters out deleted members and legacy seed accounts (Marcus Tan, Agnes Lim, uuu).
 */
export function filterOutDeletedMembers(
  members: MemberAccount[],
  deletedIds?: string[]
): MemberAccount[] {
  const deletedSet = new Set<string>();
  for (const id of deletedIds || []) {
    if (!id) continue;
    deletedSet.add(id.trim().toLowerCase());
    const norm = normalizeMalaysianPhone(id);
    if (norm) deletedSet.add(norm);
  }

  return (members || []).filter((m) => {
    if (!m) return false;
    if (isLegacyDeletedSeedAccount(m)) return false;
    const key = getMemberCanonicalKey(m);
    const idLower = (m.id || '').trim().toLowerCase();
    const phoneNorm = normalizeMalaysianPhone(m.phone || '');
    if (deletedSet.has(idLower) || (key && deletedSet.has(key)) || (phoneNorm && deletedSet.has(phoneNorm))) {
      return false;
    }
    return true;
  });
}

/**
 * Checks whether a MemberAccount matches a login identifier (Malaysian phone in any format, memberNumber, id, or email).
 */
export function doesMemberMatchLoginInput(member: MemberAccount, rawInput: string): boolean {
  if (!member || !rawInput) return false;
  if (isLegacyDeletedSeedAccount(member)) return false;

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

  // 4. Fallback: compare last 8 digits of phone number for flexible formatting across devices worldwide
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

  let resolvedActivePackage =
    incoming.activePackage !== undefined && incoming.activePackage !== null
      ? incoming.activePackage
      : existing.activePackage || null;

  if (existing.activePackage && incoming.activePackage) {
    const isSameOrder =
      (existing.activePackage.signupOrderNo &&
        existing.activePackage.signupOrderNo === incoming.activePackage.signupOrderNo) ||
      (existing.activePackage.planId === incoming.activePackage.planId &&
        existing.activePackage.purchasedDate === incoming.activePackage.purchasedDate);
    if (isSameOrder && (existing.activePackage.adminConfirmed || incoming.activePackage.adminConfirmed)) {
      resolvedActivePackage = {
        ...existing.activePackage,
        ...incoming.activePackage,
        adminConfirmed: true,
        adminConfirmedAt:
          incoming.activePackage.adminConfirmedAt || existing.activePackage.adminConfirmedAt,
      };
    }
  }

  return {
    ...existing,
    ...incoming,
    id: incoming.id || existing.id,
    memberNumber:
      incoming.memberNumber ||
      existing.memberNumber ||
      normalizeMalaysianPhone(incoming.phone || existing.phone),
    phone:
      normalizeMalaysianPhone(incoming.phone || existing.phone) ||
      incoming.phone ||
      existing.phone,
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
    registeredAt: incoming.registeredAt || existing.registeredAt || new Date().toISOString(),
    updatedAt: incoming.updatedAt || existing.updatedAt || new Date().toISOString(),
    activePackage: resolvedActivePackage,
    creditsHistory: Array.from(mergedCreditsMap.values()),
    officialReceipts:
      mergedReceiptsMap.size > 0 ? Array.from(mergedReceiptsMap.values()) : existing.officialReceipts,
  };
}

/**
 * Merges MemberAccount arrays while strictly respecting deletedMemberIds and stripping legacy deleted accounts.
 */
export function mergeMembersLists(
  baseMembers: MemberAccount[],
  incomingMembers: MemberAccount[],
  currentMember?: MemberAccount | null,
  deletedMemberIds?: string | string[]
): MemberAccount[] {
  const deletedList = Array.isArray(deletedMemberIds)
    ? deletedMemberIds
    : deletedMemberIds
    ? [deletedMemberIds]
    : [];

  const cleanBase = filterOutDeletedMembers(baseMembers || [], deletedList);
  const cleanIncoming = filterOutDeletedMembers(incomingMembers || [], deletedList);

  const map = new Map<string, MemberAccount>();

  for (const m of cleanBase) {
    const key = getMemberCanonicalKey(m);
    if (!key) continue;
    map.set(key, m);
  }

  for (const m of cleanIncoming) {
    const key = getMemberCanonicalKey(m);
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      map.set(key, mergeSingleMember(existing, m));
    } else {
      map.set(key, m);
    }
  }

  if (currentMember && !isLegacyDeletedSeedAccount(currentMember)) {
    const validCur = filterOutDeletedMembers([currentMember], deletedList);
    if (validCur.length > 0) {
      const curKey = getMemberCanonicalKey(currentMember);
      if (curKey) {
        const existing = map.get(curKey);
        if (existing) {
          map.set(curKey, mergeSingleMember(currentMember, existing));
        } else {
          map.set(curKey, currentMember);
        }
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Resolves all live and dev sync endpoints so registrations on any device (Shared Live URL ais-pre or Dev URL ais-dev)
 * synchronize instantaneously across all environments and devices worldwide.
 */
function getSyncEndpoints(): string[] {
  const endpoints = new Set<string>(['/api/sync']);
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      endpoints.add(`${origin.replace('ais-dev-', 'ais-pre-')}/api/sync`);
    } else if (origin.includes('ais-pre-')) {
      endpoints.add(`${origin.replace('ais-pre-', 'ais-dev-')}/api/sync`);
    }
  }
  return Array.from(endpoints);
}

/**
 * Merges multiple SyncStorePayload snapshots from local and peer live/dev servers into a single authoritative store.
 */
export function mergeSyncPayloads(stores: SyncStorePayload[]): SyncStorePayload | null {
  const validStores = stores.filter((s) => s && typeof s === 'object');
  if (validStores.length === 0) return null;
  if (validStores.length === 1) return validStores[0];

  // Sort by updatedAt ascending so newer store settings win
  validStores.sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tA - tB;
  });

  const combinedDeletedMemberIds = Array.from(
    new Set(
      validStores.flatMap((s) => [
        ...(Array.isArray(s.deletedMemberIds) ? s.deletedMemberIds : []),
        ...(s.deletedMemberId ? [s.deletedMemberId] : []),
      ])
    )
  );

  const combinedDeletedRedemptionIds = Array.from(
    new Set(
      validStores.flatMap((s) => [
        ...(Array.isArray(s.deletedRedemptionIds) ? s.deletedRedemptionIds : []),
        ...(s.deletedRedemptionId ? [s.deletedRedemptionId] : []),
      ])
    )
  );

  let mergedMembers: MemberAccount[] = [];
  for (const s of validStores) {
    if (Array.isArray(s.members)) {
      mergedMembers = mergeMembersLists(
        mergedMembers,
        s.members,
        null,
        combinedDeletedMemberIds
      );
    }
  }

  const redemptionMap = new Map<string, MealRedemption>();
  for (const s of validStores) {
    const cleanReds = filterOutDeletedRedemptions(
      Array.isArray(s.redemptions) ? s.redemptions : [],
      combinedDeletedRedemptionIds,
      combinedDeletedMemberIds
    );
    for (const r of cleanReds) {
      if (!r || !r.id) continue;
      const prev = redemptionMap.get(r.id);
      redemptionMap.set(r.id, prev ? { ...prev, ...r } : r);
    }
  }

  const refundMap = new Map<string, MealDeletionRefundRecord>();
  for (const s of validStores) {
    for (const rec of Array.isArray(s.refundRecords) ? s.refundRecords : []) {
      if (rec && rec.id) refundMap.set(rec.id, rec);
    }
  }

  const latest = validStores[validStores.length - 1];
  const mergedSiteSettings = validStores.reduce((acc, s) => {
    if (!s.siteSettings) return acc;
    const next = { ...(acc || {}), ...s.siteSettings };
    if (next.paymentQrUrl === '/duitnow-qr-chillhealthy.svg') {
      next.paymentQrUrl = '';
    }
    if (
      next.paymentBankName &&
      (next.paymentBankName.includes('HLB') || next.paymentBankName.includes('Hong Leong'))
    ) {
      next.paymentBankName = 'DuitNow QR';
    }
    // Preserve custom attached QR photo if an older/peer snapshot had an empty paymentQrUrl
    const prevCustomQr =
      acc?.paymentQrUrl && acc.paymentQrUrl !== '/duitnow-qr-chillhealthy.svg'
        ? acc.paymentQrUrl
        : '';
    if (!next.paymentQrUrl && prevCustomQr) {
      next.paymentQrUrl = prevCustomQr;
    }
    return next;
  }, latest.siteSettings);

  return {
    ...latest,
    siteSettings: mergedSiteSettings,
    members: mergedMembers,
    deletedMemberIds: combinedDeletedMemberIds,
    redemptions: Array.from(redemptionMap.values()),
    deletedRedemptionIds: combinedDeletedRedemptionIds,
    refundRecords: Array.from(refundMap.values()),
    updatedAt: latest.updatedAt || new Date().toISOString(),
  };
}

/**
 * Push partial or full Back Office / Store updates to the server and broadcast across all tabs & devices worldwide
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

  const endpoints = getSyncEndpoints();
  const bodyStr = JSON.stringify({
    ...payload,
    sourceClientId: SYNC_CLIENT_ID,
  });

  const postToEndpoint = async (url: string, attempt = 1): Promise<SyncStorePayload | null> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyStr,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data?.store || null;
    } catch {
      if (attempt < 2 && url === '/api/sync') {
        await new Promise((r) => setTimeout(r, 600));
        return postToEndpoint(url, attempt + 1);
      }
      return null;
    }
  };

  // 2. Persist & broadcast via all backend endpoints (both local and live/dev peer)
  const results = await Promise.allSettled(endpoints.map((ep) => postToEndpoint(ep)));
  const returnedStores = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((s): s is SyncStorePayload => Boolean(s));

  return mergeSyncPayloads(returnedStores);
}

/**
 * Fetch the latest authoritative store from the server (merging both local and peer live/dev instances)
 */
export async function fetchSyncFromServer(): Promise<SyncStorePayload | null> {
  const endpoints = getSyncEndpoints();
  const ts = Date.now();

  const fetchEndpoint = async (url: string): Promise<SyncStorePayload | null> => {
    try {
      const response = await fetch(`${url}?t=${ts}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (!response.ok) return null;
      const store: SyncStorePayload = await response.json();
      return store;
    } catch {
      return null;
    }
  };

  const results = await Promise.allSettled(endpoints.map((ep) => fetchEndpoint(ep)));
  const stores = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((s): s is SyncStorePayload => Boolean(s));

  if (stores.length === 0) return null;
  const merged = mergeSyncPayloads(stores);

  // If peer server had newly registered members, redemptions, or updated QR settings not yet on local /api/sync, heal local /api/sync automatically
  if (stores.length > 1 && merged && stores[0]) {
    const localMemberCount = Array.isArray(stores[0].members) ? stores[0].members.length : 0;
    const mergedMemberCount = Array.isArray(merged.members) ? merged.members.length : 0;
    const localRedCount = Array.isArray(stores[0].redemptions) ? stores[0].redemptions.length : 0;
    const mergedRedCount = Array.isArray(merged.redemptions) ? merged.redemptions.length : 0;
    const localQr = stores[0].siteSettings?.paymentQrUrl || '';
    const mergedQr = merged.siteSettings?.paymentQrUrl || '';

    if (
      mergedMemberCount > localMemberCount ||
      mergedRedCount > localRedCount ||
      (mergedQr && mergedQr !== localQr)
    ) {
      void fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSettings: merged.siteSettings,
          members: merged.members,
          redemptions: merged.redemptions,
          sourceClientId: SYNC_CLIENT_ID,
        }),
      }).catch(() => {});
    }
  }

  return merged;
}

/**
 * Subscribe to real-time updates via Server-Sent Events (SSE), BroadcastChannel, visibility focus, and live polling
 */
export function subscribeToRealtimeSync(
  onReceiveStore: (store: SyncStorePayload, isInitial?: boolean) => void
): () => void {
  let eventSource: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isDisposed = false;

  // Immediately fetch authoritative state via HTTP GET on startup in addition to SSE
  void fetchSyncFromServer().then((store) => {
    if (!isDisposed && store) {
      onReceiveStore(store, true);
    }
  });

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
          reconnectTimer = setTimeout(connectSSE, 2500);
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

  // Periodic background poll every 2.5 seconds so all worldwide mobile/tablet/website clients stay in instant real-time sync
  const pollInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchSyncFromServer().then((store) => {
        if (store) {
          onReceiveStore(store, false);
        }
      });
    }
  }, 2500);

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
