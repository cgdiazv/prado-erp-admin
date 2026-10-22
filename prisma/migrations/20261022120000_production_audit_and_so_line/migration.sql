ALTER TABLE "WorkOrder"
ADD COLUMN "salesOrderItemId" TEXT,
ADD COLUMN "cancellationReason" TEXT;

CREATE UNIQUE INDEX "WorkOrder_salesOrderItemId_key"
ON "WorkOrder"("salesOrderItemId");

ALTER TABLE "WorkOrder"
ADD CONSTRAINT "WorkOrder_salesOrderItemId_fkey"
FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductionInventoryMovement" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "inventoryItemId" TEXT,
  "workOrderId" TEXT NOT NULL,
  "movementType" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "quantityDelta" DOUBLE PRECISION NOT NULL,
  "quantityBefore" DOUBLE PRECISION NOT NULL,
  "quantityAfter" DOUBLE PRECISION NOT NULL,
  "sku" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reference" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductionInventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductionInventoryMovement_companyId_createdAt_idx"
ON "ProductionInventoryMovement"("companyId", "createdAt");
CREATE INDEX "ProductionInventoryMovement_workOrderId_idx"
ON "ProductionInventoryMovement"("workOrderId");
CREATE INDEX "ProductionInventoryMovement_inventoryItemId_idx"
ON "ProductionInventoryMovement"("inventoryItemId");

ALTER TABLE "ProductionInventoryMovement"
ADD CONSTRAINT "ProductionInventoryMovement_inventoryItemId_fkey"
FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductionInventoryMovement"
ADD CONSTRAINT "ProductionInventoryMovement_workOrderId_fkey"
FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;