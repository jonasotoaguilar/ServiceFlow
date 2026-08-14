import type { Databases, Models } from "node-appwrite";

const DB_ID = "serviceflow-db";

const COLLECTIONS = [
  { id: "Services", name: "Services" },
  { id: "locations", name: "Locations" },
  { id: "location-logs", name: "Location Logs" },
];

export interface MigrationResult {
  name: string;
  id: string;
  status: "applied" | "skipped" | "failed";
  previousPermissions?: string[];
  previousDocumentSecurity?: boolean;
  error?: string;
}

export function isCollectionNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const candidate = err as { code?: unknown; status?: unknown };
  return candidate.code === 404 || candidate.status === 404;
}

export function buildMigrationPlan(
  collections: Models.Collection[],
): Array<{
  id: string;
  name: string;
  currentPermissions: string[];
  targetPermissions: string[];
  documentSecurity: boolean;
  enabled: boolean;
  needsUpdate: boolean;
}> {
  return collections.map((col) => ({
    id: col.$id,
    name: col.name,
    currentPermissions: col.$permissions,
    targetPermissions: [],
    documentSecurity: col.documentSecurity,
    enabled: col.enabled,
    needsUpdate: col.$permissions.length > 0,
  }));
}

export async function processCollections(
  databases: Databases,
  dryRun: boolean,
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const col of COLLECTIONS) {
    let current: Models.Collection;
    try {
      current = await databases.getCollection(DB_ID, col.id);
    } catch (err) {
      if (!isCollectionNotFound(err)) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  \u2717 Failed: ${message}`);
        results.push({
          name: col.name,
          id: col.id,
          status: "failed",
          error: message,
        });
        continue;
      }
      console.warn(
        `  \u26A0  Collection "${col.name}" (${col.id}) not found, skipping.`,
      );
      continue;
    }

    const plan = buildMigrationPlan([current])[0];

    console.log(`  Collection: ${plan.name} (${plan.id})`);
    console.log(
      `    Current permissions:   ${plan.currentPermissions.length === 0 ? "(empty)" : plan.currentPermissions.join(", ")}`,
    );
    console.log(`    Document security:     ${plan.documentSecurity}`);
    console.log(`    Enabled:               ${plan.enabled}`);
    console.log(`    Target permissions:    (empty)`);

    if (!plan.needsUpdate) {
      console.log(`    \u2192 Already compliant.\n`);
      results.push({ name: plan.name, id: plan.id, status: "skipped" });
      continue;
    }

    if (dryRun) {
      console.log(`    \u2192 Pending (dry-run).\n`);
      results.push({ name: plan.name, id: plan.id, status: "skipped" });
      continue;
    }

    console.log(
      `    Snapshot \u2014 previous permissions: [${plan.currentPermissions.join(", ")}], documentSecurity: ${plan.documentSecurity}`,
    );

    try {
      await databases.updateCollection(
        DB_ID,
        plan.id,
        plan.name,
        plan.targetPermissions,
        plan.documentSecurity,
        plan.enabled,
      );
      console.log(`    \u2713 Applied.\n`);
      results.push({
        name: plan.name,
        id: plan.id,
        status: "applied",
        previousPermissions: plan.currentPermissions,
        previousDocumentSecurity: plan.documentSecurity,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`    \u2717 Failed: ${message}\n`);
      results.push({
        name: plan.name,
        id: plan.id,
        status: "failed",
        error: message,
      });
    }
  }

  return results;
}
