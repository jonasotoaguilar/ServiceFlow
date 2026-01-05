import { PrismaClient } from "@prisma/client";
import { Client, Databases, ID } from "node-appwrite";
import "dotenv/config";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error("Missing Appwrite environment variables");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

// Import these to avoid duplication if possible, but keep script standalone
const DB_ID = "warranty-system-db";
const COLLECTIONS = {
  WARRANTIES: "warranties",
  LOCATIONS: "locations",
  LOCATION_LOGS: "location-logs",
};

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration...");

  try {
    // 1. Migrate Locations
    console.log("Fetching locations from Prisma...");
    const locations = await prisma.location.findMany();
    console.log(`Found ${locations.length} locations.`);

    for (const loc of locations) {
      try {
        await databases.createDocument(
          DB_ID,
          COLLECTIONS.LOCATIONS,
          loc.id, // Reuse ID
          {
            name: loc.name,
            userId: loc.userId,
            isActive: loc.isActive,
            createdAt: loc.createdAt,
            updatedAt: loc.updatedAt,
          }
        );
        process.stdout.write(".");
      } catch (e: any) {
        if (e.code === 409) process.stdout.write("S"); // Skip duplicate
        else console.error(`\nFailed to migrate location ${loc.id}:`, e);
      }
    }
    console.log("\nLocations migrated.");

    // 2. Migrate Warranties
    console.log("Fetching warranties from Prisma...");
    const warranties = await prisma.warranty.findMany();
    console.log(`Found ${warranties.length} warranties.`);

    for (const w of warranties) {
      try {
        await databases.createDocument(DB_ID, COLLECTIONS.WARRANTIES, w.id, {
          userId: w.userId,
          invoiceNumber: w.invoiceNumber,
          clientName: w.clientName,
          rut: w.rut,
          contact: w.contact,
          email: w.email,
          product: w.product,
          failureDescription: w.failureDescription,
          sku: w.sku,
          locationId: w.locationId,
          entryDate: w.entryDate,
          deliveryDate: w.deliveryDate,
          readyDate: w.readyDate,
          status: w.status,
          repairCost: w.repairCost,
          notes: w.notes,
        });
        process.stdout.write(".");
      } catch (e: any) {
        if (e.code === 409) process.stdout.write("S");
        else console.error(`\nFailed to migrate warranty ${w.id}:`, e);
      }
    }
    console.log("\nWarranties migrated.");

    // 3. Migrate LocationLogs
    console.log("Fetching location logs from Prisma...");
    const logs = await prisma.locationLog.findMany({
      include: { warranty: { select: { userId: true } } }, // Fetch userId to denormalize
    });
    console.log(`Found ${logs.length} logs.`);

    for (const log of logs) {
      try {
        await databases.createDocument(
          DB_ID,
          COLLECTIONS.LOCATION_LOGS,
          log.id,
          {
            userId: log.warranty.userId, // Denormalized
            warrantyId: log.warrantyId,
            fromLocationId: log.fromLocationId,
            toLocationId: log.toLocationId,
            changedAt: log.changedAt,
          }
        );
        process.stdout.write(".");
      } catch (e: any) {
        if (e.code === 409) process.stdout.write("S");
        else console.error(`\nFailed to migrate log ${log.id}:`, e);
      }
    }
    console.log("\nLocation logs migrated.");
    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
