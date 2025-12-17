import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

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

const LOCATIONS = ["Recepcion", "Taller", "Bodega", "Proveedor", "Cliente"];
const STATUSES = ["pending", "ready", "completed"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function main() {
  console.log("Setting up test user...");

  const email = "test@example.com";
  const password = "password123";

  // Check if user exists or create new one
  let userId;

  // Try to sign in first to see if user exists (admin way)
  // Or just list users by email
  const {
    data: { users },
  } = await supabaseAdmin.auth.admin.listUsers();

  const existingUser = users.find((u) => u.email === email);

  if (existingUser) {
    console.log(
      `User ${email} already exists. Using existing ID: ${existingUser.id}`
    );
    userId = existingUser.id;
  } else {
    console.log(`Creating new user: ${email}`);
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Test User" },
      });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }
    userId = newUser.user.id;
    console.log(`Created user with ID: ${userId}`);
  }

  console.log("Generating 40 dummy warranties...");

  const warranties = [];

  for (let i = 0; i < 40; i++) {
    const status = randomItem(STATUSES);
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - randomInt(1, 60)); // Ingresó hace 1-60 días

    let readyDate = null;
    let deliveryDate = null;
    let repairCost = 0;

    if (status === "ready" || status === "completed") {
      readyDate = new Date(entryDate);
      readyDate.setDate(readyDate.getDate() + randomInt(1, 10)); // Estuvo lista 1-10 días después
      repairCost = randomInt(5000, 50000);
    }

    if (status === "completed" && readyDate) {
      deliveryDate = new Date(readyDate);
      deliveryDate.setDate(deliveryDate.getDate() + randomInt(1, 5)); // Se entregó 1-5 días después
    }

    warranties.push({
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
      userId: userId, // Assign to test user
    });
  }

  for (const w of warranties) {
    await prisma.warranty.create({
      data: w,
    });
  }

  console.log("Done! 40 warranties verified and assigned to test@example.com");
}

try {
  await main();
  await prisma.$disconnect();
} catch (e) {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}
