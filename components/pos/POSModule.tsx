"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Printer,
  User,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Tag,
  Package,
  Clock,
  Layers,
  Percent,
  X,
  PlusCircle,
  AlertTriangle,
  Receipt,
  ScanBarcode,
  Store,
  DollarSign,
  ChevronDown,
  UserCheck,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Database
} from "lucide-react";
import { InventoryItem, Customer, SalesRep, CompanySettings } from "@/types/dashboard";
import { offlineSync } from "@/lib/offline-sync";
import { getSyncQueue, clearSyncedTickets, OfflineSyncTicket } from "@/lib/offline-db";

export interface CartItem {
  id: string; // unique cart line id
  productId: string;
  sku: string;
  description: string;
  price: number;
  quantity: number;
  taxRate: number; // 0.15 for ISV 15%, 0 for exempt
  trackingType?: string;
  selectedLot?: string;
  selectedSerial?: string;
  discountPercent?: number;
  imageUrl?: string | null;
  maxStock: number;
}

export interface ParkedTicket {
  id: string;
  ticketNumber: string;
  createdAt: string;
  customerName: string;
  items: CartItem[];
  total: number;
}

export interface POSModuleProps {
  inventory: InventoryItem[];
  setInventory?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  customers: Customer[];
  salesReps?: SalesRep[];
  companySettings?: CompanySettings;
  companyLogo?: string | null;
  formatCurrency?: (val: number) => string;
  onRefreshData?: () => void;
  onNavigateBack?: () => void;
  isStandalone?: boolean;
}

