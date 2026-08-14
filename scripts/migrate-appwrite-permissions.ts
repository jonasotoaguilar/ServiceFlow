import { fileURLToPath } from "node:url";
import { Client, Databases, Models } from "node-appwrite";
import { assertDevTarget, parseArgs } from "./dev-target-guard";

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

export async function main() {
  process.loadEnvFile();

  const { dryRun, confirmed } = parseArgs();

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    console.error("Missing required Appwrite environment variables.");
    if (!endpoint) console.error("  - NEXT_PUBLIC_APPWRITE_ENDPOINT");
    if (!projectId) console.error("  - NEXT_PUBLIC_APPWRITE_PROJECT");
    if (!apiKey) console.error("  - APPWRITE_API_KEY");
    process.exit(1);
  }

  // Fail-closed identity check on every invocation, dry-run included.
  assertDevTarget(endpoint, projectId);

  // Mutation requires --apply AND --yes; a bare --apply must abort.
  if (!dryRun && !confirmed) {
    console.error("Refusing to apply: --apply requires --yes.");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    await databases.get(DB_ID);
  } catch {
    console.error(
      `Database ${DB_ID} not found. Have you run setup-appwrite first?`,
    );
    process.exit(1);
  }

  console.log(
    `\n${dryRun ? "\uD83D\uDD0D DRY RUN" : "\uD83D\uDE80 APPLY"} \u2014 Appwrite Permission Migration\n`,
  );

  const results = await processCollections(databases, dryRun);

  const applied = results.filter((r) => r.status === "applied").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\nSummary: ${applied} applied, ${skipped} skipped, ${failed} failed.`);

  if (failed > 0) {
    console.error(
      "Some collections failed to update. See above for details.",
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log(
      "\nNo changes applied. Re-run with --apply to execute.",
    );
  } else {
    console.log("\nMigration complete.");
  }
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
