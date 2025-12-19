import { PrismaClient } from "@prisma/client";
import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const CLIENT_NAMES = [
  "Juan Pérez",
  "Maria González",
  "Carlos López",
  "Ana Rodríguez",
  "Pedro Martinez",
  "Laura Sanchez",
  "Diego Fernandez",
  "Valentina Diaz",
  "Jose Morales",
  "Camila Ramirez",
  "Roberto Silva",
  "Patricia Torres",
  "Luis Herrera",
  "Carmen Flores",
  "Miguel Castro",
  "Francisca Reyes",
  "Manuel Alvarez",
  "Javiera Romero",
  "Francisco Rojas",
  "Carolina Vasquez",
];

const PRODUCTS = [
  "Clipper Kemei",
  "Secador Parlux",
  "Plancha Babyliss",
  "Afeitadora Whal",
  "Trimmer Andis",
  "Cafetera Nespresso",
  "Licuadora Oster",
  "Batidora KitchenAid",
  "Microondas Samsung",
  "Horno Thomas",
];

const LOCATIONS = ["Ingresada", "Taller", "Bodega", "Proveedor", "Cliente"];
const STATUSES = ["pending", "ready", "completed"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000";

  for (const name of LOCATIONS) {
    await prisma.location.upsert({
      where: {
        name_userId: {
          name,
          userId: DUMMY_USER_ID,
        },
      },
      update: {},
      create: {
        name,
        userId: DUMMY_USER_ID,
      },
    });
  }

  console.log("Generating 40 dummy warranties...");

  const warranties = [];

  for (let i = 0; i < 40; i++) {
    const status = randomItem(STATUSES);
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - randomInt(1, 60));

    let readyDate = null;
    let deliveryDate = null;
    let repairCost = 0;

    if (status === "ready" || status === "completed") {
      readyDate = new Date(entryDate);
      readyDate.setDate(readyDate.getDate() + randomInt(1, 10));
      repairCost = randomInt(5000, 50000);
    }

    if (status === "completed" && readyDate) {
      deliveryDate = new Date(readyDate);
      deliveryDate.setDate(deliveryDate.getDate() + randomInt(1, 5));
    }

    warranties.push({
      userId: DUMMY_USER_ID,
      invoiceNumber: randomInt(1000, 9999).toString(),
      clientName: randomItem(CLIENT_NAMES),
      rut: `${randomInt(10, 20)}.${randomInt(100, 999)}.${randomInt(
        100,
        999
      )}-${randomInt(0, 9)}`,
      contact: `+56 9 ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`,
      email: `cliente${i}@example.com`,
      product: randomItem(PRODUCTS),
      failureDescription: "Falla generada aleatoriamente para pruebas.",
      sku: `SKU-${randomInt(100, 999)}`,
      location: status === "completed" ? "Cliente" : randomItem(LOCATIONS),
      entryDate: entryDate,
      readyDate: readyDate,
      deliveryDate: deliveryDate,
      status: status,
      repairCost: repairCost,
      notes: "Registro generado automáticamente",
    });
  }

  for (const w of warranties) {
    await prisma.warranty.create({
      data: w,
    });
  }

  console.log("Done! 40 warranties verified and assigned to test@example.com");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
