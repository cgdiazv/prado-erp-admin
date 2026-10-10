// lib/offline-sync.ts
// Background synchronization manager and network state handler

import {
  getPendingTickets,
  updateTicketStatus,
  getSyncQueue,
  OfflineSyncTicket,
  enqueueOfflineTicket,
  saveLocalInventory,
  saveLocalCustomers,
  saveLocalSalesReps,
  saveLocalMeta,
  deductLocalInventoryStock,
} from "./offline-db";

type SyncListener = (state: {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}) => void;

class OfflineSyncManager {
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private listeners: Set<SyncListener> = new Set();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initNetworkListeners();
      // Periodically check queue & heartbeat every 20 seconds
      this.timer = setInterval(() => {
        this.checkAndSync();
      }, 20000);
    }
  }

  private initNetworkListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncNow();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Emit initial state
    this.getPendingCount().then((count) => {
      listener({
        isOnline: this.isOnline,
        pendingCount: count,
        isSyncing: this.isSyncing,
        lastSyncTime: this.lastSyncTime,
      });
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners() {
    const count = await this.getPendingCount();
    for (const listener of this.listeners) {
      try {
        listener({
          isOnline: this.isOnline,
          pendingCount: count,
          isSyncing: this.isSyncing,
          lastSyncTime: this.lastSyncTime,
        });
      } catch (e) {
        console.error("Error in sync listener:", e);
      }
    }
  }

  public async getPendingCount(): Promise<number> {
    const pending = await getPendingTickets();
    return pending.length;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Health check to confirm actual internet access to the backend,
   * not just a local Wi-Fi connection without WAN.
   */
  public async verifyConnectivity(): Promise<boolean> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.isOnline = false;
      this.notifyListeners();
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Lightweight ping to company settings
      const res = await fetch("/api/company", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      this.isOnline = res.ok;
      this.notifyListeners();
      return res.ok;
    } catch {
      this.isOnline = false;
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Enqueue a sale locally and attempt immediate sync if online
   */
  public async recordSale(
    ticketNumber: string,
    invoicePayload: any,
    customerName: string,
    total: number
  ): Promise<{ ticketNumber: string; isOffline: boolean; offlineId?: string }> {
    // 1. Deduct stock in local IndexedDB immediately
    if (Array.isArray(invoicePayload.lines)) {
      await deductLocalInventoryStock(
        invoicePayload.lines.map((l: any) => ({
          productId: l.productId,
          quantity: l.quantity,
        }))
      );
    }

    // 2. Try online first if navigator says we are online
    const hasConnection = await this.verifyConnectivity();

    if (hasConnection) {
      try {
        const response = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoicePayload),
        });

        if (response.ok) {
          this.lastSyncTime = new Date();
          this.notifyListeners();
          return { ticketNumber, isOffline: false };
        }
      } catch (netErr) {
        console.warn("Online POST failed, falling back to offline queue:", netErr);
      }
    }

    // 3. Fallback: Save in IndexedDB sync queue
    const queued = await enqueueOfflineTicket({
      ticketNumber,
      payload: invoicePayload,
      customerName,
      total,
      createdAt: new Date().toISOString(),
    });

    this.isOnline = false;
    await this.notifyListeners();

    return {
      ticketNumber,
      isOffline: true,
      offlineId: queued.id,
    };
  }

  /**
   * Process all pending tickets in queue and send to backend
   */
  public async syncNow(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };

    const connected = await this.verifyConnectivity();
    if (!connected) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    await this.notifyListeners();

    let synced = 0;
    let failed = 0;

    try {
      const pending = await getPendingTickets();
      if (pending.length === 0) {
        this.isSyncing = false;
        await this.notifyListeners();
        return { synced: 0, failed: 0 };
      }

      for (const ticket of pending) {
        await updateTicketStatus(ticket.id, "SYNCING");

        try {
          const res = await fetch("/api/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticket.payload),
          });

          if (res.ok) {
            await updateTicketStatus(ticket.id, "SYNCED");
            synced++;
          } else {
            const errJson = await res.json().catch(() => ({}));
            const errMsg = errJson.error || `HTTP error ${res.status}`;
            await updateTicketStatus(ticket.id, "FAILED", errMsg);
            failed++;
          }
        } catch (postErr: any) {
          await updateTicketStatus(ticket.id, "FAILED", postErr.message || "Error de red");
          failed++;
          // Connection likely lost again
          this.isOnline = false;
          break;
        }
      }

      this.lastSyncTime = new Date();
    } finally {
      this.isSyncing = false;
      await this.notifyListeners();
    }

    return { synced, failed };
  }

  private async checkAndSync() {
    const count = await this.getPendingCount();
    if (count > 0 && this.isOnline) {
      await this.syncNow();
    }
  }

  /**
   * Guardar copia de seguridad del catálogo en IndexedDB
   */
  public async cacheCatalogs(data: {
    inventory?: any[];
    customers?: any[];
    salesReps?: any[];
    companySettings?: any;
    subInfo?: any;
  }) {
    if (data.inventory) await saveLocalInventory(data.inventory);
    if (data.customers) await saveLocalCustomers(data.customers);
    if (data.salesReps) await saveLocalSalesReps(data.salesReps);
    if (data.companySettings) await saveLocalMeta("companySettings", data.companySettings);
    if (data.subInfo) await saveLocalMeta("subInfo", data.subInfo);
  }
}

// Global singleton instance for the app
export const offlineSync = new OfflineSyncManager();
