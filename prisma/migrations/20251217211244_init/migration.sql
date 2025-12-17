-- AlterTable
ALTER TABLE "Warranty" ALTER COLUMN "invoiceNumber" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "LocationLog" (
    "id" TEXT NOT NULL,
    "warrantyId" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LocationLog" ADD CONSTRAINT "LocationLog_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
