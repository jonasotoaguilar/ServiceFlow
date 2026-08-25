import { z } from "zod";
export const PocketBaseEnvSchema = z.object({
  POCKETBASE_URL: z.string().trim().min(1).refine((v) => {
    try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
  }, { message: "POCKETBASE_URL must be a valid absolute http or https URL" }),
});
export function getPocketBaseUrl(): string {
  const parsed = PocketBaseEnvSchema.safeParse({ POCKETBASE_URL: process.env.POCKETBASE_URL });
  if (!parsed.success) throw new Error("Invalid POCKETBASE_URL");
  return parsed.data.POCKETBASE_URL;
}
