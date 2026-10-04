"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  CreditCard,
  DollarSign,
  Calendar,
  Check,
  Search,
  Upload,
  Clock,
  Printer,
  FileText,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import {
  Account,
  BankAccount,
  Customer,
  Vendor,
  Invoice,
  CompanySettings,
  NavItem,
} from "@/types/dashboard";
import { numberToWordsSpanish } from "@/components/InvoicesModule";

export interface CashMovementsModuleProps {
  currentView: "deposito-bancario" | "agregar-gasto" | "pagar-proveedor" | "recibir-pago";
  initialRecibirPagoCustomerId?: string | null;
  initialRecibirPagoInvoiceNumber?: string | null;
  initialPagarProveedorVendor?: string | null;
  connectedBanks: BankAccount[];
  customers: Customer[];
  vendors: Vendor[];
  invoicesList: Invoice[];
  companySettings: CompanySettings;
  defaultCurrencySymbol?: string;
  defaultCurrencyCode?: string;
  loading?: boolean;
  onNavigateToDashboard: () => void;
  onNavigateToView: (view: NavItem) => void;
  onRefreshAccounts?: () => void;
  onUpdatePOStatus?: (poNum: string, newStatus: string) => void;
}

export function CashMovementsModule({
  currentView,
  initialRecibirPagoCustomerId,
  initialRecibirPagoInvoiceNumber,
  initialPagarProveedorVendor,
  connectedBanks,
  customers,
  vendors,
  invoicesList,
  companySettings,
  defaultCurrencySymbol = "L",
  defaultCurrencyCode = "HNL",
  loading = false,
  onNavigateToDashboard,
  onNavigateToView,
  onRefreshAccounts,
  onUpdatePOStatus,
}: CashMovementsModuleProps) {
  // -------------------------------------------------------------
  // 1. Depósito Bancario State & Handlers
  // -------------------------------------------------------------
  const [depositForm, setDepositForm] = useState({
    account: "",
    accountBalance: 0,
    date: new Date().toISOString().split("T")[0],
    currency: defaultCurrencyCode || "HNL",
    memo: "",
    cashbackAccount: "",
    cashbackMemo: "",
    cashbackAmount: 0,
    lines: [
      { id: "1", receivedFrom: "", account: "1100 - Cuentas por Cobrar", memo: "", paymentMethod: "Transferencia bancaria", reference: "", amount: 0 },
    ],
  });

  const [depositSuccessMsg, setDepositSuccessMsg] = useState("");
  const [showDepositSaveDropdown, setShowDepositSaveDropdown] = useState(false);

  const handleDepositLineChange = (id: string, field: string, val: any) => {
    setDepositForm((prev) => {
      const newLines = prev.lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: val };
        if (field === "amount") {
          updated.amount = Number(val) || 0;
        }
        return updated;
      });
      return { ...prev, lines: newLines };
    });
  };

  const handleAddDepositLine = () => {
    setDepositForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: Date.now().toString(),
          receivedFrom: "",
          account: "1100 - Cuentas por Cobrar",
          memo: "",
          paymentMethod: "Transferencia bancaria",
          reference: "",
          amount: 0,
        },
      ],
    }));
  };

  const handleRemoveDepositLine = (id: string) => {
    if (depositForm.lines.length <= 1) return;
    setDepositForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.id !== id),
    }));
  };

  const handleClearAllDepositLines = () => {
    setDepositForm((prev) => ({
      ...prev,
      lines: [
        {
          id: Date.now().toString(),
          receivedFrom: "",
          account: "1100 - Cuentas por Cobrar",
          memo: "",
          paymentMethod: "Transferencia bancaria",
          reference: "",
          amount: 0,
        },
      ],
    }));
  };

  const depositTotalLines = depositForm.lines.reduce((acc, l) => acc + (l.amount || 0), 0);
  const depositFinalTotal = depositTotalLines - (depositForm.cashbackAmount || 0);

  const handleSaveDeposit = async (createAnother = false) => {
    if (depositFinalTotal <= 0) {
      alert("Por favor ingresa al menos una línea con importe válido mayor a 0.");
      return;
    }

    try {
      let destCode = "1100";
      let destName = "Bancos Nacionales (Cuenta de Cheques)";
      if (depositForm.account.includes("Ficohsa")) {
        destCode = "1100";
        destName = "Bancos Nacionales — Banco Ficohsa USD";
      } else if (depositForm.account.includes("Atlántida")) {
        destCode = "1100";
        destName = "Bancos Nacionales — Banco Atlántida HNL";
      } else if (depositForm.account.includes("Caja")) {
        destCode = "1000";
        destName = "Caja General y Efectivo";
      }

      const validLines = depositForm.lines.filter((l) => Number(l.amount) > 0);
      const journalLines: {
        accountCode: string;
        accountName: string;
        description: string;
        debit: number;
        credit: number;
      }[] = [
        {
          accountCode: destCode,
          accountName: destName,
          description: depositForm.memo || `Depósito recibido en ${destName}`,
          debit: Math.round(depositFinalTotal * 100) / 100,
          credit: 0,
        },
      ];

      for (const line of validLines) {
        let srcCode = "1200";
        let srcName = "Accounts Receivable (Cuentas por Cobrar Clientes)";
        if (line.account.includes("Ventas") || line.account.includes("7000")) {
          srcCode = "4000";
          srcName = "Sales Revenue (Ventas de Mercancías y Empaques)";
        } else if (line.account.includes("Pagar") || line.account.includes("2100")) {
          srcCode = "2000";
          srcName = "Accounts Payable (Cuentas por Pagar Proveedores)";
        } else if (line.account.includes("Ingresos Financieros") || line.account.includes("7100")) {
          srcCode = "4300";
          srcName = "Ingresos Financieros e Intereses Ganados";
        } else if (line.account.includes("Cash") || line.account.includes("1000")) {
          srcCode = "1000";
          srcName = "Caja General";
        }

        journalLines.push({
          accountCode: srcCode,
          accountName: srcName,
          description: line.memo || (line.receivedFrom ? `Depósito de ${line.receivedFrom}` : `Abono de depósito`),
          debit: 0,
          credit: Math.round(Number(line.amount) * 100) / 100,
        });
      }

      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: depositForm.date,
          concept: depositForm.memo || `Depósito Bancario: ${destName} - $${depositFinalTotal.toFixed(2)}`,
          referenceType: "BANK_TX",
          currency: depositForm.currency || "USD",
          lines: journalLines,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al registrar asiento contable del depósito.");
      }

      const entryNum = data.data?.entryNumber ? ` [Asiento: ${data.data.entryNumber}]` : "";
      setDepositSuccessMsg(`¡Depósito bancario por $${depositFinalTotal.toFixed(2)} USD vinculado al Plan de Cuentas con éxito!${entryNum}`);

      if (onRefreshAccounts) onRefreshAccounts();

      setTimeout(() => {
        setDepositSuccessMsg("");
        if (createAnother) {
          setDepositForm({
            account: "",
            accountBalance: 0,
            date: new Date().toISOString().split("T")[0],
            currency: "USD",
            memo: "",
            cashbackAccount: "",
            cashbackMemo: "",
            cashbackAmount: 0,
            lines: [
              { id: Date.now().toString(), receivedFrom: "", account: "1100 - Cuentas por Cobrar", memo: "", paymentMethod: "Transferencia bancaria", reference: "", amount: 0 },
            ],
          });
        } else {
          onNavigateToDashboard();
        }
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Error al procesar el depósito bancario.");
    }
  };

  // -------------------------------------------------------------
  // 2. Gasto (Expense Entry) State & Handlers
  // -------------------------------------------------------------
  const [showGastoSaveDropdown, setShowGastoSaveDropdown] = useState(false);
  const [gastoSuccessMsg, setGastoSuccessMsg] = useState("");
  
  const [gastoForm, setGastoForm] = useState({
    payeeId: "",
    payeeName: "",
    paymentAccount: "Accrued Liabilities",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Efectivo",
    refNumber: "",
    currency: defaultCurrencyCode || "HNL",
    notes: "",
    lines: [
      { id: "1", category: "", description: "", amount: 0 },
      { id: "2", category: "", description: "", amount: 0 },
    ],
  });

  const gastoTotal = useMemo(() => {
    return gastoForm.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  }, [gastoForm.lines]);

  const gastoCurrencyCode = useMemo(() => {
    const c = (gastoForm.currency || defaultCurrencyCode || "HNL").trim().toUpperCase();
    if (c.includes("USD") || c === "$") return "USD";
    if (c.includes("HNL") || c.includes("LEMPIRA") || c === "L") return "HNL";
    if (c.includes("EUR") || c === "€") return "EUR";
    return defaultCurrencyCode || "HNL";
  }, [gastoForm.currency, defaultCurrencyCode]);

  const gastoCurrencySymbol = useMemo(() => {
    if (gastoCurrencyCode === "HNL") return "L";
    if (gastoCurrencyCode === "USD") return "$";
    if (gastoCurrencyCode === "EUR") return "€";
    return defaultCurrencySymbol || "L";
  }, [gastoCurrencyCode, defaultCurrencySymbol]);

  const handleGastoLineChange = (id: string, field: string, value: any) => {
    setGastoForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }));
  };

  const handleAddGastoLine = () => {
    setGastoForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        { id: String(Date.now()), category: "", description: "", amount: 0 },
      ],
    }));
  };

  const handleDuplicateGastoLine = (id: string) => {
    const target = gastoForm.lines.find((l) => l.id === id);
    if (!target) return;
    setGastoForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: String(Date.now()),
          category: target.category,
          description: target.description,
          amount: target.amount,
        },
      ],
    }));
  };

  const handleRemoveGastoLine = (id: string) => {
    if (gastoForm.lines.length <= 1) {
      setGastoForm((prev) => ({
        ...prev,
        lines: [{ id: "1", category: "", description: "", amount: 0 }],
      }));
      return;
    }
    setGastoForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.id !== id),
    }));
  };

  const handleClearAllGastoLines = () => {
    setGastoForm((prev) => ({
      ...prev,
      lines: [{ id: "1", category: "", description: "", amount: 0 }],
    }));
  };

  const handleSaveGasto = async (createAnother = false) => {
    if (gastoTotal <= 0) {
      alert("Por favor ingresa al menos una categoría con importe mayor a 0.");
      return;
    }

    try {
      let payCode = "1100";
      let payName = "Bancos Nacionales (Cuenta de Cheques)";
      if (gastoForm.paymentAccount.includes("Caja Chica") || gastoForm.paymentAccount.includes("1005")) {
        payCode = "1010";
        payName = "Caja Chica y Fondos Fijos";
      } else if (gastoForm.paymentAccount.includes("Cash") || gastoForm.paymentAccount.includes("1000") || gastoForm.paymentMethod === "Efectivo") {
        payCode = "1000";
        payName = "Caja General y Efectivo";
      } else if (gastoForm.paymentAccount.includes("Liabilities")) {
        payCode = "2000";
        payName = "Accounts Payable (Cuentas por Pagar Proveedores)";
      } else if (gastoForm.paymentAccount.includes("FICOHSA")) {
        payCode = "1100";
        payName = "Bancos Nacionales — Banco FICOHSA HNL";
      } else if (gastoForm.paymentAccount.includes("BAC")) {
        payCode = "1100";
        payName = "Bancos Nacionales — Banco BAC USD";
      }

      const validLines = gastoForm.lines.filter((l) => Number(l.amount) > 0);
      const journalLines: {
        accountCode: string;
        accountName: string;
        description: string;
        debit: number;
        credit: number;
      }[] = [];

      for (const line of validLines) {
        let expCode = "6200";
        let expName = "Papelería, Útiles de Oficina y Gastos Operativos";
        if (line.category.includes("Publicidad")) {
          expCode = "6300";
          expName = "Publicidad, Mercadeo y Comisiones de Venta";
        } else if (line.category.includes("Públicos")) {
          expCode = "6150";
          expName = "Servicios Públicos (Energía, Agua, Telecomunicaciones)";
        } else if (line.category.includes("Mantenimiento")) {
          expCode = "5300";
          expName = "Costos Indirectos de Fabricación y Mantenimiento";
        } else if (line.category.includes("Materia Prima")) {
          expCode = "5100";
          expName = "Materia Prima Directa";
        } else if (line.category.includes("Transporte") || line.category.includes("Fletes")) {
          expCode = "6100";
          expName = "Combustibles, Lubricantes y Transporte";
        } else if (line.category.includes("Seguros")) {
          expCode = "6000";
          expName = "Gastos Operativos & Administrativos (Seguros)";
        } else if (line.category.includes("Honorarios")) {
          expCode = "6000";
          expName = "Honorarios Profesionales y Asesoría Legal/Contable";
        } else if (line.category.includes("Representación")) {
          expCode = "6400";
          expName = "Gastos de Cafetería y Alimentación de Personal";
        }

        journalLines.push({
          accountCode: expCode,
          accountName: expName,
          description: line.description || `${line.category || "Gasto operativo"} - ${gastoForm.payeeName || "General"}`,
          debit: Math.round(Number(line.amount) * 100) / 100,
          credit: 0,
        });
      }

      journalLines.push({
        accountCode: payCode,
        accountName: payName,
        description: `Desembolso pago a ${gastoForm.payeeName || "Proveedor"} vía ${gastoForm.paymentMethod}${gastoForm.refNumber ? ` #${gastoForm.refNumber}` : ""}`,
        debit: 0,
        credit: Math.round(gastoTotal * 100) / 100,
      });

      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: gastoForm.paymentDate,
          concept: `Gasto Operativo: ${gastoForm.payeeName || "General"}${gastoForm.refNumber ? ` (Ref #${gastoForm.refNumber})` : ""}`,
          referenceType: "MANUAL",
          referenceId: gastoForm.refNumber || undefined,
          currency: gastoCurrencyCode,
          lines: journalLines,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al registrar asiento contable del gasto.");
      }

      const entryNum = data.data?.entryNumber ? ` [Asiento: ${data.data.entryNumber}]` : "";
      setGastoSuccessMsg(`¡Gasto por ${gastoCurrencySymbol}${gastoTotal.toFixed(2)} ${gastoCurrencyCode} vinculado al Plan de Cuentas con éxito!${entryNum}`);

      if (onRefreshAccounts) onRefreshAccounts();

      setTimeout(() => {
        setGastoSuccessMsg("");
        if (createAnother) {
          setGastoForm({
            payeeId: "",
            payeeName: "",
            paymentAccount: "Accrued Liabilities",
            paymentDate: new Date().toISOString().split("T")[0],
            paymentMethod: "Efectivo",
            refNumber: "",
            currency: defaultCurrencyCode || "HNL",
            notes: "",
            lines: [
              { id: "1", category: "", description: "", amount: 0 },
              { id: "2", category: "", description: "", amount: 0 },
            ],
          });
        } else {
          onNavigateToDashboard();
        }
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Error al registrar el gasto.");
    }
  };

  // -------------------------------------------------------------
  // 3. Pagar a Proveedor State & Handlers
  // -------------------------------------------------------------
  const [showPagarProveedorFilterPopover, setShowPagarProveedorFilterPopover] = useState(false);
  const [showPagarProveedorSaveDropdown, setShowPagarProveedorSaveDropdown] = useState(false);
  const [pagarProveedorSuccessMsg, setPagarProveedorSuccessMsg] = useState("");
  
  const [pagarProveedorForm, setPagarProveedorForm] = useState({
    account: "Seleccionar una cuenta",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Transferencia Bancaria",
    refNumber: "",
    currency: defaultCurrencyCode ? `${defaultCurrencyCode} - ${defaultCurrencyCode === "HNL" ? "Lempira hondureño" : "Dólar estadounidense"}` : "HNL - Lempira hondureño",
    dueDateFilter: "Últimos 365 días",
    dateFrom: "",
    dateTo: "",
    payeeFilter: initialPagarProveedorVendor || "Todo",
    onlyOverdue: false,
  });

  const [vendorBills, setVendorBills] = useState<Array<{
    id: string;
    vendorName: string;
    billNumber: string;
    dueDate: string;
    originalAmount: number;
    balanceDue: number;
    currency?: string;
  }>>([]);

  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [customBillAmounts, setCustomBillAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialPagarProveedorVendor) {
      setPagarProveedorForm((prev) => ({ ...prev, payeeFilter: initialPagarProveedorVendor }));
    }
  }, [initialPagarProveedorVendor]);

  const pagarProveedorCurrencyCode = useMemo(() => {
    const c = (pagarProveedorForm.currency || defaultCurrencyCode || "HNL").trim().toUpperCase();
    if (c.includes("USD") || c === "$") return "USD";
    if (c.includes("HNL") || c.includes("LEMPIRA") || c === "L") return "HNL";
    if (c.includes("EUR") || c === "€") return "EUR";
    return (defaultCurrencyCode || "HNL").toUpperCase();
  }, [pagarProveedorForm.currency, defaultCurrencyCode]);

  const pagarProveedorCurrencySymbol = useMemo(() => {
    if (pagarProveedorCurrencyCode === "HNL") return "L";
    if (pagarProveedorCurrencyCode === "USD") return "$";
    if (pagarProveedorCurrencyCode === "EUR") return "€";
    return defaultCurrencySymbol || "L";
  }, [pagarProveedorCurrencyCode, defaultCurrencySymbol]);

  useEffect(() => {
    if (currentView !== "pagar-proveedor") return;
    const loadBills = async () => {
      try {
        const resInvoices = await fetch("/api/purchase-invoices").then((r) => r.json()).catch(() => null);
        const resOrders = await fetch("/api/purchase-orders").then((r) => r.json()).catch(() => null);
        
        const bills: Array<{
          id: string;
          vendorName: string;
          billNumber: string;
          dueDate: string;
          originalAmount: number;
          balanceDue: number;
          currency?: string;
        }> = [];

        if (resInvoices?.success && Array.isArray(resInvoices.data)) {
          resInvoices.data.forEach((inv: any) => {
            if (!["Pagada", "PAGADA", "Cancelada", "CANCELADA"].includes(inv.paymentStatus)) {
              const total = Number(inv.total) || 0;
              const paid = (inv.paymentLines || []).reduce((sum: number, pl: any) => sum + (Number(pl.amountPaid) || 0), 0);
              const bal = Math.max(0, total - paid);
              if (bal > 0) {
                bills.push({
                  id: inv.id,
                  vendorName: inv.vendorName || "Proveedor",
                  billNumber: inv.invoiceNumber || inv.purchaseOrderNumber || inv.id,
                  dueDate: inv.dueDate || inv.issueDate || new Date().toISOString().split("T")[0],
                  originalAmount: total,
                  balanceDue: bal,
                  currency: inv.currency || defaultCurrencyCode || "HNL",
                });
              }
            }
          });
        }

        if (resOrders?.success && Array.isArray(resOrders.data)) {
          resOrders.data.forEach((po: any) => {
            if (!["Pagada", "PAGADA", "Cancelada", "CANCELADA"].includes(po.status)) {
              const exists = bills.some((b) => b.billNumber === po.orderNumber || b.id === po.id);
              if (!exists) {
                const total = Number(po.total) || 0;
                if (total > 0) {
                  bills.push({
                    id: po.id || po.orderNumber,
                    vendorName: po.vendorName || po.vendor?.name || "Proveedor",
                    billNumber: po.orderNumber,
                    dueDate: po.dueDate || po.issueDate || new Date().toISOString().split("T")[0],
                    originalAmount: total,
                    balanceDue: total,
                    currency: po.currency || defaultCurrencyCode || "HNL",
                  });
                }
              }
            }
          });
        }

        setVendorBills(bills);
      } catch (e) {
        console.error("Error loading vendor bills:", e);
      }
    };

    loadBills();
  }, [currentView, defaultCurrencyCode]);

  const filteredVendorBills = useMemo(() => {
    return vendorBills.filter((bill) => {
      if (pagarProveedorForm.payeeFilter && pagarProveedorForm.payeeFilter !== "Todo") {
        const matchVendor = vendors.find((v) => v.id === pagarProveedorForm.payeeFilter || v.name === pagarProveedorForm.payeeFilter);
        if (matchVendor) {
          if (bill.vendorName.toLowerCase() !== matchVendor.name.toLowerCase()) return false;
        } else if (!bill.vendorName.toLowerCase().includes(pagarProveedorForm.payeeFilter.toLowerCase())) {
          return false;
        }
      }
      if (pagarProveedorForm.onlyOverdue) {
        const today = new Date().toISOString().split("T")[0];
        if (bill.dueDate >= today) return false;
      }
      return true;
    });
  }, [vendorBills, pagarProveedorForm.payeeFilter, pagarProveedorForm.onlyOverdue, vendors]);

  const totalPagarSum = useMemo(() => {
    return selectedBillIds.reduce((sum, id) => {
      const bill = filteredVendorBills.find((b) => b.id === id);
      const amount = customBillAmounts[id] ?? bill?.balanceDue ?? 0;
      return sum + (Number(amount) || 0);
    }, 0);
  }, [selectedBillIds, filteredVendorBills, customBillAmounts]);

  const handleToggleSelectAllBills = () => {
    if (selectedBillIds.length === filteredVendorBills.length) {
      setSelectedBillIds([]);
    } else {
      setSelectedBillIds(filteredVendorBills.map((b) => b.id));
    }
  };

  const handleToggleSelectBill = (id: string) => {
    if (selectedBillIds.includes(id)) {
      setSelectedBillIds((prev) => prev.filter((bId) => bId !== id));
    } else {
      setSelectedBillIds((prev) => [...prev, id]);
    }
  };

  const handleSavePagarProveedor = async (createAnother = false) => {
    if (selectedBillIds.length === 0) return;

    try {
      const selectedBills = filteredVendorBills.filter((b) => selectedBillIds.includes(b.id));
      const firstVendor = selectedBills[0]?.vendorName || "Proveedor";
      const vendorObj = vendors.find((v) => v.name.toLowerCase() === firstVendor.toLowerCase());

      const lines = selectedBills.map((b) => ({
        purchaseInvoiceId: b.id.length > 20 ? b.id : undefined,
        purchaseOrderNumber: b.billNumber,
        amountPaid: customBillAmounts[b.id] ?? b.balanceDue,
      }));

      await fetch("/api/vendor-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendorObj?.id || undefined,
          vendorName: firstVendor,
          paymentDate: pagarProveedorForm.paymentDate,
          paymentMethod: pagarProveedorForm.paymentMethod,
          referenceNumber: pagarProveedorForm.refNumber || undefined,
          paidAccount: pagarProveedorForm.account,
          currency: pagarProveedorCurrencyCode,
          amount: totalPagarSum,
          lines,
        }),
      }).catch(() => null);

      selectedBillIds.forEach((poNum) => {
        if (onUpdatePOStatus) {
          onUpdatePOStatus(poNum, "Pagada");
        }
      });

      setPagarProveedorSuccessMsg(`¡Pago por ${pagarProveedorCurrencySymbol}${totalPagarSum.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${pagarProveedorCurrencyCode} procesado con éxito!`);
      setTimeout(() => {
        setPagarProveedorSuccessMsg("");
        if (createAnother) {
          setVendorBills((prev) => prev.filter((b) => !selectedBillIds.includes(b.id)));
          setSelectedBillIds([]);
        } else {
          onNavigateToView("pagos-proveedores");
        }
      }, 1400);
    } catch (err: any) {
      setPagarProveedorSuccessMsg(`¡Pago por ${pagarProveedorCurrencySymbol}${totalPagarSum.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${pagarProveedorCurrencyCode} procesado con éxito!`);
      setTimeout(() => {
        setPagarProveedorSuccessMsg("");
        if (createAnother) {
          setVendorBills((prev) => prev.filter((b) => !selectedBillIds.includes(b.id)));
          setSelectedBillIds([]);
        } else {
          onNavigateToView("pagos-proveedores");
        }
      }, 1400);
    }
  };

  // -------------------------------------------------------------
  // 4. Recibir Pago State & Handlers
  // -------------------------------------------------------------
  const defaultRecibirPagoForm = {
    customerId: "",
    customerName: "",
    customerEmail: "",
    emailCc: "",
    emailCco: "",
    sendLater: false,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Efectivo",
    referenceNumber: "",
    invoiceNumber: "",
    depositAccount: "Cash and cash equivalents",
    amount: 0,
    currency: defaultCurrencyCode || "HNL",
    note: "",
    attachmentName: "",
  };

  const [recibirPagoForm, setRecibirPagoForm] = useState(defaultRecibirPagoForm);
  const [recibirPagoLoading, setRecibirPagoLoading] = useState(false);
  const [recibirPagoSuccessMsg, setRecibirPagoSuccessMsg] = useState("");
  const [recibirPagoErrorMsg, setRecibirPagoErrorMsg] = useState("");
  const [showRecibirPagoSaveDropdown, setShowRecibirPagoSaveDropdown] = useState(false);
  const [showCcCcoPopover, setShowCcCcoPopover] = useState(false);
  const [showInvoiceSearchModal, setShowInvoiceSearchModal] = useState(false);
  const [showCancelPaymentConfirmModal, setShowCancelPaymentConfirmModal] = useState(false);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");

  const activeCurrencyCode = useMemo(() => {
    const c = (recibirPagoForm.currency || defaultCurrencyCode || "HNL").trim().toUpperCase();
    if (c.includes("USD") || c === "$") return "USD";
    if (c.includes("HNL") || c.includes("LEMPIRA") || c === "L") return "HNL";
    if (c.includes("EUR") || c === "€") return "EUR";
    return defaultCurrencyCode || "HNL";
  }, [recibirPagoForm.currency, defaultCurrencyCode]);

  const activeCurrencySymbol = useMemo(() => {
    if (activeCurrencyCode === "HNL") return "L";
    if (activeCurrencyCode === "USD") return "$";
    if (activeCurrencyCode === "EUR") return "€";
    return defaultCurrencySymbol || "L";
  }, [activeCurrencyCode, defaultCurrencySymbol]);

  const customerBalance = useMemo(() => {
    if (!recibirPagoForm.customerId && !recibirPagoForm.customerName) return 0;
    const targetName = (recibirPagoForm.customerName || "").trim().toLowerCase();
    const customerObj = customers.find((c) => c.id === recibirPagoForm.customerId || (c.name && c.name.trim().toLowerCase() === targetName));
    const emailToMatch = (customerObj?.email || recibirPagoForm.customerEmail || "").trim().toLowerCase();

    return invoicesList
      .filter((inv) => {
        const invCustomer = (inv.customer || "").trim().toLowerCase();
        const matchesName = targetName && (invCustomer === targetName || (customerObj && invCustomer === customerObj.name.trim().toLowerCase()));
        const matchesEmail = emailToMatch && inv.customerEmail && inv.customerEmail.trim().toLowerCase() === emailToMatch;
        const isPending = inv.status === "Pendiente" || inv.status === "Emitida";
        return (matchesName || matchesEmail) && isPending;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [invoicesList, recibirPagoForm.customerId, recibirPagoForm.customerName, recibirPagoForm.customerEmail, customers]);

  const paymentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialRecibirPagoInvoiceNumber) {
      const match = invoicesList.find(
        (i) => i.num.toLowerCase() === initialRecibirPagoInvoiceNumber.trim().toLowerCase()
      );
      if (match) {
        const foundCustomer = customers.find(
          (c) => c.name.toLowerCase().includes(match.customer.toLowerCase()) || match.customer.toLowerCase().includes(c.name.toLowerCase())
        );
        const resolvedCurrency = match.currency || foundCustomer?.currency || defaultCurrencyCode || "HNL";
        setRecibirPagoForm((prev) => ({
          ...prev,
          customerId: foundCustomer ? foundCustomer.id : "",
          customerName: match.customer,
          customerEmail: match.customerEmail || foundCustomer?.email || "",
          currency: resolvedCurrency,
          invoiceNumber: match.num,
          amount: match.total,
          referenceNumber: `FAC-${match.num}`,
          note: `Pago asignado a la Factura N.º ${match.num}`,
        }));
        setRecibirPagoSuccessMsg(`¡Factura N.º ${match.num} vinculada con éxito!`);
        return;
      }
    }
    if (initialRecibirPagoCustomerId) {
      const selected = customers.find((c) => c.id === initialRecibirPagoCustomerId);
      if (selected) {
        const pendingInvoice = invoicesList.find(
          (inv) =>
            (inv.customer.toLowerCase() === selected.name.toLowerCase() ||
              (selected.email && inv.customerEmail?.toLowerCase() === selected.email.toLowerCase())) &&
            (inv.status === "Pendiente" || inv.status === "Emitida")
        );
        const resolvedCurrency = pendingInvoice?.currency || selected.currency || defaultCurrencyCode || "HNL";
        setRecibirPagoForm((prev) => ({
          ...prev,
          customerId: selected.id,
          customerName: selected.name,
          customerEmail: selected.email || "",
          currency: resolvedCurrency,
          invoiceNumber: pendingInvoice ? pendingInvoice.num : prev.invoiceNumber,
          amount: pendingInvoice ? pendingInvoice.total : prev.amount,
          referenceNumber: pendingInvoice ? `FAC-${pendingInvoice.num}` : prev.referenceNumber,
        }));
      }
    }
  }, [initialRecibirPagoInvoiceNumber, initialRecibirPagoCustomerId, customers, invoicesList, defaultCurrencyCode]);

  const handleRequestCancelRecibirPago = () => {
    if (
      recibirPagoForm.customerName ||
      recibirPagoForm.amount > 0 ||
      recibirPagoForm.referenceNumber ||
      recibirPagoForm.note ||
      recibirPagoForm.attachmentName ||
      recibirPagoForm.emailCc ||
      recibirPagoForm.emailCco
    ) {
      setShowCancelPaymentConfirmModal(true);
    } else {
      setRecibirPagoForm(defaultRecibirPagoForm);
      setRecibirPagoErrorMsg("");
      setRecibirPagoSuccessMsg("");
      onNavigateToDashboard();
    }
  };

  const handleConfirmDiscardPaymentChanges = () => {
    setRecibirPagoForm(defaultRecibirPagoForm);
    setRecibirPagoErrorMsg("");
    setRecibirPagoSuccessMsg("");
    setShowCancelPaymentConfirmModal(false);
    onNavigateToDashboard();
  };

  const handleRecibirPagoCustomerChange = (custNameOrId: string) => {
    const selected = customers.find((c) => c.id === custNameOrId || c.name === custNameOrId);
    if (selected) {
      const pendingInvoice = invoicesList.find(
        (inv) =>
          (inv.customer.toLowerCase() === selected.name.toLowerCase() ||
            (selected.email && inv.customerEmail?.toLowerCase() === selected.email.toLowerCase())) &&
          (inv.status === "Pendiente" || inv.status === "Emitida")
      );
      const resolvedCurrency = pendingInvoice?.currency || selected.currency || defaultCurrencyCode || "HNL";
      setRecibirPagoForm((prev) => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.name,
        customerEmail: selected.email || "",
        currency: resolvedCurrency,
        invoiceNumber: pendingInvoice ? pendingInvoice.num : "",
        amount: pendingInvoice ? pendingInvoice.total : prev.amount,
        referenceNumber: pendingInvoice ? `FAC-${pendingInvoice.num}` : prev.referenceNumber,
      }));
    } else {
      setRecibirPagoForm((prev) => ({
        ...prev,
        customerId: "",
        customerName: custNameOrId,
        invoiceNumber: "",
      }));
    }
  };

  const handleImportInvoiceData = (numToSearch: string) => {
    if (!numToSearch || !numToSearch.trim()) return;
    const query = numToSearch.trim().toLowerCase();
    const match = invoicesList.find(
      (i) => i.num.toLowerCase().includes(query) || i.customer.toLowerCase().includes(query)
    );
    if (match) {
      const foundCustomer = customers.find(
        (c) => c.name.toLowerCase().includes(match.customer.toLowerCase()) || match.customer.toLowerCase().includes(c.name.toLowerCase())
      );
      const resolvedCurrency = match.currency || foundCustomer?.currency || defaultCurrencyCode || "HNL";
      const sym = resolvedCurrency.toUpperCase().includes("USD") ? "$" : (resolvedCurrency.toUpperCase().includes("HNL") ? "L" : activeCurrencySymbol);
      setRecibirPagoForm((prev) => ({
        ...prev,
        customerId: foundCustomer ? foundCustomer.id : "",
        customerName: match.customer,
        customerEmail: match.customerEmail || foundCustomer?.email || "",
        currency: resolvedCurrency,
        invoiceNumber: match.num,
        amount: match.total,
        referenceNumber: `FAC-${match.num}`,
        note: `Pago asignado a la Factura N.º ${match.num}`,
      }));
      setRecibirPagoErrorMsg("");
      setRecibirPagoSuccessMsg(`¡Factura N.º ${match.num} vinculada con éxito! Se importaron los datos de ${match.customer} e importe de ${sym}${match.total.toLocaleString("es-HN", { minimumFractionDigits: 2 })}.`);
      setShowInvoiceSearchModal(false);
      setSearchInvoiceNumber("");
    } else {
      setRecibirPagoSuccessMsg("");
      setRecibirPagoErrorMsg(`No se encontró ninguna factura con el número u orden "${numToSearch}".`);
      setShowInvoiceSearchModal(false);
    }
  };

  const handleSaveRecibirPago = async (andClose = false) => {
    if (!recibirPagoForm.customerName) {
      setRecibirPagoErrorMsg("Por favor elige un cliente.");
      return;
    }
    if (!recibirPagoForm.amount || recibirPagoForm.amount <= 0) {
      setRecibirPagoErrorMsg("Ingresa un importe recibido mayor a 0.");
      return;
    }
    setRecibirPagoLoading(true);
    setRecibirPagoErrorMsg("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recibirPagoForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al registrar el pago");
      }
      setRecibirPagoSuccessMsg(`¡Pago por ${activeCurrencySymbol}${recibirPagoForm.amount.toFixed(2)} registrado correctamente!`);
      if (onRefreshAccounts) onRefreshAccounts();
      if (andClose) {
        setTimeout(() => {
          onNavigateToDashboard();
          setRecibirPagoSuccessMsg("");
        }, 1000);
      } else {
        setTimeout(() => {
          setRecibirPagoSuccessMsg("");
          setRecibirPagoForm((prev) => ({
            ...prev,
            amount: 0,
            referenceNumber: "",
            invoiceNumber: "",
            note: "",
          }));
        }, 1500);
      }
    } catch (err: any) {
      setRecibirPagoErrorMsg(err.message || "Error al registrar el pago");
    } finally {
      setRecibirPagoLoading(false);
    }
  };

  // Click outside listener for all local dropdowns
  useEffect(() => {
    const anyOpen =
      showDepositSaveDropdown ||
      showGastoSaveDropdown ||
      showPagarProveedorSaveDropdown ||
      showPagarProveedorFilterPopover ||
      showRecibirPagoSaveDropdown ||
      showCcCcoPopover;

    if (!anyOpen) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]") && !target.closest("[data-popover]")) {
        setShowDepositSaveDropdown(false);
        setShowGastoSaveDropdown(false);
        setShowPagarProveedorSaveDropdown(false);
        setShowPagarProveedorFilterPopover(false);
        setShowRecibirPagoSaveDropdown(false);
        setShowCcCcoPopover(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [
    showDepositSaveDropdown,
    showGastoSaveDropdown,
    showPagarProveedorSaveDropdown,
    showPagarProveedorFilterPopover,
    showRecibirPagoSaveDropdown,
    showCcCcoPopover,
  ]);

  return (
    <>
          {currentView === "deposito-bancario" && (
            <div className="fixed inset-0 z-40 flex flex-col bg-slate-100 text-slate-800 animate-in fade-in duration-150 overflow-hidden">
              
              {/* TOP HEADER BAR (Clean, without comentarios or ? icon as requested) */}
              <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit mr-2"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar</span>
                  </button>
                  <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1b426e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <span>Depósito bancario</span>
                  </h1>
                </div>

                {/* Top Right Action (Only Close X Button - No comentarios, No question icon) */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title="Cerrar depósito"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* MAIN CONTENT WORKSPACE */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 pb-24">
                
                {/* Notification Banner */}
                {depositSuccessMsg && (
                  <div className="max-w-6xl mx-auto p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
                    <span className="font-bold">✓ {depositSuccessMsg}</span>
                  </div>
                )}

                {/* UPPER CARDS GRID: Bank Account, Date, Currency & Big Amount Header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-6xl mx-auto space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    
                    {/* Left Filters */}
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                      {/* Bank Account */}
                      <div className="min-w-[240px]">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cuenta de depósito *</label>
                        <div className="flex items-center gap-2">
                          <select
                            value={depositForm.account}
                            onChange={(e) => setDepositForm({ ...depositForm, account: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] font-semibold cursor-pointer shadow-2xs"
                          >
                            <option value="">-- Seleccionar Cuenta --</option>
                            {connectedBanks.map((b) => (
                              <option key={b.id} value={`${b.name} (${b.accountNumber}) ${b.currency}`}>
                                {b.name} ({b.accountNumber}) {b.currency}
                              </option>
                            ))}
                            <option value="1000 - Caja General y Efectivo">1000 - Caja General y Efectivo</option>
                          </select>
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
                        <input
                          type="date"
                          value={depositForm.date}
                          onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                          className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] font-medium shadow-2xs"
                        />
                      </div>

                      {/* Currency */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Moneda *</label>
                        <select
                          value={depositForm.currency}
                          onChange={(e) => setDepositForm({ ...depositForm, currency: e.target.value })}
                          className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] font-semibold cursor-pointer shadow-2xs"
                        >
                          <option value="USD">USD Dólar estadounidense ($)</option>
                          <option value="HNL">HNL Lempira hondureño (L)</option>
                        </select>
                      </div>
                    </div>

                    {/* Big Amount Header (Matching Dashboard Metric Cards typography) */}
                    <div className="text-right bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 w-full md:w-auto">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">IMPORTE TOTAL</span>
                      <div className="text-3xl font-bold text-slate-900 mt-1">
                        ${depositFinalTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* MAIN TABLE CARD: Agregar fondos a este depósito */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs max-w-6xl mx-auto space-y-4 p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#1b426e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>Agregar fondos a este depósito</span>
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      {depositForm.lines.length} {depositForm.lines.length === 1 ? "línea registrada" : "líneas registradas"}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3 min-w-[180px]">RECIBIDO DE</th>
                            <th className="p-3 min-w-[180px]">CUENTA</th>
                            <th className="p-3 min-w-[200px]">DESCRIPCIÓN</th>
                            <th className="p-3 min-w-[160px]">MÉTODO DE PAGO</th>
                            <th className="p-3 w-36">N.º DE REFERENCIA</th>
                            <th className="p-3 w-32 text-right">IMPORTE (USD)</th>
                            <th className="p-3 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {depositForm.lines.map((line, idx) => (
                            <tr key={line.id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                              <td className="p-3">
                                <select
                                  value={line.receivedFrom}
                                  onChange={(e) => handleDepositLineChange(line.id, "receivedFrom", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e] font-medium cursor-pointer"
                                >
                                  <option value="">-- Seleccionar cliente --</option>
                                  {customers.map((c) => (
                                    <option key={c.id} value={c.name}>
                                      {c.name} {c.macolaCode ? `(${c.macolaCode})` : ""}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <select
                                  value={line.account}
                                  onChange={(e) => handleDepositLineChange(line.id, "account", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e] font-medium cursor-pointer"
                                >
                                  <option value="1100 - Cuentas por Cobrar">1100 - Cuentas por Cobrar</option>
                                  <option value="7000 - Ingresos por Ventas">7000 - Ingresos por Ventas</option>
                                  <option value="1000 - Cash and Cash Equivalents">1000 - Cash and Cash Equivalents</option>
                                  <option value="2100 - Cuentas por Pagar">2100 - Cuentas por Pagar</option>
                                  <option value="7100 - Otros Ingresos Financieros">7100 - Otros Ingresos Financieros</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={line.memo}
                                  onChange={(e) => handleDepositLineChange(line.id, "memo", e.target.value)}
                                  placeholder="Descripción del depósito..."
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={line.paymentMethod}
                                  onChange={(e) => handleDepositLineChange(line.id, "paymentMethod", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e] font-medium cursor-pointer"
                                >
                                  <option value="Transferencia bancaria">Transferencia bancaria</option>
                                  <option value="Cheque">Cheque</option>
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={line.reference}
                                  onChange={(e) => handleDepositLineChange(line.id, "reference", e.target.value)}
                                  placeholder="N.º Ref / Cheque"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#1b426e]"
                                />
                              </td>
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line.amount}
                                  onChange={(e) => handleDepositLineChange(line.id, "amount", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-right focus:outline-none focus:border-[#1b426e] font-bold"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDepositLine(line.id)}
                                  className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                                  title="Eliminar fila"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Buttons below table */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddDepositLine}
                        className="px-3.5 py-1.5 rounded-xl bg-[#fff7ed] hover:bg-[#ffedd5] text-[#1b426e] font-bold text-xs transition cursor-pointer border border-[#fed7aa] flex items-center gap-1"
                      >
                        <span>+ Agregar líneas</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllDepositLines}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition cursor-pointer border border-slate-200"
                      >
                        <span>Borrar todas las líneas</span>
                      </button>
                    </div>

                    <div className="text-right text-xs font-semibold text-slate-600">
                      Total de otros fondos: <span className="font-bold text-slate-900 text-sm ml-2">${depositTotalLines.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM GRID: Notes & Uploads on Left / Cashback & Grand Totals on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                  
                  {/* Left Column: Note & Attachment */}
                  <div className="space-y-4 text-xs">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                      <label className="block font-bold text-slate-700">Nota</label>
                      <textarea
                        rows={3}
                        value={depositForm.memo}
                        onChange={(e) => setDepositForm({ ...depositForm, memo: e.target.value })}
                        placeholder="Escribe notas adicionales o detalles del depósito bancario..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                      />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                      <label className="block font-bold text-slate-700">Archivos adjuntos</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#1b426e] transition cursor-pointer bg-slate-50/50">
                        <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xs font-semibold text-[#1b426e]">Añadir archivo adjunto</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tamaño máximo de archivo: 20 MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Cashback & Grand Totals */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs flex flex-col justify-between">
                    <div className="space-y-3 border-b border-slate-100 pb-4">
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Reembolso en efectivo</h3>
                      
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Reembolso en efectivo para</label>
                        <select
                          value={depositForm.cashbackAccount}
                          onChange={(e) => setDepositForm({ ...depositForm, cashbackAccount: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e] cursor-pointer"
                        >
                          <option value="">-- Seleccionar cuenta de reembolso --</option>
                          <option value="1000 - Cash and Cash Equivalents">1000 - Cash and Cash Equivalents</option>
                          <option value="1005 - Caja Chica">1005 - Caja Chica</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Notas de reembolso</label>
                          <input
                            type="text"
                            value={depositForm.cashbackMemo}
                            onChange={(e) => setDepositForm({ ...depositForm, cashbackMemo: e.target.value })}
                            placeholder="Notas de reembolso..."
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Importe de reembolso</label>
                          <input
                            type="number"
                            step="0.01"
                            value={depositForm.cashbackAmount}
                            onChange={(e) => setDepositForm({ ...depositForm, cashbackAmount: Number(e.target.value) })}
                            placeholder="0.00"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-right focus:outline-none focus:border-[#1b426e] font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Final Grand Totals (Matching Dashboard Metric Cards) */}
                    <div className="space-y-2 text-right pt-2 font-sans">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Total:</span>
                        <span className="font-bold text-slate-900">${depositFinalTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                        <span>Total ({depositForm.currency}):</span>
                        <span className="text-3xl font-bold text-slate-900">${depositFinalTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* FIXED BOTTOM ACTION BAR - ALIGNED TO THE RIGHT WITH SITE ORANGE BUTTON */}
              <footer className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-3 z-30 shadow-lg shrink-0">
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>

                <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleSaveDeposit(false)}
                    className="px-5 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    Guardar y cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDepositSaveDropdown(!showDepositSaveDropdown)}
                    className="px-2.5 py-2 rounded-r-lg bg-[#143355] hover:bg-[#d06512] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showDepositSaveDropdown ? "rotate-180" : "rotate-0"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDepositSaveDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDepositSaveDropdown(false);
                          handleSaveDeposit(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                      >
                        Guardar y cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDepositSaveDropdown(false);
                          handleSaveDeposit(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                      >
                        Guardar y crear nueva
                      </button>
                    </div>
                  )}
                </div>
              </footer>

            </div>
          )}

          {/* ================= VIEW: REGISTRAR GASTO (Matching Registrar Pago layout) ================= */}
          {currentView === "agregar-gasto" && (
            <div className="fixed inset-0 z-40 flex flex-col bg-[#f3f6f5] text-slate-800 animate-in fade-in duration-150 overflow-hidden">
              
              {/* TOP HEADER BAR */}
              <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit mr-1"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar</span>
                  </button>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg className="w-4 h-4 text-[#1b426e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">Registrar Gasto</h1>
                </div>

                {/* Top Right Header Controls - Clean: NO comentarios, NO gear, NO help ? */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title="Cerrar"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* MAIN SCROLLABLE CONTENT (Scrollbar flush against right edge of screen) */}
              <div className="flex-1 overflow-y-auto w-full">
                <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
                
                {gastoSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs font-semibold">
                    <span>✓ {gastoSuccessMsg}</span>
                  </div>
                )}

                {/* FORM WORKSPACE CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
                  
                  {/* TOP ROW: Beneficiario, Cuenta de pago, Fecha & IMPORTE DEL GASTO */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Form Fields (8 cols) */}
                    <div className="lg:col-span-8 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                        
                        {/* Beneficiario (6 cols) */}
                        <div className="sm:col-span-6">
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Beneficiario</label>
                          <select
                            value={gastoForm.payeeId}
                            onChange={(e) => {
                              const selected = vendors.find((v) => v.id === e.target.value);
                              setGastoForm({ ...gastoForm, payeeId: e.target.value, payeeName: selected ? selected.name : "" });
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20 font-medium cursor-pointer"
                          >
                            <option value="">¿A quién le pagaste?</option>
                            {vendors.map((v) => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Cuenta de pago (6 cols) */}
                        <div className="sm:col-span-6">
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cuenta de pago</label>
                          <select
                            value={gastoForm.paymentAccount}
                            onChange={(e) => {
                              const val = e.target.value;
                              const selectedBank = connectedBanks.find(
                                (b) => `${b.name} (${b.currency})` === val || b.name === val || b.id === val
                              );
                              setGastoForm((prev) => ({
                                ...prev,
                                paymentAccount: val,
                                currency: selectedBank ? selectedBank.currency : prev.currency,
                              }));
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20 font-medium cursor-pointer"
                          >
                            <option value="Accrued Liabilities">Accrued Liabilities</option>
                            <option value={`Cash and Cash Equivalents (${gastoCurrencyCode})`}>1000 - Cash and Cash Equivalents ({gastoCurrencyCode})</option>
                            <option value={`Caja General (${gastoCurrencyCode})`}>1005 - Caja General ({gastoCurrencyCode})</option>
                            {connectedBanks.map((b) => (
                              <option key={b.id} value={`${b.name} (${b.currency})`}>
                                {b.name} - {b.accountNumber} ({b.currency})
                              </option>
                            ))}
                          </select>
                          {(() => {
                            const selectedBank = connectedBanks.find(
                              (b) => `${b.name} (${b.currency})` === gastoForm.paymentAccount || b.name === gastoForm.paymentAccount || b.id === gastoForm.paymentAccount
                            );
                            if (selectedBank) {
                              const sym = selectedBank.currency === "USD" ? "$" : gastoCurrencySymbol;
                              const bal = selectedBank.bookBalance ?? selectedBank.bankBalance ?? 0;
                              return (
                                <span className="text-[10px] font-semibold text-slate-500 mt-1 block">
                                  Saldo en libros: {sym}{bal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                Cuenta de origen de pago
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* SECOND ROW: Fecha de pago, Método de pago, Moneda, N.º de referencia */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                        {/* Fecha de pago */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha de pago</label>
                          <input
                            type="date"
                            value={gastoForm.paymentDate}
                            onChange={(e) => setGastoForm({ ...gastoForm, paymentDate: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                          />
                        </div>

                        {/* Método de pago */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Método de pago</label>
                          <select
                            value={gastoForm.paymentMethod}
                            onChange={(e) => setGastoForm({ ...gastoForm, paymentMethod: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] cursor-pointer"
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                          </select>
                        </div>

                        {/* Moneda */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Moneda</label>
                          <select
                            value={gastoCurrencyCode}
                            onChange={(e) => setGastoForm({ ...gastoForm, currency: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:border-[#1b426e] cursor-pointer"
                          >
                            <option value="HNL">HNL (Lps)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>

                        {/* N.º de referencia */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">N.º de referencia</label>
                          <input
                            type="text"
                            placeholder="Ej. REF-8849"
                            value={gastoForm.refNumber}
                            onChange={(e) => setGastoForm({ ...gastoForm, refNumber: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Right Column: IMPORTE DEL GASTO big stat box (4 cols - matching Registrar Pago layout) */}
                    <div className="lg:col-span-4 text-right space-y-1 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        IMPORTE DEL GASTO
                      </span>
                      <div className="text-4xl font-bold text-slate-900 font-sans tracking-tight">
                        {gastoCurrencySymbol}{gastoTotal.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-500 pt-1">
                        <span>Moneda oficial </span>
                        <span className="font-semibold text-slate-700">{gastoCurrencyCode} ({gastoCurrencySymbol})</span>
                      </div>
                    </div>
                  </div>

                  {/* LINE ITEMS TABLE CARD */}
                  <div className="pt-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Categoría e importe del gasto</h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3 min-w-[220px]">CATEGORÍA</th>
                            <th className="p-3 min-w-[320px]">DESCRIPCIÓN</th>
                            <th className="p-3 w-36 text-right">IMPORTE ({gastoCurrencyCode})</th>
                            <th className="p-3 w-16 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {gastoForm.lines.map((line, idx) => (
                            <tr key={line.id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3">
                                <select
                                  value={line.category}
                                  onChange={(e) => handleGastoLineChange(line.id, "category", e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#1b426e] cursor-pointer"
                                >
                                  <option value="">-- Seleccionar categoría --</option>
                                  <option value="Publicidad y Propaganda">Publicidad y Propaganda</option>
                                  <option value="Servicios Públicos (Agua/Luz/Teléfono)">Servicios Públicos (Agua/Luz/Teléfono)</option>
                                  <option value="Reparación y Mantenimiento">Reparación y Mantenimiento</option>
                                  <option value="Materia Prima e Insumos Flexo">Materia Prima e Insumos Flexo</option>
                                  <option value="Gastos de Transporte y Fletes">Gastos de Transporte y Fletes</option>
                                  <option value="Seguros y Fianzas">Seguros y Fianzas</option>
                                  <option value="Honorarios Profesionales">Honorarios Profesionales</option>
                                  <option value="Gastos de Representación">Gastos de Representación</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="Detalle o descripción del gasto..."
                                  value={line.description}
                                  onChange={(e) => handleGastoLineChange(line.id, "description", e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#1b426e]"
                                />
                              </td>
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={line.amount || ""}
                                  onChange={(e) => handleGastoLineChange(line.id, "amount", Number(e.target.value))}
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 text-right focus:outline-none focus:border-[#1b426e] font-bold"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateGastoLine(line.id)}
                                    className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                                    title="Duplicar línea"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGastoLine(line.id)}
                                    className="text-slate-400 hover:text-red-600 transition cursor-pointer p-1"
                                    title="Eliminar línea"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Under Table Action Buttons & Total */}
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddGastoLine}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          Agregar líneas
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllGastoLines}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          Borrar todas las líneas
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-600 mr-4">Total</span>
                        <span className="text-base font-bold text-slate-900">{gastoCurrencySymbol}{gastoTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM WORKSPACE: Nota & Archivos adjuntos (matching Registrar Pago) */}
                  <div className="pt-6 border-t border-slate-100 space-y-6">
                    {/* Nota */}
                    <div className="max-w-md">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nota</label>
                      <textarea
                        rows={3}
                        placeholder="Escribe comentarios o notas del gasto..."
                        value={gastoForm.notes}
                        onChange={(e) => setGastoForm({ ...gastoForm, notes: e.target.value })}
                        className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] resize-none"
                      />
                    </div>

                    {/* Archivos adjuntos */}
                    <div className="max-w-md space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Archivos adjuntos</label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-[#1b426e] rounded-xl p-6 text-center space-y-1 cursor-pointer transition bg-slate-50/50 hover:bg-slate-50">
                        <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xs font-semibold text-[#0066cc]">Añadir archivo adjunto</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tamaño máximo de archivo: 20 MB</p>
                        <button type="button" className="text-[11px] text-[#0066cc] font-medium hover:underline pt-2">Mostrar existentes</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

              {/* FIXED BOTTOM ACTION BAR - RIGHT ALIGNED WITH SITE ORANGE BUTTON */}
              <footer className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-3 z-30 shadow-lg shrink-0">
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>

                <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleSaveGasto(false)}
                    className="px-5 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    Guardar y cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGastoSaveDropdown(!showGastoSaveDropdown)}
                    className="px-2.5 py-2 rounded-r-lg bg-[#143355] hover:bg-[#d06512] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showGastoSaveDropdown ? "rotate-180" : "rotate-0"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showGastoSaveDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setShowGastoSaveDropdown(false);
                          handleSaveGasto(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                      >
                        Guardar y cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowGastoSaveDropdown(false);
                          handleSaveGasto(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                      >
                        Guardar y crear nuevo
                      </button>
                    </div>
                  )}
                </div>
              </footer>
            </div>
          )}

          {/* ================= VIEW: PAGAR FACTURAS DE PROVEEDORES ================= */}
          {currentView === "pagar-proveedor" && (
            <div className="fixed inset-0 z-40 flex flex-col bg-[#f8faf9] text-slate-800 animate-in fade-in duration-150 overflow-hidden">
              
              {/* TOP HEADER BAR */}
              <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToView("pagos-proveedores")}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit mr-1"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar</span>
                  </button>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pagar facturas de proveedores</h1>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToView("pagos-proveedores")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Cerrar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </header>

              {/* MAIN SCROLLABLE CONTENT (Scrollbar flush against right edge of screen) */}
              <div className="flex-1 overflow-y-auto w-full">
                <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
                  
                  {pagarProveedorSuccessMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs font-semibold">
                      <span>✓ {pagarProveedorSuccessMsg}</span>
                    </div>
                  )}

                  {/* FORM & FILTERS WORKSPACE */}
                  <div className="space-y-6">
                    
                    {/* Top Row: Cuenta de pago & Fecha de pago */}
                    <div className="flex flex-wrap items-center gap-6">
                      {/* Cuenta de pago */}
                      <div className="w-64">
                        <label className="block text-xs text-slate-500 font-medium mb-1">Cuenta de pago</label>
                        <select
                          value={pagarProveedorForm.account}
                          onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, account: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20 font-medium cursor-pointer shadow-2xs"
                        >
                          <option value="Seleccionar una cuenta">Seleccionar una cuenta</option>
                          {connectedBanks && connectedBanks.length > 0 ? (
                            connectedBanks.map((b) => (
                              <option key={b.id} value={`${b.name} (${b.accountNumber}) ${b.currency}`}>
                                {b.name} - {b.accountNumber} ({b.currency})
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="1000 - Cash and cash equivalents">1000 - Cash and cash equivalents</option>
                              <option value="1005 - Caja Chica">1005 - Caja Chica</option>
                            </>
                          )}
                          {connectedBanks && connectedBanks.length > 0 && (
                            <>
                              <option value="1000 - Cash and cash equivalents">1000 - Cash and cash equivalents</option>
                              <option value="1005 - Caja Chica">1005 - Caja Chica</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Fecha de pago */}
                      <div className="w-48">
                        <label className="block text-xs text-slate-500 font-medium mb-1">Fecha de pago</label>
                        <input
                          type="date"
                          value={pagarProveedorForm.paymentDate}
                          onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, paymentDate: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Second Row: Moneda, Método de pago, N.º de referencia */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="w-64">
                        <label className="block text-xs text-slate-500 font-medium mb-1">Moneda</label>
                        <select
                          value={pagarProveedorForm.currency}
                          onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, currency: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20 font-medium cursor-pointer shadow-2xs"
                        >
                          <option value="HNL - Lempira hondureño">HNL - Lempira hondureño</option>
                          <option value="USD - Dólar estadounidense">USD - Dólar estadounidense</option>
                          <option value="EUR - Euro">EUR - Euro</option>
                        </select>
                      </div>

                      <div className="w-48">
                        <label className="block text-xs text-slate-500 font-medium mb-1">Método de pago</label>
                        <select
                          value={pagarProveedorForm.paymentMethod}
                          onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, paymentMethod: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20 font-medium cursor-pointer shadow-2xs"
                        >
                          <option value="Transferencia Bancaria">Transferencia Bancaria (ACH)</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                        </select>
                      </div>

                      <div className="w-48">
                        <label className="block text-xs text-slate-500 font-medium mb-1">N.º de referencia / Cheque</label>
                        <input
                          type="text"
                          placeholder="Ej. CHQ-99401"
                          value={pagarProveedorForm.refNumber}
                          onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, refNumber: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Filter Pills & Interactive Popover */}
                    <div className="relative pt-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowPagarProveedorFilterPopover(!showPagarProveedorFilterPopover)}
                          className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                            showPagarProveedorFilterPopover
                              ? "border-[#1b426e] text-[#1b426e] bg-[#fff7ed]"
                              : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <span>Filtros</span>
                          <svg className={`w-3.5 h-3.5 transition-transform ${showPagarProveedorFilterPopover ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <span className="px-3.5 py-1.5 rounded-full bg-slate-200/70 text-slate-700 text-xs font-medium">
                          {pagarProveedorForm.dueDateFilter}
                        </span>
                      </div>

                      {/* FLOATING FILTER POPOVER (Matches exact screenshot layout) */}
                      {showPagarProveedorFilterPopover && (
                        <div className="absolute left-0 top-11 z-40 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-bold text-slate-800">Filtros</span>
                            <button
                              type="button"
                              onClick={() => setShowPagarProveedorFilterPopover(false)}
                              className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Fecha de vencimiento, De, Para */}
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-6">
                              <label className="block text-[11px] text-slate-500 font-medium mb-1">Fecha de vencimiento</label>
                              <select
                                value={pagarProveedorForm.dueDateFilter}
                                onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, dueDateFilter: e.target.value })}
                                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                              >
                                <option value="Últimos 365 días">Últimos 365 días</option>
                                <option value="Este mes">Este mes</option>
                                <option value="Próximos 30 días">Próximos 30 días</option>
                                <option value="Personalizado">Personalizado</option>
                              </select>
                            </div>
                            <div className="col-span-3">
                              <label className="block text-[11px] text-slate-500 font-medium mb-1">De</label>
                              <input
                                type="date"
                                value={pagarProveedorForm.dateFrom}
                                onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, dateFrom: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-[11px] text-slate-500 font-medium mb-1">Para</label>
                              <input
                                type="date"
                                value={pagarProveedorForm.dateTo}
                                onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, dateTo: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                              />
                            </div>
                          </div>

                          {/* Beneficiario */}
                          <div>
                            <label className="block text-[11px] text-slate-500 font-medium mb-1">Beneficiario</label>
                            <select
                              value={pagarProveedorForm.payeeFilter}
                              onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, payeeFilter: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                            >
                              <option value="Todo">Todo</option>
                              {vendors.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Checkbox: Solo estado Vencida */}
                          <div className="pt-1">
                            <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pagarProveedorForm.onlyOverdue}
                                onChange={(e) => setPagarProveedorForm({ ...pagarProveedorForm, onlyOverdue: e.target.checked })}
                                className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e]"
                              />
                              <span>Solo estado Vencida</span>
                            </label>
                          </div>

                          {/* Action Buttons: Restablecer & Aplicar */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setPagarProveedorForm((prev) => ({
                                  ...prev,
                                  dueDateFilter: "Últimos 365 días",
                                  dateFrom: "",
                                  dateTo: "",
                                  payeeFilter: "Todo",
                                  onlyOverdue: false,
                                }));
                              }}
                              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                            >
                              Restablecer
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPagarProveedorFilterPopover(false)}
                              className="px-5 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MAIN CONTENT AREA: Empty State matching screenshot vs Vendor Bills Table */}
                    {filteredVendorBills.length === 0 ? (
                      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
                        <p className="text-base text-slate-700 font-medium">
                          Parece que no tienes ninguna factura de proveedor para pagar.
                        </p>
                        <button
                          type="button"
                          onClick={() => onNavigateToView("factura-compra-editor")}
                          className="text-xs text-slate-500 hover:underline cursor-pointer block mx-auto font-medium"
                        >
                          Ingresa una factura de proveedor para programar un pago.
                        </button>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => onNavigateToView("factura-compra-editor")}
                            className="px-6 py-3 rounded-2xl bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer shadow-md inline-flex items-center gap-2"
                          >
                            Ingresar nueva factura de proveedor
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Vendor Bills Table when bills are loaded */
                      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs space-y-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                              <tr>
                                <th className="p-3 w-10 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedBillIds.length === filteredVendorBills.length && filteredVendorBills.length > 0}
                                    onChange={handleToggleSelectAllBills}
                                    className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e]"
                                  />
                                </th>
                                <th className="p-3">BENEFICIARIO</th>
                                <th className="p-3">N.º DE FACTURA</th>
                                <th className="p-3">FECHA DE VENCIMIENTO</th>
                                <th className="p-3 text-right">IMPORTE ORIGINAL</th>
                                <th className="p-3 text-right">SALDO PENDIENTE</th>
                                <th className="p-3 text-right w-40">IMPORTE A PAGAR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {filteredVendorBills.map((bill) => {
                                const isSelected = selectedBillIds.includes(bill.id);
                                return (
                                  <tr key={bill.id} className={`hover:bg-slate-50 transition ${isSelected ? "bg-[#fff7ed]/60" : ""}`}>
                                    <td className="p-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectBill(bill.id)}
                                        className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e]"
                                      />
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800">{bill.vendorName}</td>
                                    <td className="p-3 font-mono text-slate-600">{bill.billNumber}</td>
                                    <td className="p-3 text-slate-600">{bill.dueDate}</td>
                                    <td className="p-3 text-right font-mono">{pagarProveedorCurrencySymbol}{bill.originalAmount.toFixed(2)}</td>
                                    <td className="p-3 text-right font-mono font-bold text-slate-900">{pagarProveedorCurrencySymbol}{bill.balanceDue.toFixed(2)}</td>
                                    <td className="p-3 text-right">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={customBillAmounts[bill.id] ?? bill.balanceDue}
                                        onChange={(e) => setCustomBillAmounts({ ...customBillAmounts, [bill.id]: Number(e.target.value) })}
                                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 text-right font-bold focus:outline-none focus:border-[#1b426e]"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>

              {/* FIXED BOTTOM ACTION BAR */}
              <footer className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between z-30 shadow-lg shrink-0">
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Facturas seleccionadas: </span>
                    <span className="font-bold text-slate-900">{selectedBillIds.length} de {filteredVendorBills.length}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider block">TOTAL A PAGAR</span>
                    <span className="text-3xl font-bold text-[#1b426e]">{pagarProveedorCurrencySymbol}{totalPagarSum.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {pagarProveedorCurrencyCode}</span>
                  </div>

                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToView("pagos-proveedores")}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                    <button
                      type="button"
                      disabled={selectedBillIds.length === 0}
                      onClick={() => handleSavePagarProveedor(false)}
                      className="px-5 py-2.5 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{selectedBillIds.length > 0 ? `Pagar ${pagarProveedorCurrencySymbol}${totalPagarSum.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${pagarProveedorCurrencyCode}` : "Pagar facturas"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={selectedBillIds.length === 0}
                      onClick={() => setShowPagarProveedorSaveDropdown(!showPagarProveedorSaveDropdown)}
                      className="px-2.5 py-2.5 rounded-r-lg bg-[#143355] hover:bg-[#d06512] disabled:bg-slate-400 disabled:cursor-not-allowed text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${showPagarProveedorSaveDropdown ? "rotate-180" : "rotate-0"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showPagarProveedorSaveDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPagarProveedorSaveDropdown(false);
                            handleSavePagarProveedor(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Pagar y cerrar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPagarProveedorSaveDropdown(false);
                            handleSavePagarProveedor(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Programar pago
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </footer>
            </div>
          )}

          {/* ================= VIEW: RECIBIR PAGO ================= */}
          {currentView === "recibir-pago" && (
            <>
            <div className="fixed inset-0 z-40 flex flex-col bg-[#f3f6f5] text-slate-800 animate-in fade-in duration-150 overflow-hidden print:hidden no-print">
              
              {/* TOP HEADER BAR */}
              <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit mr-1"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar</span>
                  </button>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">Registrar Pago</h1>
                </div>

                {/* Top Right Header Controls - NO comentarios, NO question icon per directive */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRequestCancelRecibirPago}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title="Cerrar"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* MAIN SCROLLABLE CONTENT (Scrollbar flush against right edge of screen) */}
              <div className="flex-1 overflow-y-auto w-full">
                <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
                
                {recibirPagoSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs font-semibold">
                    <span>✓ {recibirPagoSuccessMsg}</span>
                  </div>
                )}
                {recibirPagoErrorMsg && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between shadow-xs font-semibold">
                    <span>⚠ {recibirPagoErrorMsg}</span>
                  </div>
                )}

                {/* FORM WORKSPACE CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
                  
                  {/* TOP ROW: Cliente, Correo electrónico, Buscar por n.º de factura & IMPORTE RECIBIDO */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Form Fields (8 cols) */}
                    <div className="lg:col-span-8 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                        
                        {/* Cliente (5 cols) */}
                        <div className="sm:col-span-5">
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cliente</label>
                          <select
                            value={recibirPagoForm.customerId}
                            onChange={(e) => handleRecibirPagoCustomerChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20"
                          >
                            <option value="">Elige un cliente</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} {c.macolaCode ? `(${c.macolaCode})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Correo electrónico (4 cols) */}
                        <div className="sm:col-span-4 relative">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-semibold text-slate-600">Correo electrónico</label>
                            <button
                              type="button"
                              onClick={() => setShowCcCcoPopover(!showCcCcoPopover)}
                              className="text-[11px] font-medium text-[#0066cc] hover:underline cursor-pointer"
                            >
                              CC / CCO
                            </button>
                          </div>

                          {/* Popover CC / CCO */}
                          {showCcCcoPopover && (
                            <div className="absolute left-0 sm:-left-4 top-8 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                              {/* Popover Arrow tail */}
                              <div className="absolute -top-2 right-4 sm:left-12 w-4 h-4 bg-white border-t border-l border-slate-200 rotate-45" />

                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">CC</label>
                                <input
                                  type="text"
                                  placeholder=""
                                  value={recibirPagoForm.emailCc}
                                  onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, emailCc: e.target.value })}
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">CCO</label>
                                <input
                                  type="text"
                                  placeholder=""
                                  value={recibirPagoForm.emailCco}
                                  onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, emailCco: e.target.value })}
                                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                                />
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowCcCcoPopover(false)}
                                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl cursor-pointer transition"
                                >
                                  Listo
                                </button>
                              </div>
                            </div>
                          )}

                          <input
                            type="email"
                            placeholder="Correo electrónico (separa las direcciones con comas)"
                            value={recibirPagoForm.customerEmail}
                            onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, customerEmail: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] focus:ring-1 focus:ring-[#1b426e]/20"
                          />
                          <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recibirPagoForm.sendLater}
                              onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, sendLater: e.target.checked })}
                              className="rounded border-slate-300 text-[#1b426e] focus:ring-[#1b426e]"
                            />
                            <span>Enviar más adelante</span>
                          </label>
                        </div>

                        {/* Buscar por n.º de factura button / Factura vinculada (3 cols) */}
                        <div className="sm:col-span-3 pt-6 sm:pt-6">
                          {recibirPagoForm.invoiceNumber ? (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-xs shadow-xs">
                              <div className="truncate">
                                <span className="text-[10px] text-emerald-600 block uppercase font-bold tracking-wider leading-none">Factura</span>
                                <span className="font-bold text-emerald-900 leading-tight">#{recibirPagoForm.invoiceNumber}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setRecibirPagoForm((prev) => ({
                                    ...prev,
                                    invoiceNumber: "",
                                    referenceNumber: "",
                                  }))
                                }
                                className="text-slate-400 hover:text-rose-600 font-bold ml-1.5 cursor-pointer text-base leading-none p-1 rounded hover:bg-rose-50 transition"
                                title="Desvincular factura"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowInvoiceSearchModal(true)}
                              className="w-full px-3 py-2 rounded-lg border border-[#1b426e] text-[#1b426e] hover:bg-[#fff7ed] font-semibold text-xs transition cursor-pointer text-center whitespace-nowrap"
                            >
                              Buscar por n.º de factura
                            </button>
                          )}
                        </div>
                      </div>

                      {/* SECOND ROW: Fecha de pago, Método de pago, N.º de referencia, Depositar en, Moneda, Importe recibido */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
                        {/* Fecha de pago */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha de pago</label>
                          <input
                            type="date"
                            value={recibirPagoForm.paymentDate}
                            onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, paymentDate: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                          />
                        </div>

                        {/* Método de pago */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Método de pago</label>
                          <select
                            value={recibirPagoForm.paymentMethod}
                            onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, paymentMethod: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                          >
                            <option value="Seleccionar método de pago">Seleccionar método de pago</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia ACH">Transferencia ACH</option>
                            <option value="Depósito bancario">Depósito bancario</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Tarjeta de crédito">Tarjeta de crédito</option>
                            <option value="Tarjeta de débito">Tarjeta de débito</option>
                          </select>
                        </div>

                        {/* N.º de referencia */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">N.º de referencia</label>
                          <input
                            type="text"
                            placeholder=""
                            value={recibirPagoForm.referenceNumber}
                            onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, referenceNumber: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                          />
                        </div>

                        {/* Depositar en */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Depositar en</label>
                          <select
                            value={recibirPagoForm.depositAccount}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matchedBank = connectedBanks.find(
                                (b) => `${b.name} (${b.currency})` === val || b.id === val || b.name === val
                              );
                              setRecibirPagoForm((prev) => ({
                                ...prev,
                                depositAccount: val,
                                bankAccountId: matchedBank ? matchedBank.id : undefined,
                              }));
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e]"
                          >
                            <option value="Cash and cash equivalents">Cash and cash equivalents</option>
                            <option value={`Caja General (${activeCurrencyCode})`}>Caja General ({activeCurrencyCode})</option>
                            {connectedBanks.map((b) => (
                              <option key={b.id} value={`${b.name} (${b.currency})`}>
                                {b.name} - {b.accountNumber} ({b.currency})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Moneda */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Moneda</label>
                          <select
                            value={activeCurrencyCode}
                            onChange={(e) => setRecibirPagoForm((prev) => ({ ...prev, currency: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:border-[#1b426e] cursor-pointer"
                          >
                            <option value="HNL">HNL (Lempiras - L)</option>
                            <option value="USD">USD (Dólares - $)</option>
                            {defaultCurrencyCode && defaultCurrencyCode !== "HNL" && defaultCurrencyCode !== "USD" && (
                              <option value={defaultCurrencyCode}>{defaultCurrencyCode}</option>
                            )}
                          </select>
                        </div>

                        {/* Importe recibido */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Importe recibido</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              {activeCurrencySymbol}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={recibirPagoForm.amount || ""}
                              onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, amount: parseFloat(e.target.value) || 0 })}
                              className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-mono text-right focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: IMPORTE RECIBIDO big stat box (4 cols) */}
                    <div className="lg:col-span-4 text-right space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        IMPORTE RECIBIDO ({activeCurrencyCode})
                      </span>
                      <div className="text-4xl font-light text-slate-900 font-sans tracking-tight">
                        {activeCurrencySymbol}{(recibirPagoForm.amount || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-500 pt-1">
                        <span>Cliente saldo </span>
                        <span className="font-semibold text-slate-700">
                          {activeCurrencySymbol}{customerBalance.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM WORKSPACE: Nota & Archivos adjuntos */}
                  <div className="pt-6 border-t border-slate-100 space-y-6">
                    {/* Nota */}
                    <div className="max-w-md">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nota</label>
                      <textarea
                        rows={3}
                        placeholder="Nota"
                        value={recibirPagoForm.note}
                        onChange={(e) => setRecibirPagoForm({ ...recibirPagoForm, note: e.target.value })}
                        className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1b426e] resize-none"
                      />
                    </div>

                    {/* Archivos adjuntos */}
                    <div className="max-w-md space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Archivos adjuntos</label>
                      <div
                        onClick={() => paymentFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-[#1b426e] rounded-xl p-6 text-center space-y-1 cursor-pointer transition bg-slate-50/50 hover:bg-slate-50"
                      >
                        <input
                          ref={paymentFileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setRecibirPagoForm((prev) => ({ ...prev, attachmentName: file.name }));
                            }
                          }}
                        />
                        <button type="button" className="text-xs font-medium text-[#0066cc] hover:underline cursor-pointer block mx-auto">
                          Añadir archivo adjunto
                        </button>
                        <p className="text-[11px] text-slate-400">
                          {recibirPagoForm.attachmentName ? `Adjunto: ${recibirPagoForm.attachmentName}` : "Tamaño máximo de archivo: 20 MB"}
                        </p>
                      </div>
                    </div>

                    {/* Tarjeta de Impacto Contable Proyectado */}
                    <div className="max-w-md p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-blue-900 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-xs text-blue-800">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Partida Doble Automática en Libros (al Guardar)</span>
                      </div>
                      <p className="text-[11px] text-blue-700">
                        Al registrar este pago, el sistema generará de forma automática el asiento en el Libro Diario:
                      </p>
                      <div className="space-y-1 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-blue-100">
                        <div className="flex justify-between text-slate-700">
                          <span>[Débito] 1100 - Bancos</span>
                          <span className="font-semibold text-emerald-700">+{activeCurrencySymbol}{(recibirPagoForm.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>[Crédito] 1200 - CxC Clientes</span>
                          <span className="font-semibold text-slate-900">-{activeCurrencySymbol}{(recibirPagoForm.amount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

              {/* FOOTER BAR */}
              <footer className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-3 sticky bottom-0 z-30 shadow-md">
                {/* Cancelar */}
                <button
                  type="button"
                  onClick={handleRequestCancelRecibirPago}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                {/* Imprimir */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                >
                  Imprimir
                </button>

                {/* Guardar */}
                <button
                  type="button"
                  disabled={recibirPagoLoading}
                  onClick={() => handleSaveRecibirPago(false)}
                  className="px-4 py-2 rounded-lg border border-[#1b426e] bg-white text-[#1b426e] hover:bg-[#fff7ed] font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Guardar
                </button>

                {/* Guardar y cerrar split-button */}
                <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                  <button
                    type="button"
                    disabled={recibirPagoLoading}
                    onClick={() => handleSaveRecibirPago(true)}
                    className="px-5 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-md shadow-[#1b426e]/20"
                  >
                    {recibirPagoLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Guardar y cerrar</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRecibirPagoSaveDropdown(!showRecibirPagoSaveDropdown)}
                    className="px-2.5 py-2 rounded-r-lg bg-[#143355] hover:bg-[#d06512] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${showRecibirPagoSaveDropdown ? "rotate-180" : "rotate-0"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showRecibirPagoSaveDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecibirPagoSaveDropdown(false);
                          handleSaveRecibirPago(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                      >
                        Guardar y cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecibirPagoSaveDropdown(false);
                          handleSaveRecibirPago(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                      >
                        Guardar y nuevo
                      </button>
                    </div>
                  )}
                </div>
              </footer>

              {/* MODAL: BUSCAR POR N.º DE FACTURA */}
              {showInvoiceSearchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                  <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceSearchModal(false)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div>
                      <span className="text-[11px] font-bold text-[#1b426e] uppercase tracking-wider block">Búsqueda Rápida</span>
                      <h3 className="font-bold text-lg text-slate-900">Buscar por N.º de Factura</h3>
                      <p className="text-xs text-slate-500">Ingresa el número de factura o selecciona una de la lista para importar cliente e importe automáticamente.</p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. 1001 o nombre de cliente"
                        value={searchInvoiceNumber}
                        onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleImportInvoiceData(searchInvoiceNumber);
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#1b426e] text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleImportInvoiceData(searchInvoiceNumber)}
                        className="px-5 py-2.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition cursor-pointer shadow-md shadow-[#1b426e]/20"
                      >
                        Buscar
                      </button>
                    </div>

                    {/* Quick Selection List */}
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-500 mb-2 block uppercase tracking-wider">Facturas Disponibles:</span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {invoicesList
                          .filter((inv) =>
                            !searchInvoiceNumber ||
                            inv.num.includes(searchInvoiceNumber) ||
                            inv.customer.toLowerCase().includes(searchInvoiceNumber.toLowerCase())
                          )
                          .map((inv) => (
                            <div
                              key={inv.num}
                              onClick={() => handleImportInvoiceData(inv.num)}
                              className="p-3 rounded-xl border border-slate-200 hover:border-[#1b426e] bg-slate-50/50 hover:bg-[#fff7ed] transition cursor-pointer flex items-center justify-between group"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 group-hover:text-[#1b426e]">Factura #{inv.num}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inv.status === "Pendiente" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                                  }`}>
                                    {inv.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">{inv.customer}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-xs text-slate-900 block">
                                  {(inv.currency?.toUpperCase().includes("USD") ? "$" : (inv.currency?.toUpperCase().includes("HNL") ? "L" : activeCurrencySymbol))}
                                  {inv.total.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-[#1b426e] font-semibold group-hover:underline">Seleccionar →</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowInvoiceSearchModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL: CONFIRMAR CANCELACIÓN Y BORRADO DE PAGO */}
              {showCancelPaymentConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                  <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mb-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-slate-900">¿Salir sin guardar el pago?</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Si cancelas ahora, se borrarán todos los cambios e información ingresada en este registro de pago.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowCancelPaymentConfirmModal(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition order-2 sm:order-1"
                      >
                        Seguir editando
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDiscardPaymentChanges}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-red-600/20 order-1 sm:order-2"
                      >
                        Descartar cambios y salir
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* ================= COMPROBANTE OFICIAL DE PAGO / RECIBO DE CAJA (DOCUMENTO DE MEDIA PÁGINA) ================= */}
            <div id="printable-payment-receipt" className="hidden print:block printable-document">
              <div className="p-6 max-w-3xl mx-auto bg-white text-slate-900 border-2 border-slate-900 rounded-xl space-y-4 shadow-none text-xs">
                
                {/* 1. Header: Empresa & Título del Documento */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div className="space-y-0.5">
                    <h1 className="text-base font-black text-[#1b426e] uppercase tracking-tight">
                      {companySettings.nombreLegal || companySettings.nombre || "EMPRESA S.A."}
                    </h1>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      {[
                        companySettings.taxId ? `RTN: ${companySettings.taxId}` : "",
                        companySettings.telefono ? `Tel: ${companySettings.telefono}` : "",
                        companySettings.email ? `Email: ${companySettings.email}` : ""
                      ].filter(Boolean).join(" | ")}
                    </p>
                    {companySettings.direccion && (
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {companySettings.direccion}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block bg-[#1b426e] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                      RECIBO DE CAJA / COBRO
                    </span>
                    <div className="font-mono font-bold text-sm text-slate-900 mt-1">
                      N.º {recibirPagoForm.referenceNumber
                        ? (recibirPagoForm.referenceNumber.startsWith("REC-") ? recibirPagoForm.referenceNumber : `REC-${recibirPagoForm.referenceNumber}`)
                        : (recibirPagoForm.invoiceNumber ? `REC-FAC-${recibirPagoForm.invoiceNumber}` : `REC-${recibirPagoForm.paymentDate.replace(/-/g, "")}`)}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      <strong>Fecha:</strong> {recibirPagoForm.paymentDate}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      <strong>Moneda:</strong> {activeCurrencyCode} ({activeCurrencySymbol})
                    </div>
                  </div>
                </div>

                {/* 2. Bloque Principal: Cliente & Total Destacado */}
                <div className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="col-span-7 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recibimos de (Cliente):
                    </div>
                    <div className="text-sm font-black text-slate-900 leading-tight">
                      {recibirPagoForm.customerName || "Consumidor Final"}
                    </div>
                    {recibirPagoForm.customerEmail && (
                      <div className="text-[10px] text-slate-600">
                        {recibirPagoForm.customerEmail}
                      </div>
                    )}
                    {recibirPagoForm.invoiceNumber && (
                      <div className="text-[10px] font-medium text-slate-700">
                        <strong>Documento Vinculado:</strong> Factura N.º {recibirPagoForm.invoiceNumber}
                      </div>
                    )}
                  </div>

                  <div className="col-span-5 bg-white p-2.5 rounded-lg border border-slate-300 text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      IMPORTE TOTAL RECIBIDO
                    </span>
                    <span className="text-xl font-mono font-black text-slate-900 block leading-tight">
                      {activeCurrencySymbol}{(recibirPagoForm.amount || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrencyCode}
                    </span>
                  </div>
                </div>

                {/* 3. Valor en Letras */}
                <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-700">La suma de: </span>
                  <span className="font-bold text-slate-900 uppercase">
                    "{numberToWordsSpanish(recibirPagoForm.amount || 0, activeCurrencySymbol)}"
                  </span>
                </div>

                {/* 4. Tabla de Detalle del Pago */}
                <table className="w-full text-[11px] border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="p-2 text-left">Concepto / Motivo</th>
                      <th className="p-2 text-left">Método de Pago</th>
                      <th className="p-2 text-left">N.º Referencia</th>
                      <th className="p-2 text-left">Depositado en</th>
                      <th className="p-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 font-medium text-slate-800">
                        {recibirPagoForm.invoiceNumber
                          ? `Abono / Cancelación Factura #${recibirPagoForm.invoiceNumber}`
                          : (recibirPagoForm.note || "Abono a Cuenta por Cobrar")}
                      </td>
                      <td className="p-2 text-slate-700">{recibirPagoForm.paymentMethod}</td>
                      <td className="p-2 font-mono text-slate-700">{recibirPagoForm.referenceNumber || "—"}</td>
                      <td className="p-2 text-slate-700">{recibirPagoForm.depositAccount}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {activeCurrencySymbol}{(recibirPagoForm.amount || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. Notas & Saldo de Cliente */}
                <div className="flex justify-between items-center text-[10px] text-slate-600 px-1">
                  <div>
                    {recibirPagoForm.note ? (
                      <span><strong>Observaciones:</strong> {recibirPagoForm.note}</span>
                    ) : (
                      <span>Comprobante emitido a conformidad del cliente.</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span>Saldo pendiente cliente: </span>
                    <strong className="font-mono text-slate-800">
                      {activeCurrencySymbol}{customerBalance.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {/* 6. Bloque de Firmas (Media Página) */}
                <div className="pt-6 grid grid-cols-2 gap-10 text-center text-[10px] text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-800">Entregado Conforme</p>
                    <p className="text-[9px] text-slate-400">Firma del Cliente / Pagador</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-44 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-800">Recibido Conforme / Sello</p>
                    <p className="text-[9px] text-slate-400">{companySettings.nombreLegal || companySettings.nombre || "Departamento de Caja"}</p>
                  </div>
                </div>

                {/* 7. Pie informativo */}
                <div className="pt-2 border-t border-dashed border-slate-300 text-center text-[9px] text-slate-400 flex items-center justify-between">
                  <span>Original: Cliente | Copia: Contabilidad</span>
                  <span>Documento no negociable emitido por Prado ERP</span>
                </div>

              </div>
            </div>
            </>
          )}

    </>
  );
}
