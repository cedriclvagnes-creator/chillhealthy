import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { MEAL_ITEMS, MEAL_PLANS } from './src/data/menuData';
import {
  DEFAULT_SITE_SETTINGS,
  INITIAL_MEMBERS,
  INITIAL_REDEMPTIONS,
} from './src/data/initialStore';
import { synchronizeMalaysiaWeekdayBankHolidays } from './src/utils/malaysiaHolidays';
import { normalizeMalaysianPhone } from './src/utils/malaysiaPhone';
import {
  getMemberCanonicalKey,
  mergeMembersLists,
  filterOutDeletedMembers,
  filterOutDeletedRedemptions,
  isLegacyDeletedSeedAccount,
  isLegacyDeletedRedemption,
} from './src/utils/syncClient';
import { MemberAccount, MealRedemption } from './src/types';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'chillhealthy_store.json');

interface ServerStore {
  siteSettings: typeof DEFAULT_SITE_SETTINGS;
  packages: typeof MEAL_PLANS;
  menuItems: typeof MEAL_ITEMS;
  members: MemberAccount[];
  deletedMemberIds: string[];
  redemptions: MealRedemption[];
  deletedRedemptionIds: string[];
  refundRecords: any[];
  adminCredentials?: { username: string; password: string };
  updatedAt: string;
  hasCustomUpdates: boolean;
}

/**
 * Ensures any customer phone present in active redemptions (e.g. Package Subscription or Meal Plan orders)
 * has a corresponding registered MemberAccount in members so they can log in from any device worldwide,
 * unless that customer was explicitly deleted by Admin.
 */
function reconcileMembersWithOrders(
  members: MemberAccount[],
  redemptions: MealRedemption[],
  deletedMemberIds: string[]
): MemberAccount[] {
  const cleanMembers = filterOutDeletedMembers(members, deletedMemberIds);
  const deletedSet = new Set(
    (deletedMemberIds || []).flatMap((id) => {
      const norm = normalizeMalaysianPhone(id);
      return norm ? [id.toLowerCase(), norm] : [id.toLowerCase()];
    })
  );

  const existingKeys = new Set(cleanMembers.map((m) => getMemberCanonicalKey(m)).filter(Boolean));

  for (const r of redemptions || []) {
    if (!r || !r.memberPhone) continue;
    if (isLegacyDeletedRedemption(r)) continue;
    const normPhone = normalizeMalaysianPhone(r.memberPhone);
    if (!normPhone || normPhone.length < 9) continue;
    if (deletedSet.has(normPhone) || (r.memberId && deletedSet.has(r.memberId.toLowerCase()))) {
      continue;
    }

    if (!existingKeys.has(normPhone)) {
      const nowIso = new Date().toISOString();
      const autoMember: MemberAccount = {
        id: normPhone,
        memberNumber: normPhone,
        name: r.memberName || 'Registered Member',
        email: `${normPhone}@customer.chill-healthy.com`,
        phone: normPhone,
        password: '123456',
        address: r.deliveryAddress || '',
        area: r.area || '',
        postalCode: r.postalCode || '',
        activeAddressSlot: 1,
        registeredAt: r.createdAt || nowIso,
        updatedAt: nowIso,
        activePackage: null,
        creditsHistory: [],
      };
      if (!isLegacyDeletedSeedAccount(autoMember)) {
        cleanMembers.push(autoMember);
        existingKeys.add(normPhone);
      }
    }
  }

  return cleanMembers;
}

function mergeRedemptionsList(
  existing: MealRedemption[],
  incoming: MealRedemption[],
  deletedRedemptionIds: string[],
  deletedMemberIds: string[] = []
): MealRedemption[] {
  const cleanExisting = filterOutDeletedRedemptions(
    existing || [],
    deletedRedemptionIds,
    deletedMemberIds
  );
  const cleanIncoming = filterOutDeletedRedemptions(
    incoming || [],
    deletedRedemptionIds,
    deletedMemberIds
  );
  const map = new Map<string, MealRedemption>();

  for (const r of cleanExisting) {
    if (!r || !r.id) continue;
    map.set(r.id, r);
  }
  for (const r of cleanIncoming) {
    if (!r || !r.id) continue;
    const prev = map.get(r.id);
    map.set(r.id, prev ? { ...prev, ...r } : r);
  }
  return Array.from(map.values());
}

