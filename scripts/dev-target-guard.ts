export const DEV_ENDPOINT_ALLOWLIST = ["localhost", "127.0.0.1", "::1"];

/**
 * Fail-closed development-target check. Throws unless the endpoint host is a
 * loopback hostname AND the project is listed in APPWRITE_DEV_PROJECT_IDS.
 * Runs on every invocation, dry-run included, before any mutation.
 */
export function assertDevTarget(endpoint?: string, projectId?: string): void {
  if (!endpoint) {
    throw new Error("NEXT_PUBLIC_APPWRITE_ENDPOINT is not set.");
  }
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_APPWRITE_PROJECT is not set.");
  }

  let host: string;
  try {
    host = new URL(endpoint).hostname.replace(/^\[|\]$/g, "");
  } catch {
    throw new Error(`Appwrite endpoint "${endpoint}" is not a valid URL.`);
  }

  if (!DEV_ENDPOINT_ALLOWLIST.includes(host)) {
    throw new Error(
      `Appwrite endpoint host "${host}" is not on the development allowlist.`,
    );
  }

  const allowedProjects = (process.env.APPWRITE_DEV_PROJECT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (allowedProjects.length === 0) {
    throw new Error("APPWRITE_DEV_PROJECT_IDS is not set.");
  }
  if (!allowedProjects.includes(projectId)) {
    throw new Error(
      `Project "${projectId}" is not in APPWRITE_DEV_PROJECT_IDS.`,
    );
  }
}

export type ParseResult = { dryRun: boolean; confirmed: boolean };

export function parseArgs(
  argv: string[] = process.argv.slice(2),
): ParseResult {
  const dryRun = !argv.includes("--apply");
  const confirmed = argv.includes("--yes");
  for (const arg of argv) {
    if (arg !== "--apply" && arg !== "--yes" && arg !== "--dry-run") {
      throw new Error(
        "Unknown arguments. Usage: npx tsx scripts/migrate-appwrite-permissions.ts [--apply] [--yes]",
      );
    }
  }
  return { dryRun, confirmed };
}
