"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Printer, Download, CreditCard, Clock } from "lucide-react";
import { TableRowsSkeleton } from "@/components/Skeleton";
import {
  Customer,
  InventoryItem,
  CompanySettings,
  Invoice,
  InvoiceLine,
  InvoiceFormData,
  InvoiceDesign,
  BankAccount,
} from "@/types/dashboard";

export interface InvoicesModuleProps {
  currentView: "lista-facturas" | "factura-editor";
  editingInvoice?: any | null;
  invoicesList: Invoice[];
  setInvoicesList: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  inventory: InventoryItem[];
  connectedBanks?: BankAccount[];
  companySettings: CompanySettings;
  salesSettings: any;
  companyLogo?: string | null;
  defaultCurrencySymbol?: string;
  loading?: boolean;
  onNavigateToDashboard: () => void;
  onNavigateToSettings?: () => void;
  onOpenInvoiceEditor: (invoice?: any) => void;
  onCloseInvoiceEditor: () => void;
  onRefreshAccounts?: () => void;
}

export const numberToWordsSpanish = (amount: number, currencySymbol = "$"): string => {
  if (isNaN(amount) || amount === 0) return "CERO CON .00/100";

  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const diezY = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const veinti = ["VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  const convertHundreds = (n: number): string => {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    let str = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) str += centenas[c] + " ";

    if (d === 1) {
      str += diezY[u];
    } else if (d === 2) {
      str += veinti[u];
    } else if (d > 2) {
      str += decenas[d];
      if (u > 0) str += " Y " + unidades[u];
    } else if (u > 0) {
      str += unidades[u];
    }
    return str.trim();
  };

  const convertThousands = (n: number): string => {
    if (n === 0) return "";
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    let str = "";
    if (thousands === 1) {
      str = "MIL ";
    } else if (thousands > 1) {
      str = convertHundreds(thousands) + " MIL ";
    }
    if (rest > 0) {
      str += convertHundreds(rest);
    }
    return str.trim();
  };

  const convertMillions = (n: number): string => {
    if (n === 0) return "CERO";
    const millions = Math.floor(n / 1000000);
    const rest = n % 1000000;
    let str = "";
    if (millions === 1) {
      str = "UN MILLÓN ";
    } else if (millions > 1) {
      str = convertHundreds(millions) + " MILLONES ";
    }
    if (rest > 0) {
      if (rest >= 1000) {
        str += convertThousands(rest);
      } else {
        str += convertHundreds(rest);
      }
    }
    return str.trim();
  };

  const absAmount = Math.abs(amount);
  const intPart = Math.floor(absAmount);
  const decPart = Math.round((absAmount - intPart) * 100);
  const decStr = decPart.toString().padStart(2, "0");

  let words = "";
  if (intPart < 1000) {
    words = convertHundreds(intPart);
  } else if (intPart < 1000000) {
    words = convertThousands(intPart);
  } else {
    words = convertMillions(intPart);
  }

  const currencyWord = currencySymbol === "L"
    ? (intPart === 1 ? "LEMPIRA" : "LEMPIRAS")
    : currencySymbol === "€"
    ? (intPart === 1 ? "EURO" : "EUROS")
    : (intPart === 1 ? "DÓLAR" : "DÓLARES");

  return `${words || "CERO"} ${currencyWord} CON ${decStr}/100`;
};


