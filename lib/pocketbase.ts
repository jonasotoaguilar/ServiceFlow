import PocketBase from "pocketbase";
import { cookies } from "next/headers";
import { getPocketBaseUrl } from "./env";

export async function createPocketBaseClient() {
  const url = getPocketBaseUrl();
  const pb = new PocketBase(url);
  const store = await cookies();
  const raw = store.get("pb_auth")?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.token === "string" && parsed.record) {
        pb.authStore.save(parsed.token, parsed.record as any);
      }
    } catch {
      // ignore malformed
    }
  }
  return pb;
}
