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
  redemptions: MealRedemption[];
  refundRecords: any[];
  adminCredentials?: { username: string; password: string };
  updatedAt: string;
  hasCustomUpdates: boolean;
}

/**
 * Ensures any customer phone present in redemptions (e.g. Package Subscription or Meal Plan orders)
 * has a corresponding registered MemberAccount in members so they can log in from any device.
 */
function reconcileMembersWithOrders(
  members: MemberAccount[],
  redemptions: MealRedemption[],
  deletedMemberId?: string
): MemberAccount[] {
  const deletedKey = deletedMemberId
    ? getMemberCanonicalKey({ id: deletedMemberId, phone: deletedMemberId })
    : '';
  const merged = [...members];
  const existingKeys = new Set(merged.map((m) => getMemberCanonicalKey(m)).filter(Boolean));

  for (const r of redemptions || []) {
    if (!r || !r.memberPhone) continue;
    const normPhone = normalizeMalaysianPhone(r.memberPhone);
    if (!normPhone || normPhone.length < 9) continue;
    if (deletedKey && (normPhone === deletedKey || r.memberId === deletedMemberId)) continue;

    if (!existingKeys.has(normPhone)) {
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
        activePackage: null,
        creditsHistory: [],
      };
      merged.push(autoMember);
      existingKeys.add(normPhone);
    }
  }

  return merged;
}

function mergeRedemptionsList(
  existing: MealRedemption[],
  incoming: MealRedemption[],
  deletedRedemptionId?: string
): MealRedemption[] {
  const map = new Map<string, MealRedemption>();
  for (const r of existing || []) {
    if (!r || !r.id) continue;
    if (deletedRedemptionId && (r.id === deletedRedemptionId || r.orderNumber === deletedRedemptionId)) {
      continue;
    }
    map.set(r.id, r);
  }
  for (const r of incoming || []) {
    if (!r || !r.id) continue;
    if (deletedRedemptionId && (r.id === deletedRedemptionId || r.orderNumber === deletedRedemptionId)) {
      continue;
    }
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
    redemptions: INITIAL_REDEMPTIONS,
    refundRecords: [],
    updatedAt: new Date().toISOString(),
    hasCustomUpdates: false,
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

      const loadedMembers =
        Array.isArray(parsed.members) && parsed.members.length > 0
          ? mergeMembersLists(defaults.members, parsed.members)
          : defaults.members;

      const loadedRedemptions = Array.isArray(parsed.redemptions)
        ? mergeRedemptionsList(defaults.redemptions, parsed.redemptions)
        : defaults.redemptions;

      return {
        siteSettings: { ...defaults.siteSettings, ...(parsed.siteSettings || {}) },
        packages:
          Array.isArray(parsed.packages) && parsed.packages.length > 0
            ? parsed.packages
            : defaults.packages,
        menuItems: mergedMenu,
        members: reconcileMembersWithOrders(loadedMembers, loadedRedemptions),
        redemptions: loadedRedemptions,
        refundRecords: Array.isArray(parsed.refundRecords) ? parsed.refundRecords : [],
        adminCredentials: parsed.adminCredentials || undefined,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        hasCustomUpdates: Boolean(parsed.hasCustomUpdates),
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

// Connected SSE clients for instant real-time push across mobile, tablet, and website
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

  // POST /api/sync - Update Back Office / Store state & broadcast to all devices
  app.post('/api/sync', (req, res) => {
    const body = req.body || {};
    const {
      siteSettings,
      packages,
      menuItems,
      members,
      redemptions,
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

    if (Array.isArray(redemptions)) {
      if (deletedRedemptionId) {
        store.redemptions = store.redemptions.filter(
          (r) => r.id !== deletedRedemptionId && r.orderNumber !== deletedRedemptionId
        );
      }
      store.redemptions = mergeRedemptionsList(store.redemptions, redemptions, deletedRedemptionId);
      changed = true;
    }

    if (Array.isArray(members)) {
      if (deletedMemberId) {
        const delKey = getMemberCanonicalKey({ id: deletedMemberId, phone: deletedMemberId });
        store.members = store.members.filter(
          (m) => m.id !== deletedMemberId && getMemberCanonicalKey(m) !== delKey
        );
      }
      store.members = mergeMembersLists(store.members, members, null, deletedMemberId);
      changed = true;
    }

    // Always ensure any customer phone in redemptions has a valid member record for cross-device login
    store.members = reconcileMembersWithOrders(store.members, store.redemptions, deletedMemberId);

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
