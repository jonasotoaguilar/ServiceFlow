// Hand-authored bones — exact-layout skeletons matching dashboard geometry.
// CLI capture is deferred because dashboard requires authenticated session (PocketBase).
// To regenerate via CLI when public/login-free structure is available or with auth:
//   pnpm exec boneyard-js build http://localhost:3000 --cdp 9222
// Never commit --cookie / pb_auth tokens. This registry is imported once in app/layout.tsx
// per https://github.com/0xGF/boneyard/blob/main/packages/boneyard/README.md
import { registerBones } from "boneyard-js/react";
import dashboardStats from "./dashboard-stats.bones.json";
import dashboardTable from "./dashboard-table.bones.json";

registerBones({
	"dashboard-stats": dashboardStats as any,
	"dashboard-table": dashboardTable as any,
});
