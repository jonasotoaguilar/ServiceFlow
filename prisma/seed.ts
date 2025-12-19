import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
// Load env vars
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(process.cwd(), "data", "warranties.json");
  console.log(`Reading data from ${dataPath}`);

  try {
    const rawData = await fs.readFile(dataPath, "utf-8");
    const warranties = JSON.parse(rawData);

    console.log(`Found ${warranties.length} warranties to migrate.`);

    for (const w of warranties) {
      await prisma.warranty.create({
        data: {
          id: w.id,
          userId: w.userId || "00000000-0000-0000-0000-000000000000",
          invoiceNumber: w.invoiceNumber,
          clientName: w.clientName,
          rut: w.rut,
          contact: w.contact,
          email: w.email,
          product: w.product,
          failureDescription: w.failureDescription,
          sku: w.sku,
          location: w.location,
          entryDate: new Date(w.entryDate),
          deliveryDate: w.deliveryDate ? new Date(w.deliveryDate) : null,
          readyDate: w.readyDate ? new Date(w.readyDate) : null,
          status: w.status,
          repairCost: w.repairCost,
          notes: w.notes,
        },
      });
    }

    console.log("Migration completed successfully.");
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      console.log("No existing data file found. Database initialized empty.");
    } else {
      console.error("Error migrating data:", error);
      throw error;
    }
  }
}

try {
  await main();
  await prisma.$disconnect();
} catch (e) {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}
