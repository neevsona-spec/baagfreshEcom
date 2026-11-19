import fs from 'fs';
import path from 'path';

export interface StoredOrderRow {
  id: number;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: any;
  items: any[];
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface StoredCustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  saved_address: any;
  created_at: string;
  updated_at?: string;
}

interface LocalStoreData {
  nextOrderSeq: number;
  orders: StoredOrderRow[];
  customers: StoredCustomerRow[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'baagfresh-store.json');

let memoryStore: LocalStoreData | null = null;

function normalizeDigits(phone: string | number | null | undefined): string {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '');
}

function loadStore(): LocalStoreData {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore = {
        nextOrderSeq: Number(parsed.nextOrderSeq) || (Array.isArray(parsed.orders) ? parsed.orders.length + 1 : 1),
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      };
      return memoryStore;
    }
  } catch (err) {
    console.warn('[LocalStore] Could not read store file, initializing fresh store:', err);
  }
  memoryStore = { nextOrderSeq: 1, orders: [], customers: [] };
  return memoryStore;
}

function persistStore(store: LocalStoreData): void {
  memoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LocalStore] Disk persistence warning (keeping in-memory state):', err);
  }
}

export function localInsertOrder(payload: Omit<StoredOrderRow, 'id' | 'created_at'> & { created_at?: string }): StoredOrderRow {
  const store = loadStore();
  const existingIdx = store.orders.findIndex((o) => o.order_id === payload.order_id);
  const nowIso = payload.created_at || new Date().toISOString();

  if (existingIdx >= 0) {
    const updated: StoredOrderRow = {
      ...store.orders[existingIdx],
      ...payload,
      updated_at: nowIso,
    };
    store.orders[existingIdx] = updated;
    persistStore(store);
    return updated;
  }

  const row: StoredOrderRow = {
    id: store.nextOrderSeq++,
    ...payload,
    created_at: nowIso,
  };
  store.orders.unshift(row);
  persistStore(store);
  return row;
}

export function localGetOrderById(orderId: string): StoredOrderRow | null {
  const store = loadStore();
  return store.orders.find((o) => o.order_id === orderId || String(o.id) === orderId) || null;
}

export function localGetAllOrders(): StoredOrderRow[] {
  const store = loadStore();
  return [...store.orders].sort((a, b) => b.order_id.localeCompare(a.order_id));
}

export function localGetOrdersByPhone(phone: string): StoredOrderRow[] {
  const store = loadStore();
  const targetLast10 = normalizeDigits(phone).slice(-10);
  if (!targetLast10) return [];
  return store.orders
    .filter((o) => {
      const ordDigits = normalizeDigits(o.customer_phone);
      return ordDigits.endsWith(targetLast10) || ordDigits.includes(targetLast10);
    })
    .sort((a, b) => b.order_id.localeCompare(a.order_id));
}

export function localUpdateOrderStatus(orderId: string, status: string): StoredOrderRow | null {
  const store = loadStore();
  const idx = store.orders.findIndex((o) => o.order_id === orderId || String(o.id) === orderId);
  if (idx < 0) return null;
  store.orders[idx] = {
    ...store.orders[idx],
    status: String(status),
    updated_at: new Date().toISOString(),
  };
  persistStore(store);
  return store.orders[idx];
}

export function localFindCustomer(query: { phone?: string; email?: string }): StoredCustomerRow | null {
  const store = loadStore();
  const targetDigits = normalizeDigits(query.phone).slice(-10);
  const targetEmail = (query.email || '').trim().toLowerCase();

  if (targetDigits) {
    const byPhone = store.customers.find((c) => {
      const d = normalizeDigits(c.phone);
      return d && (d.endsWith(targetDigits) || d === targetDigits);
    });
    if (byPhone) return byPhone;
  }

  if (targetEmail) {
    const byEmail = store.customers.find((c) => (c.email || '').trim().toLowerCase() === targetEmail);
    if (byEmail) return byEmail;
  }

  return null;
}

export function localUpsertCustomer(input: {
  name?: string;
  phone?: string | null;
  email?: string;
  saved_address?: any;
}): StoredCustomerRow {
  const store = loadStore();
  const existing = localFindCustomer({ phone: input.phone || undefined, email: input.email || undefined });
  const nowIso = new Date().toISOString();

  if (existing) {
    const idx = store.customers.findIndex((c) => c.id === existing.id);
    const updated: StoredCustomerRow = {
      ...existing,
      name: input.name || existing.name,
      phone: input.phone || existing.phone,
      email: input.email || existing.email,
      saved_address: input.saved_address !== undefined && input.saved_address !== null
        ? input.saved_address
        : existing.saved_address,
      updated_at: nowIso,
    };
    if (idx >= 0) store.customers[idx] = updated;
    persistStore(store);
    return updated;
  }

  const created: StoredCustomerRow = {
    id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: input.name || 'Patron',
    phone: input.phone || null,
    email: input.email || '',
    saved_address: input.saved_address ?? null,
    created_at: nowIso,
  };
  store.customers.unshift(created);
  persistStore(store);
  return created;
}

export function localGetAllCustomers(): StoredCustomerRow[] {
  const store = loadStore();
  return [...store.customers];
}
