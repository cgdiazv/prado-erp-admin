import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCompanyId } from "@/lib/tenant";

// Helper to detect placeholder SKUs such as "Sin numero", "S/N", etc.
function isPlaceholderSku(val: unknown): boolean {
  if (!val) return true;
  const str = String(val).trim().toLowerCase();
  if (!str) return true;
  return (
    [
      "sin numero",
      "sin número",
      "sin-numero",
      "sin_numero",
      "s/n",
      "sn",
      "s.n.",
      "sin codigo",
      "sin código",
      "n/a",
      "na",
      "ninguno",
      "none",
      "null",
      "undefined",
    ].includes(str) ||
    str.startsWith("sin num") ||
    str.startsWith("sin cod")
  );
}

// POST /api/import/batch - High performance bulk import endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const companyId = await resolveCompanyId(request);
    const body = await request.json();
    const { category, items } = body;

    if (!category || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Categoría y lista de elementos son obligatorios." },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    // ==========================================
    // 1. PRODUCTOS / INVENTARIO
    // ==========================================
    if (category === "productos") {
      // 1.1 Pre-register missing categories in bulk
      const categoryNames = Array.from(
        new Set(
          items
            .map((it: any) => (typeof it.category === "string" ? it.category.trim() : ""))
            .filter((c): c is string => Boolean(c))
        )
      );

      if (categoryNames.length > 0) {
        try {
          const existingCats = await prisma.productCategory.findMany({
            where: {
              companyId,
              name: { in: categoryNames, mode: "insensitive" },
            },
            select: { name: true },
          });
          const existingCatSet = new Set(existingCats.map((c) => c.name.toLowerCase()));
          const missingCats = categoryNames.filter((c) => !existingCatSet.has(c.toLowerCase()));

          if (missingCats.length > 0) {
            await prisma.productCategory.createMany({
              data: missingCats.map((name) => ({ companyId, name })),
              skipDuplicates: true,
            });
          }
        } catch (catErr) {
          console.warn("ProductCategory bulk register warning:", catErr);
        }
      }

      // 1.2 Identify existing inventory items for this company
      const rawSkus = items
        .map((it: any) => (it.sku ? String(it.sku).trim() : ""))
        .filter((s): s is string => Boolean(s) && !isPlaceholderSku(s));

      const existingItems = await prisma.inventoryItem.findMany({
        where: {
          companyId,
          sku: { in: rawSkus, mode: "insensitive" },
        },
        select: { id: true, sku: true },
      });

      const existingSkuMap = new Map<string, string>();
      const allKnownSkus = new Set<string>();

      existingItems.forEach((it) => {
        existingSkuMap.set(it.sku.toLowerCase(), it.id);
        allKnownSkus.add(it.sku.toLowerCase());
      });

      // 1.3 Sanitize SKUs & resolve duplicates / "Sin numero"
      let autoSkuCounter = 1;
      const seenBatchSkus = new Set<string>();

      const sanitizedItems: Array<{
        id?: string;
        sku: string;
        description: string;
        category: string | null;
        quantity: number;
        cost: number;
        price: number;
        trackingType: string;
        isUpdate: boolean;
      }> = [];

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        let sku = it.sku ? String(it.sku).trim() : "";

        // Autogenerate unique SKU if empty or placeholder like "Sin numero"
        if (isPlaceholderSku(sku)) {
          let candidate = `SN-${String(autoSkuCounter).padStart(5, "0")}`;
          while (allKnownSkus.has(candidate.toLowerCase()) || seenBatchSkus.has(candidate.toLowerCase())) {
            autoSkuCounter++;
            candidate = `SN-${String(autoSkuCounter).padStart(5, "0")}`;
          }
          autoSkuCounter++;
          sku = candidate;
        }

        const skuKey = sku.toLowerCase();

        // If duplicate SKU within the same batch, disambiguate if needed
        if (seenBatchSkus.has(skuKey)) {
          let suffix = 2;
          let disambiguated = `${sku}-${suffix}`;
          while (
            allKnownSkus.has(disambiguated.toLowerCase()) ||
            seenBatchSkus.has(disambiguated.toLowerCase())
          ) {
            suffix++;
            disambiguated = `${sku}-${suffix}`;
          }
          sku = disambiguated;
        }

        seenBatchSkus.add(sku.toLowerCase());
        allKnownSkus.add(sku.toLowerCase());

        const existingId = existingSkuMap.get(sku.toLowerCase());
        const description = (it.description ? String(it.description).trim() : "") || `Artículo ${sku}`;
        const category = typeof it.category === "string" && it.category.trim() ? it.category.trim() : null;
        const quantity = typeof it.quantity === "number" ? it.quantity : Number(String(it.quantity || "0").replace(/[^0-9.-]/g, "")) || 0;
        const cost = typeof it.cost === "number" ? it.cost : Number(String(it.cost || "0").replace(/[^0-9.-]/g, "")) || 0;
        const price = typeof it.price === "number" ? it.price : Number(String(it.price || "0").replace(/[^0-9.-]/g, "")) || 0;
        const trackingType = ["LOT", "SERIAL"].includes(String(it.trackingType || "").toUpperCase())
          ? String(it.trackingType).toUpperCase()
          : "NONE";

        sanitizedItems.push({
          id: existingId,
          sku,
          description,
          category,
          quantity,
          cost,
          price,
          trackingType,
          isUpdate: Boolean(existingId),
        });
      }

      // 1.4 Split into create and update arrays
      const toCreate = sanitizedItems.filter((it) => !it.isUpdate);
      const toUpdate = sanitizedItems.filter((it) => it.isUpdate && it.id);

      // Execute createMany in blocks of 500
      for (let i = 0; i < toCreate.length; i += 500) {
        const chunk = toCreate.slice(i, i + 500);
        await prisma.inventoryItem.createMany({
          data: chunk.map((c) => ({
            companyId,
            sku: c.sku,
            description: c.description,
            category: c.category,
            quantity: c.quantity,
            cost: c.cost,
            price: c.price,
            trackingType: c.trackingType,
          })),
          skipDuplicates: true,
        });
        createdCount += chunk.length;
      }

      // Execute updates in parallel chunks of 50
      for (let i = 0; i < toUpdate.length; i += 50) {
        const chunk = toUpdate.slice(i, i + 50);
        await Promise.all(
          chunk.map((u) =>
            prisma.inventoryItem.update({
              where: { id: u.id },
              data: {
                description: u.description,
                category: u.category,
                quantity: u.quantity,
                cost: u.cost,
                price: u.price,
                trackingType: u.trackingType,
              },
            })
          )
        );
        updatedCount += chunk.length;
      }

    // ==========================================
    // 2. CLIENTES
    // ==========================================
    } else if (category === "clientes") {
      const dataToInsert = items.map((it: any) => ({
        companyId,
        name: it.name?.trim() || "Cliente Sin Nombre",
        macolaCode: it.macolaCode?.trim() || null,
        email: it.email?.trim() || null,
        phone: it.phone?.trim() || null,
        address: it.address?.trim() || null,
        currency: it.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
      }));

      for (let i = 0; i < dataToInsert.length; i += 500) {
        const chunk = dataToInsert.slice(i, i + 500);
        await prisma.customer.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        createdCount += chunk.length;
      }

    // ==========================================
    // 3. PROVEEDORES
    // ==========================================
    } else if (category === "proveedores") {
      const dataToInsert = items.map((it: any) => ({
        companyId,
        name: it.name?.trim() || "Proveedor Sin Nombre",
        macolaCode: it.macolaCode?.trim() || null,
        email: it.email?.trim() || null,
        phone: it.phone?.trim() || null,
        address: it.address?.trim() || null,
        currency: it.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
      }));

      for (let i = 0; i < dataToInsert.length; i += 500) {
        const chunk = dataToInsert.slice(i, i + 500);
        await prisma.vendor.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        createdCount += chunk.length;
      }

    // ==========================================
    // 4. CUENTAS CONTABLES
    // ==========================================
    } else if (category === "cuentas") {
      const dataToInsert = items.map((it: any) => ({
        companyId,
        code: it.code?.trim() || "0000",
        name: it.name?.trim() || "Cuenta Sin Nombre",
        type: it.type?.trim() || "Activo",
        currency: it.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
        balance: Number(it.balance) || 0,
        isActive: it.isActive !== false,
      }));

      for (let i = 0; i < dataToInsert.length; i += 500) {
        const chunk = dataToInsert.slice(i, i + 500);
        await prisma.account.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        createdCount += chunk.length;
      }

    // ==========================================
    // 5. FACTURAS DE COMPRA
    // ==========================================
    } else if (category === "facturas_compra") {
      const db = prisma as any;
      for (let i = 0; i < items.length; i += 50) {
        const chunk = items.slice(i, i + 50);
        await Promise.all(
          chunk.map(async (it: any) => {
            try {
              await db.purchaseInvoice.create({
                data: {
                  companyId,
                  invoiceNumber: it.invoiceNumber?.trim() || `FPROV-${Date.now()}`,
                  vendorName: it.vendorName?.trim() || "Proveedor",
                  total: Number(it.total) || 0,
                  subtotal: Number(it.subtotal || it.total) || 0,
                  issueDate: it.issueDate?.trim() || new Date().toISOString().split("T")[0],
                  dueDate: it.dueDate?.trim() || new Date().toISOString().split("T")[0],
                  currency: it.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
                  paymentStatus: it.paymentStatus || "PENDIENTE",
                  inventoryStatus: it.inventoryStatus || "INGRESADO",
                },
              });
              createdCount++;
            } catch (err: any) {
              errors.push(`Factura ${it.invoiceNumber}: ${err.message || "Error al registrar"}`);
            }
          })
        );
      }

    // ==========================================
    // 6. FACTURAS DE VENTA
    // ==========================================
    } else if (category === "facturas_venta") {
      for (let i = 0; i < items.length; i += 50) {
        const chunk = items.slice(i, i + 50);
        await Promise.all(
          chunk.map(async (it: any) => {
            try {
              await prisma.salesInvoice.create({
                data: {
                  companyId,
                  invoiceNumber: it.invoiceNumber?.trim() || `FAC-${Date.now()}`,
                  customerName: it.customerName?.trim() || "Cliente",
                  total: Number(it.total) || 0,
                  subtotal: Number(it.subtotal || it.total) || 0,
                  invoiceDate: it.invoiceDate?.trim() || new Date().toISOString().split("T")[0],
                  dueDate: it.dueDate?.trim() || new Date().toISOString().split("T")[0],
                  currency: it.currency?.trim().toUpperCase() === "HNL" ? "HNL" : "USD",
                  status: it.status || "Emitida",
                },
              });
              createdCount++;
            } catch (err: any) {
              errors.push(`Factura ${it.invoiceNumber}: ${err.message || "Error al registrar"}`);
            }
          })
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: `Categoría de importación no soportada: ${category}` },
        { status: 400 }
      );
    }

    const elapsedMs = Date.now() - startTime;
    const totalProcessed = createdCount + updatedCount;

    return NextResponse.json({
      success: true,
      successCount: totalProcessed,
      createdCount,
      updatedCount,
      errorCount: errors.length,
      errors,
      elapsedMs,
    });
  } catch (error: unknown) {
    console.error("POST /api/import/batch error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
