-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "invoiceNumber" INTEGER,
    "clientName" TEXT NOT NULL,
    "rut" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "product" TEXT NOT NULL,
    "failureDescription" TEXT,
    "sku" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Ingresada',
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "readyDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "repairCost" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);
