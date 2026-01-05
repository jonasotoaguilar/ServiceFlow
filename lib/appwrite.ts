import { Client, Databases, Account, Query, ID } from "node-appwrite";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "session";

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  if (!session || !session.value) {
    // Esto es normal si el usuario no está logueado, usar warn solo para debug intenso
    // console.warn("[Appwrite Debug] No session cookie found. Available cookies:", cookieStore.getAll().map(c => c.name));
    throw new Error("No session");
  }

  client.setSession(session.value);
  console.log("[Appwrite Debug] Session set on client");

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}

// Legacy support (using Admin Client)
const adminClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "")
  .setKey(process.env.APPWRITE_API_KEY || "");

export const databases = new Databases(adminClient);
export { Query, ID };

// Configuration for Database and Collections
// Adjust these IDs as needed or load from env if you prefer dynamic naming
export const DB_ID = "warranty-system-db";
export const COLLECTIONS = {
  WARRANTIES: "warranties",
  LOCATIONS: "locations",
  LOCATION_LOGS: "location-logs",
};