function getDefaultStore(): ServerStore {
  const initialSync = synchronizeMalaysiaWeekdayBankHolidays(
    DEFAULT_SITE_SETTINGS.disabledDeliveryDates || [],
    new Date(),
    3
  );
  return {
    siteSettings: {
      ...DEFAULT_SITE_SETTINGS,
      autoSyncMalaysiaBankHolidays: true,
      disabledDeliveryDates: initialSync.updatedDisabledDates,
    },
    packages: MEAL_PLANS,
    menuItems: MEAL_ITEMS,
    members: INITIAL_MEMBERS,
    deletedMemberIds: ['mem-uuu-8587'],
    redemptions: INITIAL_REDEMPTIONS,
    deletedRedemptionIds: ['CH-261007-6834', 'red-101', 'red-102', 'red-103'],
    refundRecords: [],
    updatedAt: new Date().toISOString(),
    hasCustomUpdates: true,
  };
}

function loadStoreFromDisk(): ServerStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const defaults = getDefaultStore();

      // Ensure all official menu items exist while preserving admin edits & isOutOfStock flags
      let mergedMenu = defaults.menuItems;
      if (Array.isArray(parsed.menuItems) && parsed.menuItems.length > 0) {
        const existingIds = new Set(parsed.menuItems.map((m: any) => m.id));
        const missing = defaults.menuItems.filter((m) => !existingIds.has(m.id));
        mergedMenu = [...parsed.menuItems, ...missing];
      }

      const deletedMemberIds: string[] = Array.isArray(parsed.deletedMemberIds)
        ? parsed.deletedMemberIds
        : defaults.deletedMemberIds;

      const deletedRedemptionIds: string[] = Array.from(
        new Set([
          ...defaults.deletedRedemptionIds,
          ...(Array.isArray(parsed.deletedRedemptionIds) ? parsed.deletedRedemptionIds : []),
        ])
      );

      const loadedMembers = Array.isArray(parsed.members)
        ? filterOutDeletedMembers(parsed.members, deletedMemberIds)
        : [];

      const loadedRedemptions = Array.isArray(parsed.redemptions)
        ? mergeRedemptionsList([], parsed.redemptions, deletedRedemptionIds, deletedMemberIds)
        : [];

      return {
        siteSettings: { ...defaults.siteSettings, ...(parsed.siteSettings || {}) },
        packages:
          Array.isArray(parsed.packages) && parsed.packages.length > 0
            ? parsed.packages
            : defaults.packages,
        menuItems: mergedMenu,
        members: reconcileMembersWithOrders(loadedMembers, loadedRedemptions, deletedMemberIds),
        deletedMemberIds,
        redemptions: loadedRedemptions,
        deletedRedemptionIds,
        refundRecords: Array.isArray(parsed.refundRecords) ? parsed.refundRecords : [],
        adminCredentials: parsed.adminCredentials || undefined,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        hasCustomUpdates: true,
      };
    }
  } catch (err) {
    console.error('Failed to load store from disk, using defaults:', err);
  }
  return getDefaultStore();
}

function saveStoreToDisk(store: ServerStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store to disk:', err);
  }
}

let store: ServerStore = loadStoreFromDisk();
saveStoreToDisk(store);

// Connected SSE clients for instant real-time push across mobile, tablet, and website worldwide
const sseClients = new Set<express.Response>();

