import { createSessionClient } from "@/lib/appwrite";

interface AuthUser {
  id: string;
  email: string | null;
  name: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const { account } = await createSessionClient();
    const user = await account.get();

    return {
      id: user.$id,
      email: user.email,
      name: user.name,
    };
  } catch (error: any) {
    // Si el error es "No session", es normal y no debemos ensuciar la consola
    if (error.message !== "No session") {
      console.error("[Auth Debug] getAuthUser error:", error);
    }
    return null;
  }
}
