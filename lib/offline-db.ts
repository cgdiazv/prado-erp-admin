// lib/offline-db.ts
// Robust, dependency-free IndexedDB wrapper for Offline-First POS operations

export interface OfflineSyncTicket {
  id: string; // unique local ID e.g. "offline-1712345678"
  ticketNumber: string;
  payload: any; // full invoice payload for /api/invoices
  total: number;
  customerName: string;
  createdAt: string; // ISO date string
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  retryCount: number;
  lastError?: string;
  syncedAt?: string;
}

const DB_NAME = "prado_erp_offline_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getOfflineDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Catálogo local de inventario
      if (!db.objectStoreNames.contains("inventory")) {
        db.createObjectStore("inventory", { keyPath: "id" });
      }

      // 2. Lista local de clientes
      if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", { keyPath: "id" });
      }

      // 3. Vendedores / Cajeros
      if (!db.objectStoreNames.contains("salesReps")) {
        db.createObjectStore("salesReps", { keyPath: "id" });
      }

      // 4. Configuración de empresa
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }

      // 5. Cola de sincronización de ventas offline
      if (!db.objectStoreNames.contains("syncQueue")) {
        const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
        syncStore.createIndex("status", "status", { unique: false });
        syncStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

// ========================================================
// Catálogo Local (Cache)
// ========================================================

export async function saveLocalInventory(items: any[]): Promise<void> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("inventory", "readwrite");
    const store = tx.objectStore("inventory");
    store.clear();
    for (const item of items) {
      store.put(item);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Error saving local inventory cache:", err);
  }
}

export async function getLocalInventory(): Promise<any[]> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("inventory", "readonly");
    const store = tx.objectStore("inventory");
    const req = store.getAll();
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveLocalCustomers(customers: any[]): Promise<void> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("customers", "readwrite");
    const store = tx.objectStore("customers");
    store.clear();
    for (const c of customers) {
      store.put(c);
    }
  } catch (err) {
    console.warn("Error saving local customers cache:", err);
  }
}

export async function getLocalCustomers(): Promise<any[]> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("customers", "readonly");
    const req = tx.objectStore("customers").getAll();
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveLocalSalesReps(reps: any[]): Promise<void> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("salesReps", "readwrite");
    const store = tx.objectStore("salesReps");
    store.clear();
    for (const r of reps) {
      store.put(r);
    }
  } catch (err) {
    console.warn("Error saving local sales reps cache:", err);
  }
}

export async function getLocalSalesReps(): Promise<any[]> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("salesReps", "readonly");
    const req = tx.objectStore("salesReps").getAll();
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveLocalMeta(key: string, value: any): Promise<void> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("meta", "readwrite");
    tx.objectStore("meta").put({ key, value });
  } catch (err) {
    console.warn("Error saving local meta:", err);
  }
}

export async function getLocalMeta<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("meta", "readonly");
    const req = tx.objectStore("meta").get(key);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Descontar inventario localmente (para que la terminal refleje el stock vendido aún offline)
export async function deductLocalInventoryStock(lines: { productId: string; quantity: number }[]): Promise<void> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("inventory", "readwrite");
    const store = tx.objectStore("inventory");

    for (const line of lines) {
      const getReq = store.get(line.productId);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.quantity = Math.max(0, (Number(item.quantity) || 0) - Number(line.quantity));
          store.put(item);
        }
      };
    }
  } catch (err) {
    console.warn("Error deducting local inventory:", err);
  }
}

// ========================================================
// Cola de Sincronización (Sync Queue)
// ========================================================

export async function enqueueOfflineTicket(ticket: Omit<OfflineSyncTicket, "id" | "status" | "retryCount">): Promise<OfflineSyncTicket> {
  const db = await getOfflineDB();
  const entry: OfflineSyncTicket = {
    ...ticket,
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "PENDING",
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const req = store.add(entry);

    req.onsuccess = () => resolve(entry);
    req.onerror = () => reject(req.error);
  });
}

export async function getSyncQueue(): Promise<OfflineSyncTicket[]> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("syncQueue", "readonly");
    const store = tx.objectStore("syncQueue");
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const list: OfflineSyncTicket[] = req.result || [];
        // Ordenar por fecha de creación descendente
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function getPendingTickets(): Promise<OfflineSyncTicket[]> {
  const all = await getSyncQueue();
  return all.filter((t) => t.status === "PENDING" || t.status === "FAILED");
}

export async function updateTicketStatus(
  id: string,
  status: OfflineSyncTicket["status"],
  errorMsg?: string
): Promise<void> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const ticket: OfflineSyncTicket = getReq.result;
      if (ticket) {
        ticket.status = status;
        if (status === "SYNCED") {
          ticket.syncedAt = new Date().toISOString();
        }
        if (errorMsg) {
          ticket.lastError = errorMsg;
          ticket.retryCount = (ticket.retryCount || 0) + 1;
        }
        store.put(ticket);
      }
    };
  } catch (err) {
    console.warn("Error updating ticket status:", err);
  }
}

export async function clearSyncedTickets(): Promise<void> {
  try {
    const db = await getOfflineDB();
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const req = store.getAll();

    req.onsuccess = () => {
      const list: OfflineSyncTicket[] = req.result || [];
      for (const item of list) {
        if (item.status === "SYNCED") {
          store.delete(item.id);
        }
      }
    };
  } catch (err) {
    console.warn("Error clearing synced tickets:", err);
  }
}