function broadcastSyncEvent(sourceClientId?: string) {
  const payload = JSON.stringify({
    type: 'SYNC_UPDATE',
    sourceClientId: sourceClientId || null,
    store,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();

  // Support base64 photo uploads and full store synchronization payloads
  app.use(express.json({ limit: '50mb' }));

  // GET /api/sync - Retrieve authoritative synchronized Back Office & Store state
  app.get('/api/sync', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(store);
  });

  // GET /api/sync/stream - Server-Sent Events stream for real-time updates to mobile, tablet & website
  app.get('/api/sync/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Send initial snapshot immediately upon connection
    const initialPayload = JSON.stringify({
      type: 'INITIAL_STATE',
      store,
    });
    res.write(`data: ${initialPayload}\n\n`);

    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // POST /api/sync - Update Back Office / Store state & broadcast to all devices worldwide
  app.post('/api/sync', (req, res) => {
    const body = req.body || {};
    const {
      siteSettings,
      packages,
      menuItems,
      members,
      upsertMember,
      replaceMembers,
      redemptions,
      upsertRedemption,
      refundRecords,
      adminCredentials,
      deletedMemberId,
      deletedRedemptionId,
      sourceClientId,
    } = body;

    let changed = false;

    if (siteSettings && typeof siteSettings === 'object') {
      store.siteSettings = { ...store.siteSettings, ...siteSettings };
      changed = true;
    }

    if (Array.isArray(packages) && packages.length > 0) {
      store.packages = packages;
      changed = true;
    }

    if (Array.isArray(menuItems) && menuItems.length > 0) {
      store.menuItems = menuItems;
      changed = true;
    }

    // Handle explicit deletion of a member
    if (deletedMemberId) {
      const targetMember = store.members.find(
        (m) =>
          m.id === deletedMemberId ||
          normalizeMalaysianPhone(m.phone) === normalizeMalaysianPhone(deletedMemberId)
      );
      const keysToDelete = new Set<string>([deletedMemberId]);
      const normDel = normalizeMalaysianPhone(deletedMemberId);
      if (normDel) keysToDelete.add(normDel);
      if (targetMember) {
        if (targetMember.id) keysToDelete.add(targetMember.id);
        if (targetMember.phone) {
          keysToDelete.add(targetMember.phone);
          const nPhone = normalizeMalaysianPhone(targetMember.phone);
          if (nPhone) keysToDelete.add(nPhone);
        }
        if (targetMember.memberNumber) {
          keysToDelete.add(targetMember.memberNumber);
        }
      }

      store.deletedMemberIds = Array.from(
        new Set([...(store.deletedMemberIds || []), ...Array.from(keysToDelete)])
      );
      store.members = filterOutDeletedMembers(store.members, store.deletedMemberIds);
      // Also remove unconfirmed package subscription orders belonging to the deleted member so they don't reappear in Pending Queue
      store.redemptions = store.redemptions.filter((r) => {
        const rPhone = normalizeMalaysianPhone(r.memberPhone || '');
        if (keysToDelete.has(r.memberId) || (rPhone && keysToDelete.has(rPhone))) {
          return false;
        }
        return true;
      });
      changed = true;
    }

    // Handle explicit registration / upsert of a member from any device worldwide
    if (upsertMember && typeof upsertMember === 'object' && !isLegacyDeletedSeedAccount(upsertMember)) {
      const normPhone = normalizeMalaysianPhone(upsertMember.phone || upsertMember.memberNumber || '');
      const stampedMember: MemberAccount = {
        ...upsertMember,
        id: upsertMember.id || normPhone,
        memberNumber: normPhone || upsertMember.memberNumber || upsertMember.phone,
        phone: normPhone || upsertMember.phone,
        registeredAt: upsertMember.registeredAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Remove this newly registered/updated member's keys from deletedMemberIds tombstone list
      const removeKeys = new Set<string>(
        [
          stampedMember.id?.toLowerCase(),
          stampedMember.phone?.toLowerCase(),
          stampedMember.memberNumber?.toLowerCase(),
          normPhone,
        ].filter(Boolean) as string[]
      );
      store.deletedMemberIds = (store.deletedMemberIds || []).filter(
        (id) => !removeKeys.has(id.toLowerCase()) && !removeKeys.has(normalizeMalaysianPhone(id))
      );

      store.members = mergeMembersLists(
        store.members,
        [stampedMember],
        null,
        store.deletedMemberIds
      );
      changed = true;
    }

    if (Array.isArray(members)) {
      if (replaceMembers) {
        store.members = filterOutDeletedMembers(members, store.deletedMemberIds);
      } else {
        store.members = mergeMembersLists(
          store.members,
          members,
          null,
          store.deletedMemberIds
        );
      }
      changed = true;
    }

    if (deletedRedemptionId) {
      store.deletedRedemptionIds = Array.from(
        new Set([...(store.deletedRedemptionIds || []), deletedRedemptionId])
      );
      store.redemptions = store.redemptions.filter(
        (r) => r.id !== deletedRedemptionId && r.orderNumber !== deletedRedemptionId
      );
      changed = true;
    }

    if (upsertRedemption && typeof upsertRedemption === 'object') {
      store.redemptions = mergeRedemptionsList(
        store.redemptions,
        [upsertRedemption],
        store.deletedRedemptionIds,
        store.deletedMemberIds
      );
      changed = true;
    }

    if (Array.isArray(redemptions)) {
      store.redemptions = mergeRedemptionsList(
        store.redemptions,
        redemptions,
        store.deletedRedemptionIds,
        store.deletedMemberIds
      );
      changed = true;
    }

    // Ensure any customer phone in active redemptions has a valid member record for cross-device login
    store.members = reconcileMembersWithOrders(
      store.members,
      store.redemptions,
      store.deletedMemberIds
    );

    if (Array.isArray(refundRecords)) {
      const refundMap = new Map<string, any>();
      for (const rec of [...store.refundRecords, ...refundRecords]) {
        if (rec && rec.id) refundMap.set(rec.id, rec);
      }
      store.refundRecords = Array.from(refundMap.values());
      changed = true;
    }

    if (adminCredentials && typeof adminCredentials === 'object') {
      store.adminCredentials = adminCredentials;
      changed = true;
    }

    if (changed || body.forceBroadcast) {
      store.updatedAt = new Date().toISOString();
      store.hasCustomUpdates = true;
      saveStoreToDisk(store);
      broadcastSyncEvent(sourceClientId);
    }

    res.json({
      ok: true,
      updatedAt: store.updatedAt,
      store,
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CHILL Healthy synchronized server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