export function InvoicesModule({
  currentView,
  editingInvoice,
  invoicesList,
  setInvoicesList,
  customers,
  inventory,
  connectedBanks = [],
  companySettings,
  salesSettings,
  companyLogo,
  defaultCurrencySymbol = "$",
  loading = false,
  onNavigateToDashboard,
  onNavigateToSettings,
  onOpenInvoiceEditor,
  onCloseInvoiceEditor,
  onRefreshAccounts,
}: InvoicesModuleProps) {
  // Search query for the invoice list view
  const [searchQuery, setSearchQuery] = useState("");

  // Factura Full-Screen Editor State
  const [activeInvoiceTab, setActiveInvoiceTab] = useState<"Editar" | "Vista de correo electrónico" | "Vista de PDF">("Editar");
  const [showInvoiceOptionsSidebar, setShowInvoiceOptionsSidebar] = useState(false);
  const [activeInvoiceOptionSection, setActiveInvoiceOptionSection] = useState<"personalizacion" | "pago" | "diseno" | null>("diseno");
  const [showInvoiceSaveDropdown, setShowInvoiceSaveDropdown] = useState(false);
  const [showInvoiceSendDropdown, setShowInvoiceSendDropdown] = useState(false);
  const [showPrintDownloadDropdown, setShowPrintDownloadDropdown] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [invoiceSuccessMsg, setInvoiceSuccessMsg] = useState("");
  const [sendingInvoiceEmail, setSendingInvoiceEmail] = useState(false);

  const [invoiceDesign, setInvoiceDesign] = useState<InvoiceDesign>({
    preset: "Estándar Wayne Orange",
    template: "Moderno",
    color: "#1b426e",
    font: "Helvetica Neue",
    printerFriendly: false,
    showTotal: true,
    showBankDeposit: false,
    showEarlyDiscount: false,
  });

  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormData>({
    invoiceNumber: "",
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerAddress: "",
    deliveredTo: "",
    deliveryAddress: "",
    currency: "",
    discount: 0,
    importeExonerado: 0,
    importeExento: 0,
    impGravado15: 0,
    impGravado18: 0,
    showImpGravado15: false,
    applyIsv15: true,
    applyIsv18: false,
    isExonerated: false,
    isExempt: false,
    status: "Pendiente",
    paymentTerms: "Neto 30",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    paymentInstructions: "",
    customerNote: "",
    statementNote: "",
    lines: [],
  });

  // Sync / Initialize invoice form when entering editor mode or changing editingInvoice
  useEffect(() => {
    if (currentView !== "factura-editor") return;

    const isRealInvoice = editingInvoice && typeof editingInvoice === "object" && ("num" in editingInvoice || "customer" in editingInvoice);
    if (isRealInvoice) {
      const matchedCust = customers.find(
        (c) => c.name.toLowerCase() === (editingInvoice.customer || "").toLowerCase()
      );

      const invoiceLines = editingInvoice.lines && editingInvoice.lines.length > 0
        ? editingInvoice.lines.map((l: any, i: number) => ({
            id: l.id || `line-${i + 1}`,
            serviceDate: l.serviceDate || editingInvoice.date || new Date().toISOString().split("T")[0],
            productId: l.productId || "",
            productName: l.productName || "Artículo o Servicio Flexográfico",
            sku: l.sku || `SKU-${editingInvoice.num}`,
            description: l.description || "Impresión y empaque industrial Wayne Trademark",
            quantity: Number(l.quantity) || 1,
            rate: Number(l.rate) || Number(editingInvoice.total) || 0,
            amount: Number(l.amount) || Number(editingInvoice.total) || 0,
          }))
        : [
            {
              id: `line-${editingInvoice.num}-1`,
              serviceDate: editingInvoice.date || new Date().toISOString().split("T")[0],
              productId: "",
              productName: `Servicios de Impresión Flexográfica para ${editingInvoice.customer || "Cliente"}`,
              sku: `SKU-${editingInvoice.num}`,
              description: `Facturación comercial correspondiente a Factura N.º ${editingInvoice.num}`,
              quantity: 1,
              rate: Number(editingInvoice.total) || 0,
              amount: Number(editingInvoice.total) || 0,
            },
          ];

      setInvoiceForm({
        invoiceNumber: editingInvoice.num,
        customerId: matchedCust ? matchedCust.id : "",
        customerName: editingInvoice.customer || "",
        customerEmail: editingInvoice.email || editingInvoice.customerEmail || matchedCust?.email || "",
        customerAddress: matchedCust?.address || "",
        deliveredTo: editingInvoice.customer || "",
        deliveryAddress: matchedCust?.address || "",
        currency: "USD",
        status: editingInvoice.status || "Pendiente",
        discount: 0,
        importeExonerado: 0,
        importeExento: 0,
        impGravado15: 0,
        impGravado18: 0,
        showImpGravado15: false,
        applyIsv15: false,
        applyIsv18: false,
        isExonerated: false,
        isExempt: false,
        paymentTerms: editingInvoice.paymentTerms || "Neto 30",
        invoiceDate: editingInvoice.date || new Date().toISOString().split("T")[0],
        dueDate: editingInvoice.due || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        paymentInstructions: "",
        customerNote: "",
        statementNote: "",
        lines: invoiceLines,
      });
    } else {
      // Create new invoice
      const nextNum = (Math.max(0, ...invoicesList.map((i) => parseInt(i.num) || 0)) + 1).toString();
      setInvoiceForm({
        invoiceNumber: nextNum,
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        deliveredTo: "",
        deliveryAddress: "",
        currency: "USD",
        status: "Pendiente",
        discount: 0,
        importeExonerado: 0,
        importeExento: 0,
        impGravado15: 0,
        impGravado18: 0,
        showImpGravado15: false,
        applyIsv15: false,
        applyIsv18: false,
        isExonerated: false,
        isExempt: false,
        paymentTerms: "Neto 30",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        paymentInstructions: "",
        customerNote: "",
        statementNote: "",
        lines: [
          {
            id: `line-${Date.now()}`,
            serviceDate: new Date().toISOString().split("T")[0],
            productId: "",
            productName: "",
            sku: "",
            description: "",
            quantity: 1,
            rate: 0,
            amount: 0,
          },
        ],
      });
    }
  }, [currentView, editingInvoice, customers, invoicesList]);

  // Outside click listener for local dropdowns
  useEffect(() => {
    const anyOpen = showInvoiceSaveDropdown || showInvoiceSendDropdown || showPrintDownloadDropdown;
    if (!anyOpen) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowInvoiceSaveDropdown(false);
        setShowInvoiceSendDropdown(false);
        setShowPrintDownloadDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [showInvoiceSaveDropdown, showInvoiceSendDropdown, showPrintDownloadDropdown]);

  // Statistics for list view
  const totalFacturado = invoicesList.reduce((acc, item) => acc + item.total, 0);
  const facturasCobradas = invoicesList.filter((item) => item.status === "Cobrada");
  const totalCobradas = facturasCobradas.reduce((acc, item) => acc + item.total, 0);
  const facturasPendientes = invoicesList.filter((item) => item.status === "Pendiente");
  const totalPendientes = facturasPendientes.reduce((acc, item) => acc + item.total, 0);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoicesList;
    const q = searchQuery.toLowerCase().trim();
    return invoicesList.filter(
      (inv) =>
        inv.num.toLowerCase().includes(q) ||
        inv.customer.toLowerCase().includes(q) ||
        (inv.customerEmail && inv.customerEmail.toLowerCase().includes(q))
    );
  }, [invoicesList, searchQuery]);

  const handleUpdateInvoiceStatus = (num: string, newStatus: string) => {
    setInvoicesList((prev) =>
      prev.map((inv) => (inv.num === num ? { ...inv, status: newStatus } : inv))
    );
  };

  // Calculations for editor
  const invoiceCurrencySymbol = invoiceForm.currency || defaultCurrencySymbol;
  const invoiceGrossSubtotal = invoiceForm.lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const invoiceDiscount = Number(invoiceForm.discount || 0);
  const invoiceNetBase = Math.max(0, invoiceGrossSubtotal - invoiceDiscount);

  // 1. Importe Exento
  const invoiceExempt = invoiceForm.isExempt
    ? invoiceNetBase
    : Number(invoiceForm.importeExento || 0);

  // 2. Importe Exonerado
  const invoiceExonerated = invoiceForm.isExonerated
    ? Math.max(0, invoiceNetBase - invoiceExempt)
    : Number(invoiceForm.importeExonerado || 0);

  // Base gravable disponible
  const remainingTaxableBase = Math.max(0, invoiceNetBase - invoiceExempt - invoiceExonerated);

  // 3. Imp. Gravado 18%
  const invoiceGravado18 = (salesSettings?.permitirIsv18 && invoiceForm.applyIsv18)
    ? (invoiceForm.impGravado18 && invoiceForm.impGravado18 > 0 ? invoiceForm.impGravado18 : remainingTaxableBase)
    : 0;

  // 4. Imp. Gravado 15%
  const invoiceGravado15 = invoiceForm.applyIsv15
    ? (invoiceForm.impGravado15 && invoiceForm.impGravado15 > 0
        ? invoiceForm.impGravado15
        : Math.max(0, remainingTaxableBase - invoiceGravado18))
    : 0;

  // 5. Subtotal
  const invoiceSubtotal = Number((invoiceExempt + invoiceExonerated + invoiceGravado15 + invoiceGravado18).toFixed(2)) || invoiceNetBase;

  // 6. Impuestos I.S.V.
  const configuredIsvRate = (salesSettings?.tasaIsvGeneral ?? 15) / 100;
  const invoiceIsv15 = invoiceForm.applyIsv15 ? Number((invoiceGravado15 * configuredIsvRate).toFixed(2)) : 0;
  const invoiceIsv18 = (salesSettings?.permitirIsv18 && invoiceForm.applyIsv18) ? Number((invoiceGravado18 * 0.18).toFixed(2)) : 0;

  // 7. Total a Pagar
  const invoiceTotal = Number((invoiceSubtotal + invoiceIsv15 + invoiceIsv18).toFixed(2));

  const getInvoiceFontFamily = (fontName: string) => {
    switch (fontName) {
      case "Inter":
        return "'Inter', sans-serif";
      case "Roboto":
        return "'Roboto', sans-serif";
      case "Arial":
        return "Arial, sans-serif";
      case "Times New Roman":
        return "'Times New Roman', Times, serif";
      case "Helvetica Neue":
      default:
        return "'Helvetica Neue', Helvetica, Arial, sans-serif";
    }
  };

  const activeInvoiceColor = invoiceDesign.printerFriendly ? "#111827" : (invoiceDesign.color || "#1b426e");

  const downloadInvoicePDF = async () => {
    setShowPrintDownloadDropdown(false);
    setIsGeneratingPDF(true);
    try {
      const printableElem = document.getElementById("printable-invoice-document");
      if (!printableElem) {
        window.print();
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.width = "816px";
      wrapper.style.background = "#ffffff";
      wrapper.style.minHeight = "1056px";
      wrapper.style.color = "#000000";
      wrapper.style.zIndex = "-9999";

      const clone = printableElem.cloneNode(true) as HTMLElement;
      clone.classList.remove("hidden");
      clone.classList.remove("print:block");
      clone.classList.remove("print:flex");
      clone.style.display = "flex";
      clone.style.flexDirection = "column";
      clone.style.justifyContent = "space-between";
      clone.style.minHeight = "1056px";
      clone.style.width = "100%";
      clone.style.background = "#ffffff";
      clone.style.color = "#000000";
      clone.style.padding = "32px";
      clone.style.boxSizing = "border-box";

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 816,
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      let heightLeft = imgHeight - pdfHeight;

      while (heightLeft > 5) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const cleanNum = (invoiceForm.invoiceNumber || "factura").replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`Factura_${cleanNum}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF de factura:", error);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaveInvoiceRecord = async (closeAfter = false) => {
    const finalTotal = invoiceTotal;
    setInvoicesList((prev) => {
      const exists = prev.some((i) => i.num === invoiceForm.invoiceNumber);
      if (exists) {
        return prev.map((i) =>
          i.num === invoiceForm.invoiceNumber
            ? {
                ...i,
                customer: invoiceForm.customerName || i.customer,
                date: invoiceForm.invoiceDate || i.date,
                due: invoiceForm.dueDate || i.due,
                total: finalTotal,
                status: invoiceForm.status || i.status,
                paymentTerms: invoiceForm.paymentTerms,
                lines: [...invoiceForm.lines],
              }
            : i
        );
      } else {
        return [
          {
            num: invoiceForm.invoiceNumber,
            date: invoiceForm.invoiceDate || new Date().toISOString().split("T")[0],
            customer: invoiceForm.customerName || "Cliente Sin Nombre",
            due: invoiceForm.dueDate || new Date().toISOString().split("T")[0],
            total: finalTotal,
            status: invoiceForm.status || "Pendiente",
            paymentTerms: invoiceForm.paymentTerms,
            lines: [...invoiceForm.lines],
          },
          ...prev,
        ];
      }
    });

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceForm.invoiceNumber,
          customerId: invoiceForm.customerId || undefined,
          customerName: invoiceForm.customerName || "Cliente General",
          customerEmail: invoiceForm.customerEmail || "",
          invoiceDate: invoiceForm.invoiceDate || new Date().toISOString().split("T")[0],
          dueDate: invoiceForm.dueDate || "",
          paymentTerms: invoiceForm.paymentTerms,
          currency: invoiceForm.currency || "USD",
          cai: companySettings.cai,
          discount: invoiceDiscount,
          importeExento: invoiceExempt,
          importeExonerado: invoiceExonerated,
          impGravado15: invoiceGravado15,
          impGravado18: invoiceGravado18,
          subtotal: invoiceSubtotal,
          isv15: invoiceIsv15,
          isv18: invoiceIsv18,
          total: finalTotal,
          status: invoiceForm.status || "Emitida",
          lines: invoiceForm.lines,
        }),
      });
      const data = await res.json();
      if (data.success && data.journalEntry) {
        setInvoiceSuccessMsg(`¡Factura guardada y contabilizada automáticamente en el Libro Diario (${data.journalEntry.entryNumber})!`);
        if (onRefreshAccounts) onRefreshAccounts();
      } else {
        setInvoiceSuccessMsg("¡Factura guardada correctamente!");
      }
    } catch (apiErr) {
      console.error("Error saving invoice to API:", apiErr);
      setInvoiceSuccessMsg("¡Factura guardada correctamente!");
    }

    setTimeout(() => {
      setInvoiceSuccessMsg("");
      if (closeAfter) {
        onCloseInvoiceEditor();
      }
    }, 1500);
  };

const formatFiscalMoney = (amount: number | null | undefined, forceShow = false) => {
    if ((!amount || amount === 0) && !forceShow) return "";
    const num = amount || 0;
    return `${invoiceCurrencySymbol}  ${num.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatFiscalInvoiceNumber = (num: string | undefined | null) => {
    if (!num) return "000-001-01-00000001";
    const trimmed = num.toString().trim();
    const clean = trimmed.replace(/^000-001-01-?\s*/, "").trim();
    if (/^\d+$/.test(clean)) {
      return `000-001-01-${clean.padStart(8, "0")}`;
    }
    return `000-001-01-${clean || "00000001"}`;
  };

  const addInvoiceLine = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: `line-${Date.now()}`,
          serviceDate: prev.invoiceDate,
          productId: "",
          productName: "",
          sku: "",
          description: "",
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeInvoiceLine = (id: string) => {
    setInvoiceForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.id !== id),
    }));
  };

  const clearAllInvoiceLines = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      lines: [],
    }));
  };

  const updateInvoiceLine = (id: string, field: string, value: any) => {
    setInvoiceForm((prev) => {
      const updatedLines = prev.lines.map((line) => {
        if (line.id !== id) return line;
        const newLine = { ...line, [field]: value };
        if (field === "quantity" || field === "rate") {
          const q = field === "quantity" ? parseFloat(value) || 0 : line.quantity;
          const r = field === "rate" ? parseFloat(value) || 0 : line.rate;
          newLine.amount = q * r;
        }
        if (field === "productName") {
          const invItem = inventory.find((i) => i.description.toLowerCase().includes(value.toLowerCase()) || i.sku === value);
          if (invItem) {
            newLine.productId = invItem.id;
            newLine.sku = invItem.sku;
            newLine.rate = invItem.price || 0;
            newLine.amount = newLine.quantity * newLine.rate;
            if (!newLine.description) newLine.description = invItem.description;
          }
        }
        return newLine;
      });
      return { ...prev, lines: updatedLines };
    });
  };

  const handleSendInvoiceEmail = async () => {
    const targetEmail = invoiceForm.customerEmail || "sac@waynetrademarkhn.com";
    setSendingInvoiceEmail(true);
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: targetEmail,
          invoiceNumber: formatFiscalInvoiceNumber(invoiceForm.invoiceNumber),
          customerName: invoiceForm.customerName || "Estimado cliente",
          invoiceDate: invoiceForm.invoiceDate,
          dueDate: invoiceForm.dueDate,
          paymentTerms: invoiceForm.paymentTerms,
          lines: invoiceForm.lines,
          currency: invoiceCurrencySymbol,
          subtotal: invoiceSubtotal,
          total: invoiceTotal,
          paymentInstructions: invoiceForm.paymentInstructions,
          customerNote: invoiceForm.customerNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falló el envío por correo.");
      }

      setInvoiceSuccessMsg(`¡Factura N.º ${formatFiscalInvoiceNumber(invoiceForm.invoiceNumber)} enviada a ${targetEmail} (From: notifications@pradocommerce.com, Reply-To: sac@waynetrademarkhn.com)!`);
      setTimeout(() => setInvoiceSuccessMsg(""), 5000);
    } catch (err: any) {
      alert(`Error al enviar correo por Resend: ${err.message}`);
    } finally {
      setSendingInvoiceEmail(false);
    }
  };

  const formatFechaLimite = (val?: string): string => {
    if (!val || val === "Ninguno indicado") return "Ninguno indicado";
    const partsYmd = val.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (partsYmd) {
      return `${partsYmd[3].padStart(2, "0")}/${partsYmd[2].padStart(2, "0")}/${partsYmd[1]}`;
    }
    const partsDmy = val.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
    if (partsDmy) {
      return `${partsDmy[1].padStart(2, "0")}/${partsDmy[2].padStart(2, "0")}/${partsDmy[3]}`;
    }
    return val.replace(/\s*\/\s*/g, "/");
  };

  if (currentView === "lista-facturas") {
    return (
            <div className="space-y-6 animate-in fade-in duration-150 p-6">
              {/* ================= SCREEN HEADER ================= */}
              <div className="space-y-4 print:hidden">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToDashboard()}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar a Dashboard</span>
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-semibold text-slate-500">Ventas</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs font-bold text-slate-900">Historial de Facturas</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        Historial de Facturas Emitidas
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#1b426e] border border-[#ffedd5]">
                        Facturación Fiscal (SAR)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gestiona, consulta, imprime y reenvía las facturas comerciales enviadas a tus clientes.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenInvoiceEditor()}
                      className="px-4 py-2 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#1b426e]/20 cursor-pointer"
                    >
                      <span className="text-sm leading-none">+</span>
                      <span>Crear factura</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid (Matching Dashboard Metric Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Facturado */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Facturado</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      ${totalFacturado.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">USD en facturación comercial</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                </div>

                {/* Facturas Cobradas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700">Facturas Cobradas</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                      ${totalCobradas.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">{facturasCobradas.length} facturas pagadas</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>

                {/* Pendiente de Cobro */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#1b426e]">Pendiente de Cobro</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#1b426e] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#1b426e] tracking-tight">
                      ${totalPendientes.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{facturasPendientes.length} factura pendiente</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1b426e]" />
                </div>

                {/* Total Facturas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Facturas</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{invoicesList.length}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Emitidas este mes</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Buscar por N.º de factura, cliente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1b426e]"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">Mostrando {invoicesList.length} facturas emitidas</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-3 px-4">N.º Factura</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Vencimiento</th>
                        <th className="py-3 px-4 text-right">Monto Total</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {loading ? (
                        <TableRowsSkeleton rows={6} cols={7} />
                      ) : (
                        filteredInvoices.map((fact) => (
                          <tr key={fact.num} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">#{fact.num}</td>
                            <td className="py-3.5 px-4 font-sans text-slate-600">{fact.date}</td>
                            <td className="py-3.5 px-4 font-bold font-sans text-slate-900">{fact.customer}</td>
                            <td className="py-3.5 px-4 font-sans text-slate-500">{fact.due}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">${fact.total.toFixed(2)} USD</td>
                            <td className="py-3.5 px-4 text-center font-sans">
                              <select
                                value={fact.status}
                                onChange={(e) => handleUpdateInvoiceStatus(fact.num, e.target.value)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer appearance-none outline-none border transition ${
                                  fact.status === "Cobrada"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                }`}
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Cobrada">Cobrada</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right font-sans">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => onOpenInvoiceEditor(fact)}
                                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition text-[11px]"
                                >
                                  Editar / Ver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold cursor-pointer transition text-[11px]"
                                >
                                  Imprimir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

    );
  }

  if (currentView === "factura-editor") {
    return (
            <div className="fixed inset-0 z-40 flex flex-col bg-slate-100 text-slate-800 animate-in fade-in duration-150 overflow-hidden print:static print:inset-auto print:bg-white print:overflow-visible print:block print:p-0">
              
              {/* OFFICIAL PRINTABLE INVOICE DOCUMENT (Shown exclusively when printing via window.print) */}
              <div
                id="printable-invoice-document"
                className={`hidden print:flex min-h-[10.5in] flex-col justify-between p-8 bg-white text-slate-900 text-xs ${
                  invoiceDesign.template === "Standard" ? "border-2 border-slate-800" : ""
                }`}
                style={{ fontFamily: getInvoiceFontFamily(invoiceDesign.font) }}
              >
                <div>
                  {/* Header */}
                <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: activeInvoiceColor }}>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight" style={{ color: activeInvoiceColor }}>WAYNE TRADEMARK</h1>
                    <p className="font-bold text-slate-900 text-sm mt-1">{companySettings.nombre}</p>
                    <p className="text-slate-600 text-xs">{companySettings.direccion}</p>
                    <p className="text-slate-600 text-xs">RTN: {companySettings.taxId} | Tel: {companySettings.telefono}</p>
                    <p className="text-slate-600 text-xs font-mono">CAI: {companySettings.cai}</p>
                    <p className="text-slate-600 text-xs">Correo: {companySettings.email}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-slate-900">FACTURA</h2>
                    <p className="font-mono font-bold text-slate-800 text-base">N.º {formatFiscalInvoiceNumber(invoiceForm.invoiceNumber)}</p>
                    <p className="text-slate-600 text-xs mt-1"><strong>Fecha de emisión:</strong> {invoiceForm.invoiceDate}</p>
                    <p className="text-slate-600 text-xs"><strong>Vencimiento:</strong> {invoiceForm.dueDate || "A la vista"}</p>
                    <p className="text-slate-600 text-xs"><strong>Términos:</strong> {invoiceForm.paymentTerms}</p>
                  </div>
                </div>

                {/* Customer Details: Facturado a (izq) y Entregado a (der) */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                  {/* Facturado a */}
                  <div className={`p-4 space-y-1 ${
                    invoiceDesign.template === "Standard"
                      ? "rounded-none border border-slate-300 bg-white"
                      : "rounded-2xl border border-slate-200/80 bg-slate-50/80"
                  }`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturado a:</span>
                    <p className="font-bold text-slate-900 text-sm">{invoiceForm.customerName || "Cliente Contado"}</p>
                    {invoiceForm.customerAddress && (
                      <p className="text-slate-600 text-xs">{invoiceForm.customerAddress}</p>
                    )}
                    {invoiceForm.customerEmail && (
                      <p className="text-slate-600 text-xs">{invoiceForm.customerEmail}</p>
                    )}
                  </div>

                  {/* Entregado a */}
                  <div className={`p-4 space-y-1 ${
                    invoiceDesign.template === "Standard"
                      ? "rounded-none border border-slate-300 bg-white"
                      : "rounded-2xl border border-slate-200/80 bg-slate-50/80"
                  }`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entregado a:</span>
                    <p className="font-bold text-slate-900 text-sm">{invoiceForm.deliveredTo || invoiceForm.customerName || "Cliente Contado"}</p>
                    <p className="text-slate-600 text-xs">
                      {invoiceForm.deliveryAddress || invoiceForm.customerAddress || "Misma dirección del cliente"}
                    </p>
                    {invoiceForm.customerEmail && (
                      <p className="text-slate-600 text-xs">{invoiceForm.customerEmail}</p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse mb-6">
                  <thead>
                    <tr
                      className={`border-b-2 text-slate-500 font-semibold text-[11px] uppercase tracking-wider ${
                        invoiceDesign.template === "Standard" ? "bg-slate-100 text-slate-800 font-bold border-y border-slate-400" : ""
                      }`}
                      style={invoiceDesign.template === "Moderno" ? { borderBottomColor: activeInvoiceColor } : undefined}
                    >
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Producto / Servicio</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-right">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceForm.lines.map((l, idx) => (
                      <tr key={l.id}>
                        <td className="py-3 px-3 font-mono text-slate-400 text-xs">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{l.productName || "Artículo"}</td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-xs">{l.sku || "—"}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{l.description || "—"}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{l.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{invoiceCurrencySymbol} {l.rate.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{invoiceCurrencySymbol} {l.amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {/* SAR Fiscal Totals & Valor en Letras + Footer SAR (Pushed to bottom of invoice page) */}
                <div className="mt-auto pt-6 space-y-4">
                  {/* SAR Fiscal Totals & Valor en Letras (Limpio y Moderno) */}
                  <div className="grid grid-cols-12 gap-6 items-start">
                    {/* Left: VALOR EN LETRAS */}
                    <div className="col-span-7 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                          Valor en Letras
                        </span>
                        <p className="font-bold text-slate-800 text-xs uppercase leading-relaxed tracking-wide">
                          {numberToWordsSpanish(invoiceTotal, invoiceCurrencySymbol)}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium">Documento Fiscal Autorizado por SAR</span>
                        <span className="font-mono font-semibold">{companySettings.cai ? "CAI Válido" : ""}</span>
                      </div>
                    </div>

                    {/* Right: Breakdown Table */}
                    <div className="col-span-5 bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-0.5 text-xs">
                      {/* 1. DESCUENTOS */}
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Descuentos</span>
                        <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceDiscount) || "—"}</span>
                      </div>

                      {/* 2. IMPORTE EXENTO */}
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Importe Exento</span>
                        <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceExempt) || "—"}</span>
                      </div>

                      {/* 3. IMPORTE EXONERADO */}
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Importe Exonerado</span>
                        <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceExonerated) || "—"}</span>
                      </div>

                      {/* 4. IMP GRAVADO 15% */}
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Imp. Gravado {salesSettings?.tasaIsvGeneral ?? 15}%</span>
                        <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceGravado15) || "—"}</span>
                      </div>

                      {/* IMP GRAVADO 18% */}
                      {salesSettings.permitirIsv18 && (
                        <div className="flex justify-between items-center py-[2px] text-slate-600">
                          <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Imp. Gravado 18%</span>
                          <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceGravado18) || "—"}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-100 my-0.5" />

                      {/* 5. SUBTOTAL */}
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Subtotal</span>
                        <span className="font-mono font-bold text-slate-900">{formatFiscalMoney(invoiceSubtotal, true)}</span>
                      </div>

                      {/* 6. TOTAL I.S.V. 15% */}
                      <div className="flex justify-between items-center py-[2px] text-slate-600">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Total I.S.V. {salesSettings?.tasaIsvGeneral ?? 15}%</span>
                        <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceIsv15, invoiceForm.applyIsv15) || "—"}</span>
                      </div>

                      {/* TOTAL I.S.V. 18% */}
                      {salesSettings.permitirIsv18 && (
                        <div className="flex justify-between items-center py-[2px] text-slate-600">
                          <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Total I.S.V. 18%</span>
                          <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceIsv18, invoiceForm.applyIsv18) || "—"}</span>
                        </div>
                      )}

                      {/* 7. TOTAL A PAGAR */}
                      {invoiceDesign.showTotal && (
                        <div className="pt-1">
                          <div
                            className={`flex justify-between items-center py-2.5 px-3.5 shadow-xs ${
                              invoiceDesign.template === "Standard" ? "rounded-none" : "rounded-xl"
                            } ${
                              invoiceDesign.printerFriendly
                                ? "bg-slate-100 border-2 border-slate-900 text-slate-900"
                                : "text-white"
                            }`}
                            style={!invoiceDesign.printerFriendly ? { backgroundColor: activeInvoiceColor } : undefined}
                          >
                            <span className="font-black text-xs uppercase tracking-wider">Total a Pagar</span>
                            <span className="font-mono font-black text-base">{formatFiscalMoney(invoiceTotal, true)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opciones de Pago Renderizadas (Depósito y Pronto Pago) */}
                  {invoiceDesign.showBankDeposit && (
                    <div className={`p-3 text-xs mt-3 border ${
                      invoiceDesign.template === "Standard" ? "rounded-none border-slate-400 bg-slate-50" : "rounded-xl border-slate-200/80 bg-slate-50/80"
                    }`}>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                        Instrucciones de Pago / Depósito Bancario
                      </span>
                      <p className="text-slate-600 text-[11px]">
                        {connectedBanks.length > 0 ? (
                          connectedBanks.map((b) => `${b.name} (${b.currency}): ${b.accountNumber}`).join(" • ")
                        ) : (
                          "Consultar cuentas autorizadas con contabilidad."
                        )}
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        Beneficiario: {companySettings.nombreLegal || companySettings.nombre || "Empresa"} {companySettings.taxId ? `• RTN: ${companySettings.taxId}` : ""}
                      </p>
                    </div>
                  )}

                  {invoiceDesign.showEarlyDiscount && (
                    <div className={`p-2.5 text-xs flex items-center gap-2 mt-2 border ${
                      invoiceDesign.template === "Standard"
                        ? "rounded-none border-slate-400 bg-slate-50 text-slate-800"
                        : "rounded-xl border-amber-200 bg-amber-50/70 text-amber-900"
                    }`}>
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="text-[11px] font-medium">
                        <strong>Incentivo por pronto pago:</strong> 2% de descuento sobre el subtotal si se cancela dentro de los primeros 10 días calendario.
                      </span>
                    </div>
                  )}

                  {/* Fiscal Footer SAR */}
                  <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-xs text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">Rango Autorizado: </span>
                      <span className="font-mono">{companySettings.rangoAutorizado}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">Fecha Límite de Emisión: </span>
                      <span className="font-mono">{formatFechaLimite(companySettings.fechaLimiteEmision)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* TOP HEADER BAR */}
              <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs print:hidden">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onCloseInvoiceEditor}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer w-fit"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Regresar</span>
                  </button>
                  <h1 className="text-base font-bold text-slate-900 flex items-center gap-2 border-l border-slate-200 pl-4">
                    <span>Factura {invoiceForm.invoiceNumber}</span>
                  </h1>

                  {/* Nav Sub-Tabs */}
                  <div className="flex items-center gap-1 border-l border-slate-200 pl-6">
                    {(["Editar", "Vista de correo electrónico", "Vista de PDF"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveInvoiceTab(tab)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                          activeInvoiceTab === tab
                            ? "bg-[#fff7ed] text-[#1b426e] border border-[#1b426e]/30"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Right Action Links */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceOptionsSidebar(!showInvoiceOptionsSidebar)}
                    className={`flex items-center gap-1 cursor-pointer font-semibold text-xs px-3 py-1.5 rounded-lg border transition ${
                      showInvoiceOptionsSidebar
                        ? "bg-[#fff7ed] text-[#1b426e] border-[#1b426e]/40 shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#1b426e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    <span>Administrar</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCloseInvoiceEditor}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ml-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* MAIN CONTENT WORKSPACE */}
              <div className="flex-1 flex overflow-hidden print:hidden">
                
                {/* LEFT/CENTER COLUMN: INVOICE SHEET FORM */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                  
                  {activeInvoiceTab === "Editar" && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-5xl mx-auto space-y-8">
                      
                      {/* Notification Banner if saved */}
                      {invoiceSuccessMsg && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
                          <span className="font-bold">✓ {invoiceSuccessMsg}</span>
                        </div>
                      )}

                      {/* HEADER ROW OF INVOICE SHEET */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-6">
                        {/* Company Info */}
                        <div className="space-y-1 text-xs text-slate-600 max-w-md">
                          <h2 className="text-xl font-black text-[#1b426e] tracking-tight mb-2">FACTURA</h2>
                          <p className="font-bold text-slate-900 uppercase">{companySettings.nombre}</p>
                          <p>{companySettings.email} • {companySettings.telefono}</p>
                          <p>{companySettings.direccion}</p>
                          <p className="font-mono text-slate-700">RTN: {companySettings.taxId}</p>
                          <p className="font-mono text-slate-700">CAI: {companySettings.cai}</p>
                          <button
                            type="button"
                            onClick={() => onNavigateToSettings?.()}
                            className="text-[#0066cc] font-semibold hover:underline mt-1 block cursor-pointer"
                          >
                            Editar datos de la empresa
                          </button>
                        </div>

                        {/* Balance & Logo */}
                        <div className="text-right space-y-2">
                          <div className="text-xs font-semibold text-slate-500">
                            Saldo pendiente:{" "}
                            <span className={`font-bold text-sm ${invoiceForm.status === "Cobrada" ? "text-emerald-600" : "text-slate-900"}`}>
                              {invoiceCurrencySymbol} {(invoiceForm.status === "Cobrada" ? 0 : invoiceTotal).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {companyLogo ? (
                            <img src={companyLogo} alt="Logo" className="h-12 object-contain ml-auto" />
                          ) : (
                            <div className="h-12 w-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-400 ml-auto">
                              Wayne Logo
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CUSTOMER AND DATES GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                        {/* Customer Selection */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">Cliente / Empresa</label>
                          <select
                            value={invoiceForm.customerId}
                            onChange={(e) => {
                              const selected = customers.find((c) => c.id === e.target.value);
                              setInvoiceForm({
                                ...invoiceForm,
                                customerId: e.target.value,
                                customerName: selected ? selected.name : "",
                                customerEmail: selected ? selected.email || "" : "",
                                customerAddress: selected ? selected.address || "" : "",
                                deliveredTo: selected ? selected.name : "",
                                deliveryAddress: selected ? selected.address || "" : "",
                              });
                            }}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] font-semibold cursor-pointer shadow-2xs"
                          >
                            <option value="">-- Seleccionar o agregar Cliente --</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} {c.macolaCode ? `(${c.macolaCode})` : ""}
                              </option>
                            ))}
                          </select>

                          {invoiceForm.customerEmail && (
                            <p className="text-[11px] text-slate-500">
                              Correo de notificación: <span className="font-mono text-slate-700 font-semibold">{invoiceForm.customerEmail}</span>
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Entregado a (Receptor)</label>
                              <input
                                type="text"
                                value={invoiceForm.deliveredTo}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, deliveredTo: e.target.value })}
                                placeholder={invoiceForm.customerName || "Nombre receptor"}
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-[#1b426e]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Dirección de entrega</label>
                              <input
                                type="text"
                                value={invoiceForm.deliveryAddress}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, deliveryAddress: e.target.value })}
                                placeholder="Planta principal / Destino"
                                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:border-[#1b426e]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Invoice Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">N.º de factura</label>
                            <input
                              type="text"
                              value={invoiceForm.invoiceNumber}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                              placeholder="00000001 o 1001"
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Estado de cobro</label>
                            <select
                              value={invoiceForm.status || "Pendiente"}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                              className={`w-full px-3 py-1.5 rounded-xl font-bold text-xs focus:outline-none focus:border-[#1b426e] cursor-pointer border ${
                                invoiceForm.status === "Cobrada"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              <option value="Pendiente">● Pendiente de cobro</option>
                              <option value="Cobrada">✓ Cobrada / Pagada</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Términos de pago</label>
                            <select
                              value={invoiceForm.paymentTerms}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentTerms: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e] cursor-pointer"
                            >
                              <option value="Contado">Contado</option>
                              <option value="Neto 15">Neto 15 días</option>
                              <option value="Neto 30">Neto 30 días</option>
                              <option value="Neto 60">Neto 60 días</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Fecha de factura</label>
                            <input
                              type="date"
                              value={invoiceForm.invoiceDate}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block font-semibold text-slate-700 mb-1">Fecha de vencimiento</label>
                            <input
                              type="date"
                              value={invoiceForm.dueDate}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* INVOICE ITEMS TABLE */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">Producto o servicio</h3>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3 w-8 text-center">#</th>
                                <th className="p-3 w-32">Fecha servicio</th>
                                <th className="p-3 min-w-[180px]">Producto / Servicio</th>
                                <th className="p-3 w-28">SKU</th>
                                <th className="p-3 min-w-[200px]">Descripción</th>
                                <th className="p-3 w-20 text-right">Cant.</th>
                                <th className="p-3 w-24 text-right">Tarifa</th>
                                <th className="p-3 w-28 text-right">Importe</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {invoiceForm.lines.map((line, idx) => (
                                <tr key={line.id} className="hover:bg-slate-50/60 transition">
                                  <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                  <td className="p-3">
                                    <input
                                      type="date"
                                      value={line.serviceDate}
                                      onChange={(e) => updateInvoiceLine(line.id, "serviceDate", e.target.value)}
                                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#1b426e]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      list={`inventory-list-${line.id}`}
                                      placeholder="Buscar artículo..."
                                      value={line.productName}
                                      onChange={(e) => updateInvoiceLine(line.id, "productName", e.target.value)}
                                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-[#1b426e]"
                                    />
                                    <datalist id={`inventory-list-${line.id}`}>
                                      {inventory.map((item) => (
                                        <option key={item.id} value={item.description} />
                                      ))}
                                    </datalist>
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-[#1b426e] font-semibold">
                                    {line.sku || "—"}
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      placeholder="Descripción de la línea..."
                                      value={line.description}
                                      onChange={(e) => updateInvoiceLine(line.id, "description", e.target.value)}
                                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#1b426e]"
                                    />
                                  </td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      min="1"
                                      value={line.quantity}
                                      onChange={(e) => updateInvoiceLine(line.id, "quantity", e.target.value)}
                                      className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 text-right font-mono focus:outline-none focus:border-[#1b426e]"
                                    />
                                  </td>
                                  <td className="p-3 text-right">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={line.rate}
                                      onChange={(e) => updateInvoiceLine(line.id, "rate", e.target.value)}
                                      className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 text-right font-mono focus:outline-none focus:border-[#1b426e]"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 font-mono">
                                    {invoiceCurrencySymbol} {line.amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeInvoiceLine(line.id)}
                                      className="text-slate-400 hover:text-red-600 text-xs font-bold p-1 cursor-pointer"
                                      title="Eliminar línea"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {invoiceForm.lines.length === 0 && (
                                <tr>
                                  <td colSpan={9} className="p-6 text-center text-slate-400 text-xs">
                                    No hay líneas de factura. Haz clic en "Agregar producto o servicio".
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Table Action Buttons */}
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={addInvoiceLine}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-300/80"
                          >
                            <span>+ Agregar producto o servicio</span>
                          </button>
                          <button
                            type="button"
                            onClick={clearAllInvoiceLines}
                            className="px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer"
                          >
                            Borrar todas las líneas
                          </button>
                        </div>
                      </div>

                      {/* BOTTOM SECTION: NOTES & TOTALS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                        {/* Notes Column */}
                        <div className="space-y-4 text-xs">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Opciones e instrucciones de pago</label>
                            <input
                              type="text"
                              value={invoiceForm.paymentInstructions}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentInstructions: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nota para el cliente</label>
                            <textarea
                              rows={3}
                              value={invoiceForm.customerNote}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, customerNote: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Nota sobre extracto (oculto)</label>
                            <textarea
                              rows={2}
                              value={invoiceForm.statementNote}
                              onChange={(e) => setInvoiceForm({ ...invoiceForm, statementNote: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e]"
                            />
                          </div>
                        </div>

                        {/* Totals Summary Column */}
                        <div className="space-y-3 text-xs bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                          {/* Fiscal Controls */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-200 text-xs">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Moneda</label>
                              <select
                                value={invoiceForm.currency || defaultCurrencySymbol}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                                className="w-full px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold"
                              >
                                <option value="L">Lempiras (L){defaultCurrencySymbol === "L" ? " — Predeterminada" : ""}</option>
                                <option value="$">Dólares ($){defaultCurrencySymbol === "$" ? " — Predeterminada" : ""}</option>
                                <option value="€">Euros (€){defaultCurrencySymbol === "€" ? " — Predeterminada" : ""}</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Descuentos</label>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={invoiceForm.discount || ""}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-full px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-800"
                              />
                            </div>
                            <div className="flex flex-col justify-center gap-1">
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={invoiceForm.applyIsv15}
                                  onChange={(e) => setInvoiceForm({ ...invoiceForm, applyIsv15: e.target.checked })}
                                  className="rounded text-[#1b426e]"
                                />
                                <span>I.S.V. {salesSettings?.tasaIsvGeneral ?? 15}%</span>
                              </label>
                              {salesSettings.permitirIsv18 && (
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={invoiceForm.applyIsv18}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, applyIsv18: e.target.checked })}
                                    className="rounded text-[#1b426e]"
                                  />
                                  <span>I.S.V. 18%</span>
                                </label>
                              )}
                            </div>
                            <div className="flex flex-col justify-center gap-1">
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={invoiceForm.isExonerated}
                                  onChange={(e) => setInvoiceForm({ ...invoiceForm, isExonerated: e.target.checked })}
                                  className="rounded text-[#1b426e]"
                                />
                                <span>Exonerado</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={invoiceForm.isExempt}
                                  onChange={(e) => setInvoiceForm({ ...invoiceForm, isExempt: e.target.checked })}
                                  className="rounded text-[#1b426e]"
                                />
                                <span>Exento</span>
                              </label>
                            </div>
                          </div>

                          {/* Fiscal Summary Preview */}
                          <div className="space-y-1.5 pt-1 text-right text-xs">
                            {/* 1. DESCUENTOS */}
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="text-[11px] uppercase font-semibold text-slate-500">DESCUENTOS:</span>
                              <span className="font-mono text-slate-900">{invoiceDiscount > 0 ? `-${invoiceCurrencySymbol} ${invoiceDiscount.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}</span>
                            </div>

                            {/* 2. IMPORTE EXENTO */}
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="text-[11px] uppercase font-semibold text-slate-500">IMPORTE EXENTO:</span>
                              <span className="font-mono text-slate-900">{invoiceExempt > 0 ? `${invoiceCurrencySymbol} ${invoiceExempt.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}</span>
                            </div>

                            {/* 3. IMPORTE EXONERADO */}
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="text-[11px] uppercase font-semibold text-slate-500">IMPORTE EXONERADO:</span>
                              <span className="font-mono text-slate-900">{invoiceExonerated > 0 ? `${invoiceCurrencySymbol} ${invoiceExonerated.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}</span>
                            </div>

                            {/* 4. IMP. GRAVADO 15% */}
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="text-[11px] uppercase font-semibold text-slate-500">IMP. GRAVADO {salesSettings?.tasaIsvGeneral ?? 15}%:</span>
                              <span className="font-mono text-slate-900">{invoiceGravado15 > 0 ? `${invoiceCurrencySymbol} ${invoiceGravado15.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}</span>
                            </div>

                            {/* IMP. GRAVADO 18% */}
                            {salesSettings.permitirIsv18 && (
                              <div className="flex justify-between items-center text-slate-600">
                                <span className="text-[11px] uppercase font-semibold text-slate-500">IMP. GRAVADO 18%:</span>
                                <span className="font-mono text-slate-900">{invoiceGravado18 > 0 ? `${invoiceCurrencySymbol} ${invoiceGravado18.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}</span>
                              </div>
                            )}

                            <div className="border-t border-slate-200 my-1" />

                            {/* 5. SUBTOTAL */}
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="text-[11px] uppercase font-bold text-slate-700">SUBTOTAL:</span>
                              <span className="font-mono font-bold text-slate-900">{invoiceCurrencySymbol} {invoiceSubtotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* 6. TOTAL I.S.V. 15% */}
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="text-[11px] uppercase font-semibold text-slate-500">TOTAL I.S.V. {salesSettings?.tasaIsvGeneral ?? 15}%:</span>
                              <span className="font-mono font-bold text-slate-900">{invoiceIsv15 > 0 ? `${invoiceCurrencySymbol} ${invoiceIsv15.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}</span>
                            </div>

                            {/* TOTAL I.S.V. 18% */}
                            {salesSettings.permitirIsv18 && (
                              <div className="flex justify-between items-center text-slate-600">
                                <span className="text-[11px] uppercase font-semibold text-slate-500">TOTAL I.S.V. 18%:</span>
                                <span className="font-mono font-bold text-slate-900">{invoiceIsv18 > 0 ? `${invoiceCurrencySymbol} ${invoiceIsv18.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "—"}</span>
                              </div>
                            )}

                            {/* 7. TOTAL A PAGAR */}
                            <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                              <span className="text-xs uppercase">TOTAL A PAGAR:</span>
                              <span className="text-2xl font-bold text-slate-900 font-mono">{invoiceCurrencySymbol} {invoiceTotal.toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 text-left">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Valor en letras:</span>
                            <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">{numberToWordsSpanish(invoiceTotal, invoiceCurrencySymbol)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VISTA DE CORREO ELECTRÓNICO */}
                  {activeInvoiceTab === "Vista de correo electrónico" && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
                      <div className="border-b border-slate-200 pb-4">
                        <h3 className="font-bold text-base text-slate-900">Vista previa del correo electrónico para el cliente</h3>
                        <p className="text-xs text-slate-500">Así es como el cliente visualizará el correo de facturación de Wayne.</p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                        <p><strong>De:</strong> {companySettings.email}</p>
                        <p><strong>Para:</strong> {invoiceForm.customerEmail || "cliente@empresa.hn"}</p>
                        <p><strong>Asunto:</strong> Factura {formatFiscalInvoiceNumber(invoiceForm.invoiceNumber)} de Wayne Trademark Honduras</p>
                      </div>

                      <div className="p-6 border border-slate-200 rounded-2xl space-y-4 bg-white text-xs text-slate-700 leading-relaxed">
                        <p className="font-semibold text-slate-900">Estimado cliente,</p>
                        <p>Le adjuntamos la Factura N.º <strong>{formatFiscalInvoiceNumber(invoiceForm.invoiceNumber)}</strong> correspondiente a su orden de empaque/impresión flexográfica.</p>
                        
                        <div className="my-4 p-4 rounded-xl bg-[#fff7ed] border border-[#1b426e]/30 flex justify-between items-center">
                          <div>
                            <span className="text-xs font-bold text-[#1b426e] block">Monto Total a Pagar</span>
                            <span className="text-xl font-bold text-slate-900">{invoiceCurrencySymbol} {invoiceTotal.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoiceCurrencySymbol === "L" ? "HNL" : invoiceCurrencySymbol === "€" ? "EUR" : "USD"}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">Vence: {invoiceForm.dueDate}</span>
                        </div>

                        <p>{invoiceForm.customerNote}</p>
                        <p className="pt-4 border-t border-slate-100 text-slate-500">Atentamente,<br /><strong>{companySettings.nombre}</strong></p>
                      </div>
                    </div>
                  )}

                  {/* VISTA DE PDF */}
                  {activeInvoiceTab === "Vista de PDF" && (
                    <div className="overflow-x-auto pb-12 flex flex-col items-center">
                      <div className="w-[8.5in] mb-4 flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">Vista Previa Fiscal de Factura</span>
                          <span className="text-[11px] text-slate-400 font-mono">N.º {formatFiscalInvoiceNumber(invoiceForm.invoiceNumber)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                          >
                            Imprimir
                          </button>
                          <button
                            type="button"
                            onClick={downloadInvoicePDF}
                            disabled={isGeneratingPDF}
                            className="px-3.5 py-1.5 rounded-xl bg-[#1b426e] hover:bg-[#143355] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isGeneratingPDF ? "Descargando..." : "Descargar PDF"}</span>
                          </button>
                        </div>
                      </div>

                      <div
                        className={`w-[8.5in] min-h-[11in] bg-white border rounded-xs shadow-2xl p-12 flex flex-col justify-between animate-in fade-in duration-150 text-xs text-slate-800 shrink-0 ${
                          invoiceDesign.template === "Standard" ? "border-2 border-slate-800" : "border-slate-300"
                        }`}
                        style={{ fontFamily: getInvoiceFontFamily(invoiceDesign.font) }}
                      >
                        <div className="space-y-6">
                          <div className="flex justify-between items-start border-b-2 pb-6" style={{ borderColor: activeInvoiceColor }}>
                            <div>
                              <h1 className="text-2xl font-black tracking-tight" style={{ color: activeInvoiceColor }}>WAYNE TRADEMARK</h1>
                              <p className="font-bold text-slate-900 mt-1">{companySettings.nombre}</p>
                              <p className="text-slate-500">{companySettings.direccion}</p>
                              <p className="text-slate-500">RTN: {companySettings.taxId}</p>
                              <p className="text-slate-500 font-mono">CAI: {companySettings.cai}</p>
                            </div>
                            <div className="text-right">
                              <h2 className="text-xl font-bold text-slate-900">FACTURA</h2>
                              <p className="font-mono font-bold text-slate-700 text-sm">N.º {formatFiscalInvoiceNumber(invoiceForm.invoiceNumber)}</p>
                              <p className="text-slate-500 mt-1">Fecha: {invoiceForm.invoiceDate}</p>
                              <p className="text-slate-500">Vencimiento: {invoiceForm.dueDate || "A la vista"}</p>
                              <p className="text-slate-500">Términos: {invoiceForm.paymentTerms}</p>
                            </div>
                          </div>

                          {/* Facturado a (izq) y Entregado a (der) */}
                          <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                            {/* Facturado a */}
                            <div className={`p-4 space-y-1 ${
                              invoiceDesign.template === "Standard"
                                ? "rounded-none border border-slate-300 bg-white"
                                : "rounded-2xl border border-slate-200/80 bg-slate-50/80"
                            }`}>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturado a:</span>
                              <p className="font-bold text-slate-900 text-sm">{invoiceForm.customerName || "Cliente Contado"}</p>
                              {invoiceForm.customerAddress && (
                                <p className="text-slate-500 text-xs">{invoiceForm.customerAddress}</p>
                              )}
                              {invoiceForm.customerEmail && (
                                <p className="text-slate-500 text-xs">{invoiceForm.customerEmail}</p>
                              )}
                            </div>

                            {/* Entregado a */}
                            <div className={`p-4 space-y-1 ${
                              invoiceDesign.template === "Standard"
                                ? "rounded-none border border-slate-300 bg-white"
                                : "rounded-2xl border border-slate-200/80 bg-slate-50/80"
                            }`}>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entregado a:</span>
                              <p className="font-bold text-slate-900 text-sm">{invoiceForm.deliveredTo || invoiceForm.customerName || "Cliente Contado"}</p>
                              <p className="text-slate-500 text-xs">
                                {invoiceForm.deliveryAddress || invoiceForm.customerAddress || "Misma dirección del cliente"}
                              </p>
                              {invoiceForm.customerEmail && (
                                <p className="text-slate-500 text-xs">{invoiceForm.customerEmail}</p>
                              )}
                            </div>
                          </div>

                          {/* PDF Table */}
                          <table className="w-full text-left border-collapse mb-6">
                            <thead>
                              <tr
                                className={`border-b-2 text-slate-500 font-semibold text-[11px] uppercase tracking-wider ${
                                  invoiceDesign.template === "Standard" ? "bg-slate-100 text-slate-800 font-bold border-y border-slate-400" : ""
                                }`}
                                style={invoiceDesign.template === "Moderno" ? { borderBottomColor: activeInvoiceColor } : undefined}
                              >
                                <th className="py-2.5">Descripción</th>
                                <th className="py-2.5 text-right">Cant.</th>
                                <th className="py-2.5 text-right">Precio</th>
                                <th className="py-2.5 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {invoiceForm.lines.map((l) => (
                                <tr key={l.id}>
                                  <td className="py-3 font-semibold text-slate-900">{l.productName || l.description || "Artículo"}</td>
                                  <td className="py-3 text-right font-mono text-slate-700">{l.quantity}</td>
                                  <td className="py-3 text-right font-mono text-slate-700">{invoiceCurrencySymbol} {l.rate.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="py-3 text-right font-mono font-bold text-slate-900">{invoiceCurrencySymbol} {l.amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* SAR Fiscal Totals & Valor en Letras + Footer SAR (Pushed to bottom of invoice page) */}
                        <div className="mt-auto pt-6 space-y-4">
                          {/* SAR Fiscal Totals & Valor en Letras (Limpio y Moderno) */}
                          <div className="grid grid-cols-12 gap-6 items-start">
                            {/* Left: VALOR EN LETRAS */}
                            <div className="col-span-7 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                                  Valor en Letras
                                </span>
                                <p className="font-bold text-slate-800 text-xs uppercase leading-relaxed tracking-wide">
                                  {numberToWordsSpanish(invoiceTotal, invoiceCurrencySymbol)}
                                </p>
                              </div>
                              <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="font-medium">Documento Fiscal Autorizado por SAR</span>
                                <span className="font-mono font-semibold">{companySettings.cai ? "CAI Válido" : ""}</span>
                              </div>
                            </div>

                            {/* Right: Breakdown Table */}
                            <div className="col-span-5 bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-0.5 text-xs">
                              {/* 1. DESCUENTOS */}
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Descuentos</span>
                                <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceDiscount) || "—"}</span>
                              </div>

                              {/* 2. IMPORTE EXENTO */}
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Importe Exento</span>
                                <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceExempt) || "—"}</span>
                              </div>

                              {/* 3. IMPORTE EXONERADO */}
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Importe Exonerado</span>
                                <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceExonerated) || "—"}</span>
                              </div>

                              {/* 4. IMP GRAVADO 15% */}
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Imp. Gravado {salesSettings?.tasaIsvGeneral ?? 15}%</span>
                                <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceGravado15) || "—"}</span>
                              </div>

                              {/* IMP GRAVADO 18% */}
                              {salesSettings.permitirIsv18 && (
                                <div className="flex justify-between items-center py-[2px] text-slate-600">
                                  <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Imp. Gravado 18%</span>
                                  <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceGravado18) || "—"}</span>
                                </div>
                              )}

                              <div className="border-t border-slate-100 my-0.5" />

                              {/* 5. SUBTOTAL */}
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Subtotal</span>
                                <span className="font-mono font-bold text-slate-900">{formatFiscalMoney(invoiceSubtotal, true)}</span>
                              </div>

                              {/* 6. TOTAL I.S.V. 15% */}
                              <div className="flex justify-between items-center py-[2px] text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Total I.S.V. {salesSettings?.tasaIsvGeneral ?? 15}%</span>
                                <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceIsv15, invoiceForm.applyIsv15) || "—"}</span>
                              </div>

                              {/* TOTAL I.S.V. 18% */}
                              {salesSettings.permitirIsv18 && (
                                <div className="flex justify-between items-center py-[2px] text-slate-600">
                                  <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Total I.S.V. 18%</span>
                                  <span className="font-mono font-medium text-slate-700">{formatFiscalMoney(invoiceIsv18, invoiceForm.applyIsv18) || "—"}</span>
                                </div>
                              )}

                              {/* 7. TOTAL A PAGAR */}
                              {invoiceDesign.showTotal && (
                                <div className="pt-1">
                                  <div
                                    className={`flex justify-between items-center py-2.5 px-3.5 shadow-xs ${
                                      invoiceDesign.template === "Standard" ? "rounded-none" : "rounded-xl"
                                    } ${
                                      invoiceDesign.printerFriendly
                                        ? "bg-slate-100 border-2 border-slate-900 text-slate-900"
                                        : "text-white"
                                    }`}
                                    style={!invoiceDesign.printerFriendly ? { backgroundColor: activeInvoiceColor } : undefined}
                                  >
                                    <span className="font-black text-xs uppercase tracking-wider">Total a Pagar</span>
                                    <span className="font-mono font-black text-base">{formatFiscalMoney(invoiceTotal, true)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Opciones de Pago Renderizadas (Depósito y Pronto Pago) */}
                          {invoiceDesign.showBankDeposit && (
                            <div className={`p-3 text-xs mt-3 border ${
                              invoiceDesign.template === "Standard" ? "rounded-none border-slate-400 bg-slate-50" : "rounded-xl border-slate-200/80 bg-slate-50/80"
                            }`}>
                              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-1">
                                <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                                Instrucciones de Pago / Depósito Bancario
                              </span>
                              <p className="text-slate-600 text-[11px]">
                                {connectedBanks.length > 0 ? (
                                  connectedBanks.map((b) => `${b.name} (${b.currency}): ${b.accountNumber}`).join(" • ")
                                ) : (
                                  "Consultar cuentas autorizadas con contabilidad."
                                )}
                              </p>
                              <p className="text-slate-500 text-[10px] mt-0.5">
                                Beneficiario: {companySettings.nombreLegal || companySettings.nombre || "Empresa"} {companySettings.taxId ? `• RTN: ${companySettings.taxId}` : ""}
                              </p>
                            </div>
                          )}

                          {invoiceDesign.showEarlyDiscount && (
                            <div className={`p-2.5 text-xs flex items-center gap-2 mt-2 border ${
                              invoiceDesign.template === "Standard"
                                ? "rounded-none border-slate-400 bg-slate-50 text-slate-800"
                                : "rounded-xl border-amber-200 bg-amber-50/70 text-amber-900"
                            }`}>
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="text-[11px] font-medium">
                                <strong>Incentivo por pronto pago:</strong> 2% de descuento sobre el subtotal si se cancela dentro de los primeros 10 días calendario.
                              </span>
                            </div>
                          )}

                          {/* Fiscal Footer SAR */}
                          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-700">
                            <div>
                              <span className="font-bold text-slate-900">Rango Autorizado: </span>
                              <span className="font-mono">{companySettings.rangoAutorizado}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900">Fecha Límite de Emisión: </span>
                              <span className="font-mono">{formatFechaLimite(companySettings.fechaLimiteEmision)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* ================= SIDEBAR MODAL DRAWER: OPCIONES FACTURA (Matching user screenshot) ================= */}
              {showInvoiceOptionsSidebar && (
                <div className="fixed inset-0 z-50 flex justify-end">
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity z-50"
                    onClick={() => setShowInvoiceOptionsSidebar(false)}
                  />

                  {/* Drawer Panel matching user screenshot */}
                  <aside className="relative z-50 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                      <h3 className="font-bold text-sm text-slate-900">Facturar {invoiceForm.invoiceNumber}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-semibold">Opciones</span>
                        <button
                          type="button"
                          onClick={() => setShowInvoiceOptionsSidebar(false)}
                          className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Content Accordions */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
                      
                      {/* Section 1: Personalización */}
                      <div className="pt-2">
                        <div className="group">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveInvoiceOptionSection(
                                activeInvoiceOptionSection === "personalizacion" ? null : "personalizacion"
                              )
                            }
                            className="w-full font-bold text-xs text-slate-800 flex justify-between items-center cursor-pointer py-1 text-left"
                          >
                            <span>Personalización</span>
                            <span className={`text-slate-400 transition-transform ${activeInvoiceOptionSection === "personalizacion" ? "rotate-180" : ""}`}>▾</span>
                          </button>
                          {activeInvoiceOptionSection === "personalizacion" && (
                            <div className="pt-3 space-y-3 text-xs text-slate-600 animate-in fade-in duration-150">
                              <label className="block">
                                <span className="font-semibold block mb-1 text-slate-800">Plantilla de factura</span>
                                <select
                                  value={invoiceDesign.preset}
                                  onChange={(e) => {
                                    const p = e.target.value;
                                    if (p === "Estándar Wayne Orange") {
                                      setInvoiceDesign({ ...invoiceDesign, preset: p, template: "Moderno", color: "#1b426e", font: "Helvetica Neue" });
                                    } else if (p === "Minimalista") {
                                      setInvoiceDesign({ ...invoiceDesign, preset: p, template: "Standard", color: "#555555", font: "Inter" });
                                    } else if (p === "Corporativo Industrial") {
                                      setInvoiceDesign({ ...invoiceDesign, preset: p, template: "Moderno", color: "#148c96", font: "Roboto" });
                                    } else {
                                      setInvoiceDesign({ ...invoiceDesign, preset: p });
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] cursor-pointer font-medium"
                                >
                                  <option value="Estándar Wayne Orange">Estándar Wayne Orange</option>
                                  <option value="Minimalista">Minimalista</option>
                                  <option value="Corporativo Industrial">Corporativo Industrial</option>
                                </select>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Opciones de pago */}
                      <div className="pt-4">
                        <div className="group">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveInvoiceOptionSection(
                                activeInvoiceOptionSection === "pago" ? null : "pago"
                              )
                            }
                            className="w-full font-bold text-xs text-slate-800 flex justify-between items-center cursor-pointer py-1 text-left"
                          >
                            <span>Opciones de pago</span>
                            <span className={`text-slate-400 transition-transform ${activeInvoiceOptionSection === "pago" ? "rotate-180" : ""}`}>▾</span>
                          </button>
                          {activeInvoiceOptionSection === "pago" && (
                            <div className="pt-3 space-y-3 text-xs text-slate-600 animate-in fade-in duration-150">
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-semibold text-slate-800">Total de la factura</span>
                                <input
                                  type="checkbox"
                                  checked={invoiceDesign.showTotal}
                                  onChange={(e) => setInvoiceDesign({ ...invoiceDesign, showTotal: e.target.checked })}
                                  className="w-4 h-4 accent-[#1b426e] cursor-pointer"
                                />
                              </label>
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-semibold text-slate-800">Depósito bancario</span>
                                <input
                                  type="checkbox"
                                  checked={invoiceDesign.showBankDeposit}
                                  onChange={(e) => setInvoiceDesign({ ...invoiceDesign, showBankDeposit: e.target.checked })}
                                  className="w-4 h-4 accent-[#1b426e] cursor-pointer"
                                />
                              </label>
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-semibold text-slate-800">Descuento pronto pago</span>
                                <input
                                  type="checkbox"
                                  checked={invoiceDesign.showEarlyDiscount}
                                  onChange={(e) => setInvoiceDesign({ ...invoiceDesign, showEarlyDiscount: e.target.checked })}
                                  className="w-4 h-4 accent-[#1b426e] cursor-pointer"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Diseño (Matches user screenshot) */}
                      <div className="pt-4">
                        <div className="group">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveInvoiceOptionSection(
                                activeInvoiceOptionSection === "diseno" ? null : "diseno"
                              )
                            }
                            className="w-full font-bold text-xs text-slate-800 flex justify-between items-center cursor-pointer py-1 text-left"
                          >
                            <span>Diseño</span>
                            <span className={`text-slate-400 transition-transform ${activeInvoiceOptionSection === "diseno" ? "rotate-180" : ""}`}>▾</span>
                          </button>
                          
                          {activeInvoiceOptionSection === "diseno" && (
                            <div className="pt-3 space-y-4 text-xs text-slate-700 animate-in fade-in duration-150">
                              
                              {/* Plantilla modernizada */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-900">Plantilla modernizada</span>
                                  <button
                                    type="button"
                                    onClick={() => setInvoiceDesign({ ...invoiceDesign, template: "Moderno", color: "#1b426e", font: "Helvetica Neue", printerFriendly: false })}
                                    className="text-[11px] text-[#1b426e] hover:underline font-medium cursor-pointer"
                                  >
                                    Restablecer
                                  </button>
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                                  <input
                                    type="radio"
                                    name="invoiceTemplate"
                                    checked={invoiceDesign.template === "Moderno"}
                                    onChange={() => setInvoiceDesign({ ...invoiceDesign, template: "Moderno" })}
                                    className="w-4 h-4 accent-[#1b426e] cursor-pointer"
                                  />
                                  <span className="font-medium text-slate-800">Moderno</span>
                                </label>
                              </div>

                              <hr className="border-slate-200/80 my-3" />

                              {/* Otras plantillas */}
                              <div className="space-y-2">
                                <span className="font-bold text-slate-900 block">Otras plantillas</span>

                                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                                  <input
                                    type="radio"
                                    name="invoiceTemplate"
                                    checked={invoiceDesign.template === "Standard"}
                                    onChange={() => setInvoiceDesign({ ...invoiceDesign, template: "Standard" })}
                                    className="w-4 h-4 accent-[#1b426e] cursor-pointer"
                                  />
                                  <span className="font-medium text-slate-800">Standard</span>
                                </label>
                              </div>

                              <hr className="border-slate-200/80 my-3" />

                              {/* Colour Header */}
                              <div className="space-y-3">
                                <span className="font-bold text-slate-900 block">Colour</span>

                                {/* Toggle switch for Compatible con impresora */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-700 font-medium">Compatible con impresora</span>
                                  <button
                                    type="button"
                                    onClick={() => setInvoiceDesign({ ...invoiceDesign, printerFriendly: !invoiceDesign.printerFriendly })}
                                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                                      invoiceDesign.printerFriendly ? "bg-[#1b426e]" : "bg-slate-300"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                                        invoiceDesign.printerFriendly ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Color Hex Input & Swatch Circle */}
                                <div className="flex items-center gap-2 pt-1">
                                  <div
                                    className="w-7 h-7 rounded-full border-2 border-white shadow-sm shrink-0"
                                    style={{ backgroundColor: invoiceDesign.color }}
                                  />
                                  <input
                                    type="text"
                                    value={invoiceDesign.color}
                                    onChange={(e) => setInvoiceDesign({ ...invoiceDesign, color: e.target.value })}
                                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#1b426e]"
                                  />
                                </div>

                                {/* Color Palette Grid (16 Circles) */}
                                <div className="grid grid-cols-6 gap-2 pt-1">
                                  {[
                                    "#555555", "#000000", "#78889b", "#3e4d55", "#79bd58", "#148c96",
                                    "#0077c8", "#92bc26", "#276918", "#964a3d", "#1b426e", "#8d0a20",
                                    "#701235", "#f4739e", "#a1006b", "#532353"
                                  ].map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => setInvoiceDesign({ ...invoiceDesign, color: c })}
                                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${
                                        invoiceDesign.color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-offset-2 ring-[#1b426e]" : ""
                                      }`}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <hr className="border-slate-200/80 my-3" />

                              {/* Fuente */}
                              <div className="space-y-1.5">
                                <label className="block font-bold text-slate-900">Fuente</label>
                                <select
                                  value={invoiceDesign.font}
                                  onChange={(e) => setInvoiceDesign({ ...invoiceDesign, font: e.target.value })}
                                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1b426e] font-medium cursor-pointer"
                                >
                                  <option value="Helvetica Neue">Helvetica Neue</option>
                                  <option value="Inter">Inter</option>
                                  <option value="Roboto">Roboto</option>
                                  <option value="Arial">Arial</option>
                                  <option value="Times New Roman">Times New Roman</option>
                                </select>
                              </div>

                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowInvoiceOptionsSidebar(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                  </aside>
                </div>
              )}

              {/* FIXED BOTTOM ACTION BAR (Full width matching user screenshot) */}
              <footer className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between z-30 shadow-lg shrink-0 print:hidden">
                {/* Left Links Dropup (Matches user screenshot) */}
                <div data-dropdown="true" className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPrintDownloadDropdown(!showPrintDownloadDropdown)}
                    disabled={isGeneratingPDF}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    {isGeneratingPDF ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                        <span>Generando PDF...</span>
                      </>
                    ) : (
                      <span>Imprimir o descargar</span>
                    )}
                  </button>

                  {showPrintDownloadDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 text-xs font-normal text-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrintDownloadDropdown(false);
                          window.print();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer font-medium text-slate-800 flex items-center justify-between"
                      >
                        <span>Imprimir</span>
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrintDownloadDropdown(false);
                          downloadInvoicePDF();
                        }}
                        disabled={isGeneratingPDF}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer font-medium text-slate-800 flex items-center justify-between"
                      >
                        <span>Descargar</span>
                        {isGeneratingPDF ? (
                          <span className="text-[10px] text-amber-600 font-semibold animate-pulse">Generando...</span>
                        ) : (
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrintDownloadDropdown(false);
                          alert("Generando recibo de entrega para la orden de empaque flexográfico...");
                          window.print();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer font-medium text-slate-800 border-t border-slate-100 mt-1 pt-2.5 flex items-center justify-between"
                      >
                        <span>Imprimir recibo de entrega</span>
                        <Printer className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Action Split Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onCloseInvoiceEditor}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  {/* Split Button 1: Guardar v */}
                  <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleSaveInvoiceRecord(false)}
                      className="px-4 py-2 rounded-l-lg bg-[#1b426e] hover:bg-[#143355] text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInvoiceSaveDropdown(!showInvoiceSaveDropdown)}
                      className="px-2.5 py-2 rounded-r-lg bg-[#143355] hover:bg-[#d06512] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${showInvoiceSaveDropdown ? "rotate-180" : "rotate-0"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showInvoiceSaveDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setShowInvoiceSaveDropdown(false);
                            handleSaveInvoiceRecord(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Guardar y cerrar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInvoiceSaveDropdown(false);
                            setInvoiceForm((prev) => ({
                              ...prev,
                              invoiceNumber: (parseInt(prev.invoiceNumber) + 1).toString(),
                              lines: [],
                            }));
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Guardar y crear nueva
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Split Button 2: Revisar y enviar v */}
                  <div data-dropdown="true" className="relative inline-flex rounded-lg shadow-sm">
                    <button
                      type="button"
                      disabled={sendingInvoiceEmail}
                      onClick={handleSendInvoiceEmail}
                      className="px-5 py-2 rounded-l-lg bg-[#004d40] hover:bg-[#00382e] text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {sendingInvoiceEmail ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando por Resend...</span>
                        </>
                      ) : (
                        <span>Revisar y enviar</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInvoiceSendDropdown(!showInvoiceSendDropdown)}
                      className="px-2.5 py-2 rounded-r-lg bg-[#00382e] hover:bg-[#002821] text-white border-l border-white/20 transition cursor-pointer flex items-center justify-center"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${showInvoiceSendDropdown ? "rotate-180" : "rotate-0"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showInvoiceSendDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setShowInvoiceSendDropdown(false);
                            setActiveInvoiceTab("Vista de PDF");
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Vista previa PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInvoiceSendDropdown(false);
                            setActiveInvoiceTab("Vista de correo electrónico");
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fff7ed] hover:text-[#1b426e] font-semibold transition cursor-pointer"
                        >
                          Vista previa correo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </footer>

            </div>

    );
  }

  return null;
}
