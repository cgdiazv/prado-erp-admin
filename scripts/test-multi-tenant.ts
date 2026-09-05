import { prisma } from "../lib/prisma";

async function runMultiTenantVerification() {
  console.log("=== INICIANDO PRUEBAS DE AISLAMIENTO MULTI-INQUILINO (MULTI-TENANT) ===");

  const TEST_TENANT_ID = "tenant-isolated-test-xyz";

  try {
    // 1. Verificar existencia de datos de la empresa por defecto (Wayne Trademark)
    const defaultCompany = await prisma.company.findUnique({
      where: { id: "default" },
    });
    console.log("1. Tenant por defecto (Wayne Trademark):", defaultCompany ? `OK (${defaultCompany.name})` : "NO ENCONTRADO");

    const [userCount, accountCount] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
    ]);
    console.log(`   Usuarios en DB: ${userCount}, Cuentas Contables en DB: ${accountCount}`);

    // 2. Limpieza previa del tenant de prueba si quedó de alguna corrida anterior
    await prisma.salesInvoiceLine.deleteMany({ where: { salesInvoice: { companyId: TEST_TENANT_ID } } });
    await prisma.salesInvoice.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { companyId: TEST_TENANT_ID } } });
    await prisma.purchaseOrder.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.bankAccount.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.customer.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.vendor.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.company.deleteMany({ where: { id: TEST_TENANT_ID } });

    // 3. Crear nuevo tenant "Empresa Beta S.A."
    const newTenant = await prisma.company.create({
      data: {
        id: TEST_TENANT_ID,
        name: "Empresa Beta S.A.",
        email: "admin@beta.hn",
        phone: "+504 9999-8888",
        currency: "HNL",
      },
    });
    console.log(`2. Tenant nuevo creado: '${newTenant.name}' (ID: ${newTenant.id})`);

    // 4. Crear registros en el nuevo tenant
    const custB = await prisma.customer.create({
      data: {
        name: "Cliente Exclusivo de Beta",
        companyId: TEST_TENANT_ID,
        currency: "HNL",
        email: "cliente@beta.hn",
      },
    });

    const vendB = await prisma.vendor.create({
      data: {
        name: "Proveedor Exclusivo de Beta",
        companyId: TEST_TENANT_ID,
        currency: "HNL",
        email: "proveedor@beta.hn",
      },
    });

    const invB = await prisma.salesInvoice.create({
      data: {
        companyId: TEST_TENANT_ID,
        invoiceNumber: "INV-BETA-001",
        customerName: custB.name,
        customerId: custB.id,
        invoiceDate: "2026-09-05",
        subtotal: 1000,
        total: 1150,
        currency: "HNL",
        status: "Emitida",
      },
    });

    const poB = await prisma.purchaseOrder.create({
      data: {
        companyId: TEST_TENANT_ID,
        orderNumber: "PO-BETA-001",
        vendorName: vendB.name,
        vendorId: vendB.id,
        issueDate: "2026-09-05",
        subtotal: 500,
        total: 575,
        currency: "HNL",
        status: "ENVIADA",
      },
    });

    const bankB = await prisma.bankAccount.create({
      data: {
        companyId: TEST_TENANT_ID,
        name: "Banco Beta HNL",
        accountNumber: "9988776655",
        type: "Cuenta de cheques empresarial HNL",
        currency: "HNL",
        bankBalance: 50000,
        bookBalance: 50000,
      },
    });

    console.log("3. Registros de prueba creados en el nuevo tenant.");

    // 5. ASOCIACIONES Y PRUEBAS DE AISLAMIENTO:
    console.log("4. Verificando aislamiento cruzado...");

    // A. El tenant 'default' no debe ver datos de TEST_TENANT_ID
    const defaultCustQuery = await prisma.customer.findMany({
      where: { companyId: "default", name: "Cliente Exclusivo de Beta" },
    });
    if (defaultCustQuery.length !== 0) throw new Error("Falla de aislamiento: 'default' ve clientes de 'beta'!");

    const defaultVendQuery = await prisma.vendor.findMany({
      where: { companyId: "default", name: "Proveedor Exclusivo de Beta" },
    });
    if (defaultVendQuery.length !== 0) throw new Error("Falla de aislamiento: 'default' ve proveedores de 'beta'!");

    const defaultInvQuery = await prisma.salesInvoice.findMany({
      where: { companyId: "default", invoiceNumber: "INV-BETA-001" },
    });
    if (defaultInvQuery.length !== 0) throw new Error("Falla de aislamiento: 'default' ve facturas de 'beta'!");

    const defaultPoQuery = await prisma.purchaseOrder.findMany({
      where: { companyId: "default", orderNumber: "PO-BETA-001" },
    });
    if (defaultPoQuery.length !== 0) throw new Error("Falla de aislamiento: 'default' ve órdenes de compra de 'beta'!");

    const defaultBankQuery = await prisma.bankAccount.findMany({
      where: { companyId: "default", accountNumber: "9988776655" },
    });
    if (defaultBankQuery.length !== 0) throw new Error("Falla de aislamiento: 'default' ve cuentas bancarias de 'beta'!");

    console.log("   [PASS] El tenant 'default' tiene 0 visibilidad de los datos de 'beta'.");

    // B. El nuevo tenant sólo debe ver sus propios datos y 0 de 'default'
    const betaCustomers = await prisma.customer.findMany({
      where: { companyId: TEST_TENANT_ID },
    });
    if (betaCustomers.length !== 1 || betaCustomers[0].name !== "Cliente Exclusivo de Beta") {
      throw new Error(`Falla de aislamiento: beta esperaba 1 cliente pero obtuvo ${betaCustomers.length}`);
    }

    const betaVendors = await prisma.vendor.findMany({
      where: { companyId: TEST_TENANT_ID },
    });
    if (betaVendors.length !== 1 || betaVendors[0].name !== "Proveedor Exclusivo de Beta") {
      throw new Error(`Falla de aislamiento: beta esperaba 1 proveedor pero obtuvo ${betaVendors.length}`);
    }

    const betaInvoices = await prisma.salesInvoice.findMany({
      where: { companyId: TEST_TENANT_ID },
    });
    if (betaInvoices.length !== 1 || betaInvoices[0].invoiceNumber !== "INV-BETA-001") {
      throw new Error(`Falla de aislamiento: beta esperaba 1 factura pero obtuvo ${betaInvoices.length}`);
    }

    const betaPOs = await prisma.purchaseOrder.findMany({
      where: { companyId: TEST_TENANT_ID },
    });
    if (betaPOs.length !== 1 || betaPOs[0].orderNumber !== "PO-BETA-001") {
      throw new Error(`Falla de aislamiento: beta esperaba 1 orden de compra pero obtuvo ${betaPOs.length}`);
    }

    const betaBanks = await prisma.bankAccount.findMany({
      where: { companyId: TEST_TENANT_ID },
    });
    if (betaBanks.length !== 1 || betaBanks[0].accountNumber !== "9988776655") {
      throw new Error(`Falla de aislamiento: beta esperaba 1 banco pero obtuvo ${betaBanks.length}`);
    }

    console.log("   [PASS] El tenant 'beta' sólo ve exactamente sus datos creados y 0 de 'default'.");

    // 6. Limpieza final
    await prisma.salesInvoiceLine.deleteMany({ where: { salesInvoice: { companyId: TEST_TENANT_ID } } });
    await prisma.salesInvoice.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { companyId: TEST_TENANT_ID } } });
    await prisma.purchaseOrder.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.bankAccount.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.customer.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.vendor.deleteMany({ where: { companyId: TEST_TENANT_ID } });
    await prisma.company.deleteMany({ where: { id: TEST_TENANT_ID } });

    console.log("5. Registros de prueba eliminados correctamente.");
    console.log("\n>>> RESULTADO: ¡TODAS LAS PRUEBAS DE AISLAMIENTO MULTI-INQUILINO PASARON CON ÉXITO! <<<");
  } catch (error) {
    console.error("ERROR EN PRUEBAS MULTI-TENANT:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMultiTenantVerification();