export default function POSModule({
  inventory = [],
  setInventory,
  customers = [],
  salesReps = [],
  companySettings,
  companyLogo,
  formatCurrency = (val: number) =>
    `$${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  onRefreshData,
  onNavigateBack,
  isStandalone = false,
}: POSModuleProps) {
  // ----------------------------------------------------
  // ----------------------------------------------------
  // Full-window state - Opens full size of the browser window (without device fullscreen)
  // ----------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    // Prevent mobile/tablet pull-to-refresh swipe down while using POS
    const preventOverscrollSwipe = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (touch.clientY < 50) {
          e.preventDefault();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("touchmove", preventOverscrollSwipe, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("touchmove", preventOverscrollSwipe);
      }
    };
  }, []);

  // ----------------------------------------------------
  // Catalog Filter & Search States
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((item) => {
      if (item.category && item.category.trim() !== "") {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [inventory]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return inventory.filter((item) => {
      const matchCat =
        selectedCategory === "all" ||
        (selectedCategory === "uncategorized" && (!item.category || item.category.trim() === "")) ||
        (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());

      if (!matchCat) return false;

      if (!q) return true;
      return (
        item.sku.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [inventory, searchQuery, selectedCategory]);

  // ----------------------------------------------------
  // Live Ticket / Cart State
  // ----------------------------------------------------
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: string;
    name: string;
    rtn?: string;
  }>({
    name: "Consumidor Final",
    rtn: "",
  });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", rtn: "", phone: "", email: "" });

  // Parked Orders ("En Espera")
  const [parkedTickets, setParkedTickets] = useState<ParkedTicket[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prado_pos_parked_tickets");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [showParkedModal, setShowParkedModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("prado_pos_parked_tickets", JSON.stringify(parkedTickets));
    } catch {}
  }, [parkedTickets]);

  // ----------------------------------------------------
  // Barcode Auto-detection (USB / Bluetooth Scanners)
  // ----------------------------------------------------
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular inputs (other than barcode scanner focus)
      const target = e.target as HTMLElement;
      if (
        target &&
        target.tagName === "INPUT" &&
        target !== searchInputRef.current
      ) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Scanners send keys very rapidly (< 50ms)
      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current.trim().toLowerCase();
          barcodeBufferRef.current = "";

          // Look for exact SKU match
          const matchedItem = inventory.find(
            (item) => item.sku.toLowerCase() === scannedCode
          );
          if (matchedItem) {
            handleAddToCart(matchedItem);
            // Flash search input briefly
            if (searchInputRef.current) {
              searchInputRef.current.value = "";
              setSearchQuery("");
            }
          }
        }
      } else if (e.key.length === 1) {
        if (diff > 80) {
          // New barcode stream
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inventory]);

  // ----------------------------------------------------
  // Cart Actions
  // ----------------------------------------------------
  const handleAddToCart = (product: InventoryItem) => {
    if (product.quantity <= 0) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        const newQty = item.quantity + 1;
        if (newQty > product.quantity) {
          return prev; // Reached stock limit
        }
        const updated = [...prev];
        updated[existingIndex] = { ...item, quantity: newQty };
        return updated;
      }

      const newItem: CartItem = {
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        sku: product.sku,
        description: product.description,
        price: product.price,
        quantity: 1,
        taxRate: 0.15, // Standard 15% ISV
        trackingType: product.trackingType,
        imageUrl: product.imageUrl,
        maxStock: product.quantity,
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.maxStock) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // ----------------------------------------------------
  // Park Order / En Espera
  // ----------------------------------------------------
  const handleParkOrder = () => {
    if (cart.length === 0) return;
    const ticket: ParkedTicket = {
      id: `parked-${Date.now()}`,
      ticketNumber: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customerName: selectedCustomer.name,
      items: [...cart],
      total: cartTotals.total,
    };
    setParkedTickets((prev) => [ticket, ...prev]);
    setCart([]);
    setSelectedCustomer({ name: "Consumidor Final", rtn: "" });
  };

  const handleRestoreParkedOrder = (ticket: ParkedTicket) => {
    setCart(ticket.items);
    setSelectedCustomer({ name: ticket.customerName, rtn: "" });
    setParkedTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    setShowParkedModal(false);
  };

  const handleDeleteParkedOrder = (ticketId: string) => {
    setParkedTickets((prev) => prev.filter((t) => t.id !== ticketId));
  };

  // ----------------------------------------------------
  // Totals Calculation
  // ----------------------------------------------------
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let isv15 = 0;

    cart.forEach((item) => {
      const lineSubtotal = item.price * item.quantity;
      subtotal += lineSubtotal;
      isv15 += lineSubtotal * item.taxRate;
    });

    const total = subtotal + isv15;
    const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

    return {
      subtotal,
      isv15,
      total,
      totalItems,
    };
  }, [cart]);

  // ----------------------------------------------------
  // Checkout & Payment Modal State
  // ----------------------------------------------------
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CREDITO">("EFECTIVO");
  const [amountReceived, setAmountReceived] = useState<string>("");
  // Active Register & Shift/Cashier State with localStorage persistence
  const [activeRegister, setActiveRegister] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prado_pos_active_shift");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.registerName) return parsed.registerName;
        }
      } catch {}
    }
    return "Caja 01 - Principal";
  });

  const [selectedSalesRep, setSelectedSalesRep] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prado_pos_active_shift");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.cashierName) return parsed.cashierName;
        }
      } catch {}
    }
    return salesReps.length > 0 ? salesReps[0].name : "Cajero Principal";
  });

  // Modal to change Register & Cashier
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [tempRegister, setTempRegister] = useState(activeRegister);
  const [tempCashier, setTempCashier] = useState(selectedSalesRep);
  const [customRegisterMode, setCustomRegisterMode] = useState(false);
  const [customRegisterName, setCustomRegisterName] = useState("");

  const handleOpenShiftModal = () => {
    setTempRegister(activeRegister);
    setTempCashier(selectedSalesRep);
    const standardRegisters = ["Caja 01 - Principal", "Caja 02 - Mostrador", "Caja 03 - Rápida", "Caja 04 - Kiosco"];
    if (standardRegisters.includes(activeRegister)) {
      setCustomRegisterMode(false);
      setCustomRegisterName("");
    } else {
      setCustomRegisterMode(true);
      setCustomRegisterName(activeRegister);
    }
    setShowShiftModal(true);
  };

  const handleSaveShiftConfig = () => {
    const finalRegister = (customRegisterMode ? customRegisterName.trim() : tempRegister) || "Caja 01 - Principal";
    const finalCashier = tempCashier.trim() || "Cajero Principal";
    setActiveRegister(finalRegister);
    setSelectedSalesRep(finalCashier);
    try {
      localStorage.setItem(
        "prado_pos_active_shift",
        JSON.stringify({ registerName: finalRegister, cashierName: finalCashier })
      );
    } catch {}
    setShowShiftModal(false);
  };

  const [documentType, setDocumentType] = useState<"TICKET" | "SAR_INVOICE">("TICKET");
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Offline-First Network & Sync Queue States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSyncQueueModal, setShowSyncQueueModal] = useState<boolean>(false);
  const [syncQueueList, setSyncQueueList] = useState<OfflineSyncTicket[]>([]);

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((state) => {
      setIsOnline(state.isOnline);
      setPendingSyncCount(state.pendingCount);
      setIsSyncing(state.isSyncing);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenSyncQueue = async () => {
    const list = await getSyncQueue();
    setSyncQueueList(list);
    setShowSyncQueueModal(true);
  };

  const handleManualSyncNow = async () => {
    const res = await offlineSync.syncNow();
    const updated = await getSyncQueue();
    setSyncQueueList(updated);
    if (res.synced > 0 && onRefreshData) {
      await onRefreshData();
    }
  };

  const handleClearSyncedHistory = async () => {
    await clearSyncedTickets();
    const updated = await getSyncQueue();
    setSyncQueueList(updated);
  };

  // When opening checkout modal, default amount received to exact total
  const openCheckout = () => {
    if (cart.length === 0) return;
    setAmountReceived(cartTotals.total.toFixed(2));
    setShowCheckoutModal(true);
  };

  const changeDue = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - cartTotals.total);
  }, [amountReceived, cartTotals.total]);

  // Quick Cash Denominations
  const quickCashOptions = useMemo(() => {
    const exact = Math.ceil(cartTotals.total);
    return [
      cartTotals.total,
      exact,
      exact <= 50 ? 50 : exact <= 100 ? 100 : exact <= 200 ? 200 : 500,
      exact <= 500 ? 500 : 1000,
    ].filter((v, i, a) => a.indexOf(v) === i && v >= cartTotals.total);
  }, [cartTotals.total]);

  // ----------------------------------------------------
  // Process Completed Sale
  // ----------------------------------------------------
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    if (!selectedSalesRep || !selectedSalesRep.trim()) {
      alert("Debe seleccionar un cajero o vendedor antes de completar la venta.");
      setShowShiftModal(true);
      return;
    }

    setIsProcessingSale(true);
    try {
      const ticketNumber = `POS-${Date.now().toString().slice(-6)}`;
      const saleDate = new Date();
      const rep = salesReps.find((r) => r.name.toLowerCase() === selectedSalesRep.toLowerCase() || r.id === selectedSalesRep);

      const invoicePayload = {
        customerId: selectedCustomer.id !== "default" ? selectedCustomer.id : undefined,
        invoiceNumber: ticketNumber,
        customerName: selectedCustomer.name || "Consumidor Final",
        customerRtn: selectedCustomer.rtn || null,
        salesRepId: rep ? rep.id : null,
        salesRepName: selectedSalesRep,
        invoiceDate: saleDate.toISOString().split("T")[0],
        paymentTerms: paymentMethod === "CREDITO" ? "Crédito 15 días" : "Contado",
        paymentMethod: paymentMethod === "CREDITO" ? "Crédito" : paymentMethod === "TARJETA" ? "Tarjeta" : paymentMethod === "TRANSFERENCIA" ? "Transferencia" : "Efectivo",
        subtotal: cartTotals.subtotal,
        isv15: cartTotals.isv15,
        total: cartTotals.total,
        status: paymentMethod === "CREDITO" ? "Pendiente" : "Pagada",
        lines: cart.map((c) => ({
          productId: c.productId,
          sku: c.sku,
          productName: c.description,
          description: c.description,
          quantity: c.quantity,
          rate: c.price,
          amount: c.price * c.quantity,
          selectedLot: c.selectedLot,
          selectedSerial: c.selectedSerial,
        })),
      };

      // Grabar la venta a través del gestor offline (intenta en línea; si falla o no hay internet, encola localmente en IndexedDB)
      const saleResult = await offlineSync.recordSale(
        ticketNumber,
        invoicePayload,
        selectedCustomer.name || "Consumidor Final",
        cartTotals.total
      );

      // Update local inventory state
      if (setInventory) {
        setInventory((prev) => {
          return prev.map((item) => {
            const bought = cart.find((c) => c.productId === item.id);
            if (bought) {
              return { ...item, quantity: Math.max(0, item.quantity - bought.quantity) };
            }
            return item;
          });
        });
      }

      const completed = {
        ticketNumber,
        isOffline: saleResult.isOffline,
        date: saleDate.toLocaleString([], {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        customerName: selectedCustomer.name,
        customerRtn: selectedCustomer.rtn,
        register: activeRegister,
        cashier: selectedSalesRep,
        items: [...cart],
        subtotal: cartTotals.subtotal,
        isv15: cartTotals.isv15,
        total: cartTotals.total,
        paymentMethod,
        amountReceived: parseFloat(amountReceived) || cartTotals.total,
        changeDue,
      };

      setCompletedSale(completed);
      setCart([]);
      setShowCheckoutModal(false);
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err) {
      console.error("Error processing POS sale:", err);
    } finally {
      setIsProcessingSale(false);
    }
  };

  // ----------------------------------------------------
  // Thermal Print Trigger
  // ----------------------------------------------------
  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-100 overflow-hidden select-none overscroll-none transition-all duration-150 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-full rounded-none border-0"
          : isStandalone
          ? "w-full h-screen min-h-[640px] rounded-none border-0"
          : "w-full h-[calc(100vh-5rem)] min-h-[640px] rounded-2xl border border-slate-200 shadow-sm"
      }`}
      style={{
        overscrollBehavior: "none",
        touchAction: "pan-x pan-y",
      }}
    >
      {/* ================= 1. TOP OPERATIONAL BAR ================= */}
      <div className="bg-[#1b426e] text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-sm tracking-wide whitespace-nowrap">
              Punto de Venta (POS)
            </span>
            <button
              type="button"
              onClick={handleOpenShiftModal}
              className="flex items-center gap-1.5 text-[11px] text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition cursor-pointer group whitespace-nowrap"
              title="Haz clic para seleccionar otra caja u otro cajero"
            >
              <span className="font-semibold text-amber-300">{activeRegister}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate max-w-[150px]">{selectedSalesRep}</span>
              <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-white transition-transform" />
            </button>

            {/* Indicador de Red / Offline */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                isOnline
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                  : "bg-amber-500/30 border-amber-400 text-amber-200 animate-pulse"
              }`}
              title={isOnline ? "Conectado al servidor central" : "Sin conexión a internet: operando en modo local (offline)"}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden xl:inline">En Línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                  <span>Modo Offline</span>
                </>
              )}
            </div>

            {/* Botón de Cola de Sincronización */}
            <button
              type="button"
              onClick={handleOpenSyncQueue}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                pendingSyncCount > 0
                  ? "bg-amber-400/30 border-amber-300 text-amber-100 hover:bg-amber-400/40 shadow-xs"
                  : "bg-white/10 border-white/15 text-slate-200 hover:bg-white/20"
              }`}
              title="Ver cola de sincronización offline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-300" : ""}`} />
              <span className="hidden xl:inline">
                {pendingSyncCount > 0
                  ? `${pendingSyncCount} ${pendingSyncCount === 1 ? "pendiente" : "pendientes"}`
                  : "Sincronizado"}
              </span>
              {pendingSyncCount > 0 && (
                <span className="xl:hidden bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {pendingSyncCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Top Right Controls with Search Bar right next to En Espera */}
        <div className="flex items-center gap-2.5">
          {/* Global Barcode Scanner Search Bar */}
          <div className="relative w-64 md:w-80 lg:w-96 hidden sm:block">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escanear código de barra o buscar producto..."
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-slate-100 focus:text-slate-900 placeholder:text-slate-300 focus:placeholder:text-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 transition outline-none border border-white/20 focus:border-white focus:ring-2 focus:ring-amber-400/50"
            />
            <ScanBarcode className="w-4 h-4 text-slate-300 absolute left-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Parked Tickets Button */}
          <button
            type="button"
            onClick={() => setShowParkedModal(true)}
            className="relative px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
            title="Tickets en espera"
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">En Espera</span>
            {parkedTickets.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                {parkedTickets.length}
              </span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
            title={isFullscreen ? "Restaurar vista en dashboard" : "Expandir a ventana completa"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Banner de Operación Offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shrink-0 shadow-inner">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
            <span>Operando sin internet: Las ventas se guardan localmente y se sincronizarán automáticamente al volver la conexión.</span>
          </div>
          <button
            type="button"
            onClick={handleOpenSyncQueue}
            className="text-[11px] font-mono bg-slate-900/15 hover:bg-slate-900/25 px-2 py-0.5 rounded cursor-pointer transition hidden sm:inline"
          >
            Memoria Local Activa ({pendingSyncCount} en cola)
          </button>
        </div>
      )}

      {/* ================= 2. MAIN SPLIT BODY ================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ================= LEFT: VISUAL PRODUCT CATALOG (60-65%) ================= */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden">
          {/* Mobile search bar if on small screen */}
          <div className="p-3 border-b border-slate-200 bg-white sm:hidden">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full text-xs rounded-xl pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="p-3 bg-white border-b border-slate-200/80 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#1b426e] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Todos los Artículos ({inventory.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#1b426e] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 p-3.5 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Package className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="font-semibold text-sm text-slate-600">No se encontraron artículos</p>
                <p className="text-xs text-slate-400 mt-1">Prueba cambiando la búsqueda o de categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.quantity <= 0;
                  const isLowStock = product.quantity > 0 && product.quantity <= 5;
                  const cartItem = cart.find((c) => c.productId === product.id);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                      className={`relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer select-none group min-h-[140px] shadow-2xs ${
                        isOutOfStock
                          ? "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                          : "bg-white border-slate-200/90 hover:border-[#1b426e] hover:shadow-md active:scale-98"
                      }`}
                    >
                      {/* Active in Cart Badge */}
                      {cartItem && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#1b426e] text-white text-xs font-bold flex items-center justify-center shadow-md animate-in zoom-in-75">
                          {cartItem.quantity}
                        </div>
                      )}

                      <div>
                        {/* Top: SKU & Stock Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-[#1b426e] truncate">
                            {product.sku}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                              isOutOfStock
                                ? "bg-rose-100 text-rose-700"
                                : isLowStock
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isOutOfStock ? "Agotado" : `${product.quantity} disp.`}
                          </span>
                        </div>

                        {/* Title */}
                        <p className="font-semibold text-xs text-slate-800 line-clamp-2 leading-tight group-hover:text-[#1b426e]">
                          {product.description}
                        </p>
                      </div>

                      {/* Bottom: Price & Category */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="font-mono font-bold text-sm text-[#1b426e]">
                          {formatCurrency(product.price)}
                        </span>
                        {product.trackingType === "SERIAL" ? (
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1 py-0.2 rounded">
                            Serie
                          </span>
                        ) : product.trackingType === "LOT" ? (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                            Lote
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT: LIVE TICKET / CART (35-40%) ================= */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-white flex flex-col h-full shadow-lg border-t lg:border-t-0 z-10">
          {/* Cart Header & Customer Selector */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <ShoppingCart className="w-4 h-4 text-[#1b426e]" />
                <span>Ticket de Venta</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ({cartTotals.totalItems} artículos)
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Customer Pill Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#1b426e] flex items-center justify-between transition cursor-pointer shadow-2xs text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-xs text-slate-800 truncate">
                      {selectedCustomer.name}
                    </div>
                    {selectedCustomer.rtn ? (
                      <div className="text-[10px] text-slate-400 font-mono">
                        RTN: {selectedCustomer.rtn}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400">Consumidor estándar</div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#1b426e] bg-blue-50 px-2 py-0.5 rounded-md">
                  Cambiar
                </span>
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-300">
                <ShoppingCart className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
                <p className="font-semibold text-xs text-slate-500">El carrito está vacío</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  Toca un artículo del catálogo o escanea con el lector de código
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition shadow-2xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-xs text-slate-800 truncate">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                      <span>{formatCurrency(item.price)} c/u</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[#1b426e] font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Steppers */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold active:scale-95 transition cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold font-mono text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-bold active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="w-7 h-7 ml-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                      title="Eliminar línea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom Summary & Checkout Trigger */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/90 shrink-0 space-y-2.5">
            {/* Totals Breakdown */}
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Gravado (15%):</span>
                <span className="font-mono font-medium">{formatCurrency(cartTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>ISV (15%):</span>
                <span className="font-mono font-medium">{formatCurrency(cartTotals.isv15)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(cartTotals.total)}</span>
              </div>
            </div>

            {/* Quick Actions Row: Hold Ticket */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleParkOrder}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <PauseCircle className="w-4 h-4 text-amber-500" />
                <span>Poner en Espera</span>
              </button>
            </div>

            {/* Large Checkout Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={openCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-between shadow-md active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                <span>COBRAR</span>
              </div>
              <span className="font-mono text-base">{formatCurrency(cartTotals.total)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 3. CHECKOUT & TENDER MODAL ================= */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-[#1b426e] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Cobro de Ticket</h3>
                <p className="text-xs text-slate-300">
                  Cliente: {selectedCustomer.name} • {cartTotals.totalItems} artículos • <span className="text-amber-300 font-semibold">{activeRegister}</span> ({selectedSalesRep})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Grand Total Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total a Cobrar
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-700 mt-0.5">
                    {formatCurrency(cartTotals.total)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-emerald-800">Impuestos (15% ISV):</div>
                  <div className="font-mono font-bold text-emerald-900">
                    {formatCurrency(cartTotals.isv15)}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Forma de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("EFECTIVO")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === "EFECTIVO"
                        ? "bg-[#1b426e] text-white border-[#1b426e] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TARJETA")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === "TARJETA"
                        ? "bg-[#1b426e] text-white border-[#1b426e] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TRANSFERENCIA")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === "TRANSFERENCIA"
                        ? "bg-[#1b426e] text-white border-[#1b426e] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Transfer/QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CREDITO")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === "CREDITO"
                        ? "bg-[#1b426e] text-white border-[#1b426e] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Crédito</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendering & Change Calculator */}
              {paymentMethod === "EFECTIVO" && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monto Recibido del Cliente
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full text-lg font-mono font-bold rounded-xl px-3.5 py-2 bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quick Bill Denominations */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">
                      Sugerencias de billetes rápidos:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickCashOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAmountReceived(opt.toString())}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-mono font-semibold text-slate-800 transition cursor-pointer shadow-2xs"
                        >
                          {opt === cartTotals.total ? `Exacto (${formatCurrency(opt)})` : formatCurrency(opt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change Due Display */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Cambio a Entregar:</span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        parseFloat(amountReceived) < cartTotals.total
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {parseFloat(amountReceived) < cartTotals.total
                        ? "Monto insuficiente"
                        : formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Document Type Selector */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="font-semibold text-slate-800">Tipo de Comprobante</div>
                  <div className="text-[11px] text-slate-500">
                    {documentType === "TICKET"
                      ? "Ticket Térmico (58mm/80mm)"
                      : "Factura SAR con CAI y Rango Fiscal"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDocumentType("TICKET")}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                      documentType === "TICKET"
                        ? "bg-[#1b426e] text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType("SAR_INVOICE")}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition cursor-pointer ${
                      documentType === "SAR_INVOICE"
                        ? "bg-[#1b426e] text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    Factura SAR
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isProcessingSale ||
                  (paymentMethod === "EFECTIVO" && (parseFloat(amountReceived) || 0) < cartTotals.total)
                }
                onClick={handleCompleteSale}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                {isProcessingSale ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar y Emitir Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. SALE COMPLETED / THERMAL RECEIPT MODAL ================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setCompletedSale(null)}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer z-10"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Printable Receipt Paper Container */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 pt-7">
              <div
                id="pos-thermal-receipt"
                className="bg-white p-4 rounded-xl border border-dashed border-slate-300 font-mono text-[11px] text-slate-800 space-y-2 shadow-2xs"
              >
                {/* Store Header */}
                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  <div className="font-bold text-xs uppercase">
                    {companySettings?.nombre || "PRADO ERP STORE"}
                  </div>
                  {companySettings?.taxId && <div>RTN: {companySettings.taxId}</div>}
                  {companySettings?.direccion && <div className="text-[10px]">{companySettings.direccion}</div>}
                  <div className="text-[10px] text-slate-500 mt-1">{completedSale.date}</div>
                </div>

                {/* Metadata */}
                <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                  <div>Cliente: {completedSale.customerName}</div>
                  {completedSale.customerRtn && <div>RTN: {completedSale.customerRtn}</div>}
                  <div>Caja: {completedSale.register || activeRegister}</div>
                  <div>Cajero: {completedSale.cashier}</div>
                  <div>Ticket: {completedSale.ticketNumber}</div>
                </div>

                {/* Items */}
                <div className="py-1 space-y-1">
                  {completedSale.items.map((item: CartItem) => (
                    <div key={item.id} className="flex justify-between items-start text-[10px]">
                      <div className="flex-1 pr-1 truncate">
                        {item.quantity}x {item.description}
                      </div>
                      <div className="font-bold shrink-0">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-2 border-t border-dashed border-slate-300 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(completedSale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ISV (15%):</span>
                    <span>{formatCurrency(completedSale.isv15)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(completedSale.total)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Efectivo Recibido:</span>
                    <span>{formatCurrency(completedSale.amountReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Cambio:</span>
                    <span>{formatCurrency(completedSale.changeDue)}</span>
                  </div>
                </div>

                {/* Offline Badge on Ticket */}
                {completedSale.isOffline && (
                  <div className="bg-amber-50 text-amber-900 border border-amber-300 p-2 rounded text-[9px] text-center font-bold">
                    ⚡ MODO OFFLINE: Venta registrada localmente. Sincronización automática pendiente al volver la conexión.
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
                  ¡Gracias por su compra!
                </div>
              </div>
            </div>

            {/* Offline / Online Status Notice */}
            {completedSale.isOffline ? (
              <div className="mx-4 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Ticket guardado en memoria local. Se sincronizará automáticamente al volver el internet.</span>
              </div>
            ) : (
              <div className="mx-4 mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Venta confirmada y sincronizada en el servidor central.</span>
              </div>
            )}

            {/* Actions */}
            <div className="p-3 bg-white flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrintTicket}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#1b426e] hover:bg-[#153457] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Nueva Venta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. PARKED TICKETS MODAL ================= */}
      {showParkedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Tickets en Espera ({parkedTickets.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowParkedModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {parkedTickets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No hay tickets puestos en espera
                </div>
              ) : (
                parkedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#1b426e] transition flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{ticket.ticketNumber}</div>
                      <div className="text-[11px] text-slate-600">
                        {ticket.customerName} • {ticket.items.length} artículos
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Puesto a las {ticket.createdAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-xs text-emerald-700">
                        {formatCurrency(ticket.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRestoreParkedOrder(ticket)}
                        className="px-2.5 py-1 rounded-lg bg-[#1b426e] hover:bg-[#153457] text-white text-[11px] font-bold transition cursor-pointer"
                      >
                        Recuperar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteParkedOrder(ticket.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Descartar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. CUSTOMER SELECTION MODAL ================= */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Seleccionar Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Default Option: Consumidor Final */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer({ name: "Consumidor Final", rtn: "" });
                  setShowCustomerModal(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  selectedCustomer.name === "Consumidor Final"
                    ? "bg-blue-50/50 border-[#1b426e] text-[#1b426e] font-bold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div>
                  <div className="text-xs">Consumidor Final</div>
                  <div className="text-[10px] text-slate-400 font-normal">Sin RTN / Venta Rápida</div>
                </div>
                {selectedCustomer.name === "Consumidor Final" && (
                  <CheckCircle2 className="w-4 h-4 text-[#1b426e]" />
                )}
              </button>

              {/* Existing customers list */}
              <div className="text-[11px] font-semibold text-slate-500 pt-1">
                Clientes Registrados:
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer({ id: c.id, name: c.name, rtn: c.rtn || "" });
                      setShowCustomerModal(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      selectedCustomer.id === c.id
                        ? "bg-blue-50/50 border-[#1b426e] text-[#1b426e] font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs truncate">{c.name}</div>
                      {c.rtn && <div className="text-[10px] text-slate-400 font-mono">RTN: {c.rtn}</div>}
                    </div>
                    {selectedCustomer.id === c.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#1b426e] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ================= 7. REGISTER & CASHIER (SHIFT) MODAL ================= */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-[#1b426e] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Configuración de Caja y Cajero</h3>
                <p className="text-[11px] text-slate-200">Asigna la terminal física y el operador activo del turno</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 1. SELECCIÓN DE CAJA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#1b426e]" />
                  <span>1. Seleccionar Caja / Terminal</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Caja 01 - Principal",
                    "Caja 02 - Mostrador",
                    "Caja 03 - Rápida",
                    "Caja 04 - Kiosco",
                  ].map((reg) => {
                    const isSelected = !customRegisterMode && tempRegister === reg;
                    return (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => {
                          setCustomRegisterMode(false);
                          setTempRegister(reg);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer text-xs font-semibold ${
                          isSelected
                            ? "bg-blue-50/70 border-[#1b426e] text-[#1b426e] shadow-2xs ring-1 ring-[#1b426e]"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-[#1b426e]" : "bg-slate-300"}`} />
                          <span>{reg}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1b426e]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Opción personalizada */}
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomRegisterMode(true);
                      if (!customRegisterName && tempRegister) {
                        setCustomRegisterName(tempRegister);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer text-xs font-semibold ${
                      customRegisterMode
                        ? "bg-blue-50/70 border-[#1b426e] text-[#1b426e] ring-1 ring-[#1b426e]"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${customRegisterMode ? "bg-[#1b426e]" : "bg-slate-300"}`} />
                      <span>Otra caja / Nombre personalizado</span>
                    </div>
                    {customRegisterMode && <CheckCircle2 className="w-4 h-4 text-[#1b426e]" />}
                  </button>

                  {customRegisterMode && (
                    <div className="mt-2 pl-4">
                      <input
                        type="text"
                        value={customRegisterName}
                        onChange={(e) => setCustomRegisterName(e.target.value)}
                        placeholder="Ej. Caja Terraza, Terminal Móvil 02..."
                        className="w-full text-xs rounded-xl px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:border-[#1b426e] focus:bg-white"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. SELECCIÓN DE CAJERO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#1b426e]" />
                  <span>2. Seleccionar Cajero / Vendedor Activo</span>
                </label>

                {salesReps && salesReps.length > 0 && (
                  <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto pr-1">
                    {salesReps.map((rep) => {
                      const isSelected = tempCashier === rep.name;
                      return (
                        <button
                          key={rep.id || rep.name}
                          type="button"
                          onClick={() => setTempCashier(rep.name)}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer text-xs ${
                            isSelected
                              ? "bg-blue-50/70 border-[#1b426e] text-[#1b426e] font-bold ring-1 ring-[#1b426e]"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? "bg-[#1b426e] text-white" : "bg-slate-200 text-slate-600"
                            }`}>
                              {rep.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div>{rep.name}</div>
                              {rep.email && <div className="text-[10px] text-slate-400 font-normal">{rep.email}</div>}
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1b426e]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Entrada manual de nombre de cajero */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    O escribe el nombre del cajero:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempCashier}
                      onChange={(e) => setTempCashier(e.target.value)}
                      placeholder="Nombre del cajero u operador..."
                      className="w-full text-xs rounded-lg pl-8 pr-3 py-1.5 bg-white border border-slate-300 focus:outline-none focus:border-[#1b426e]"
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Los cambios se guardan automáticamente en la memoria de este navegador. Todas las ventas emitidas a partir de ahora quedarán registradas con esta caja y cajero.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveShiftConfig}
                className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#153457] text-xs font-bold text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. OFFLINE SYNC QUEUE MODAL ================= */}
      {showSyncQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-[#1b426e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Cola de Sincronización Offline</h3>
                  <p className="text-[11px] text-slate-200">
                    {syncQueueList.filter((t) => t.status === "PENDING" || t.status === "FAILED").length} ventas pendientes de subir a la nube
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncQueueModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Network Banner */}
            <div className={`px-4 py-2 flex items-center justify-between text-xs font-semibold ${
              isOnline ? "bg-emerald-50 text-emerald-800 border-b border-emerald-100" : "bg-amber-50 text-amber-900 border-b border-amber-200"
            }`}>
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
                <span>{isOnline ? "Conexión a internet activa" : "Terminal desconectada de internet"}</span>
              </div>
              <span className="text-[11px] font-mono">
                {isOnline ? "Auto-sync habilitado" : "Guardando en IndexedDB"}
              </span>
            </div>

            {/* Ticket List Body */}
            <div className="p-4 max-h-80 overflow-y-auto space-y-2.5">
              {syncQueueList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                  <p className="text-xs font-medium text-slate-600">No hay transacciones pendientes</p>
                  <p className="text-[11px] text-slate-400">Todas las ventas de esta terminal están sincronizadas con la nube.</p>
                </div>
              ) : (
                syncQueueList.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{ticket.ticketNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ticket.status === "SYNCED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : ticket.status === "SYNCING"
                            ? "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse"
                            : ticket.status === "FAILED"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {ticket.status === "SYNCED"
                            ? "Sincronizado"
                            : ticket.status === "SYNCING"
                            ? "Sincronizando..."
                            : ticket.status === "FAILED"
                            ? "Error"
                            : "Pendiente"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ticket.customerName} • {new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {ticket.lastError && (
                        <div className="text-[10px] text-rose-600 font-medium truncate max-w-xs">
                          {ticket.lastError}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-slate-900 font-mono">
                        {formatCurrency(ticket.total)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearSyncedHistory}
                disabled={!syncQueueList.some((t) => t.status === "SYNCED")}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Limpiar sincronizados
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSyncQueueModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleManualSyncNow}
                  disabled={isSyncing || !isOnline}
                  className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#153457] disabled:opacity-50 text-xs font-bold text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Sincronizando..." : "Sincronizar Ahora"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
