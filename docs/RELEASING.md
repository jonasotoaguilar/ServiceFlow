# Releasing ServiceFlow

ServiceFlow publishes stable releases through a protected, fail-closed pipeline. This document defines the contract for cutting a release from `main` and applies to every future stable tag.

The pipeline is backend-agnostic and durable: the same checks and publications apply regardless of runtime changes.

## Quick path for the release manager

1. Prepare exactly one `docs/releases/vX.Y.Z.md` from the curated template and sync `package.json` version to `X.Y.Z`.
2. Merge documentation and code changes to `main` before creating any tag.
3. Verify protection prerequisites are satisfied.
4. Push the stable tag `vX.Y.Z` only; do not push prerelease tags for publication.
5. Observe the workflow `preflight → build-amd64 + build-arm64 (environment: release) → release (environment: release) → verify` and confirm success before announcing.

Documentation changes and container images never publish by themselves; only a stable tag triggers publication — merge to `main` publishes nothing.

## Contract

| Topic | Contract |
|-------|----------|
| Trigger | Stable `vX.Y.Z` triggers `.github/workflows/release.yml`; prerelease `vX.Y.Z-*` is excluded by `!v*-*` and never publishes. |
| Concurrency | Grouped per tag (`release-<tag>`) with `cancel-in-progress: false`; a second run on the same tag waits. |
| Hooks | `scripts/release-preflight` (read-only), `scripts/release-publish` (write-capable, per-arch and manifest steps), `scripts/release-verify` (read-only) must be executable at the tagged commit; only the per-arch build jobs and the `release` job write. |
| Permissions | Workflow default `contents: read`; `preflight` job `contents: read` + `actions: read`; `build-amd64`/`build-arm64` jobs `contents: read` + `packages: write` in the `release` environment; `release` job `contents: write` + `packages: write`; `verify` job `contents: read` + `packages: read`. |
| Build | `build-amd64` runs on `ubuntu-24.04` and `build-arm64` on `ubuntu-24.04-arm` with Docker Buildx and no QEMU emulation; `scripts/release-publish` builds each native `linux/<arch>` image as `<tag>-<arch>`, then the `release` job assembles the multi-arch manifest. |
| GitHub Release | Created via `gh release create --verify-tag --notes-file docs/releases/<tag>.md`; never `--generate-notes`. |
| GHCR tags | Manifest assembly publishes four tags `vX.Y.Z`, `X.Y`, `X`, `latest` to `ghcr.io/jonasotoaguilar/serviceflow` from the two native per-arch images. |
| Verification | `scripts/release-verify` inspects the four tags with `docker buildx imagetools inspect --raw` and requires identical SHA256 digests. |
| Deploy ownership | `.github/workflows/release.yml` is the only image publisher; stable tag publishes version tags + `latest`; merge to `main` publishes nothing. |

## Protection prerequisites before the first tag

These are external GitHub settings and currently must be configured and verified manually:

- `release` environment with required reviewers.
- Tag protection for `v*`.
- GHCR package access for the `release` and `verify` jobs.

Do not tag before these protections are confirmed.

## Fail-closed checklist (`scripts/release-preflight`)

- [ ] `package.json` version equals tag without `v`.
- [ ] Exactly one non-empty `docs/releases/vX.Y.Z.md` whose name matches the tag, H1 begins `# vX.Y.Z`, contains `## What changed` and `## Upgrade` or `## Install`, and contains no placeholder markers.
- [ ] No `CHANGELOG*` file present.
- [ ] `scripts/release-preflight`, `scripts/release-publish`, `scripts/release-verify` are executable.
- [ ] `Dockerfile` exists.
- [ ] `pnpm run check` and `pnpm exec tsc --noEmit` are clean (extend with `pnpm run test:run` and `pnpm run build` per project policy).

## Failure and rollback

Failed or incorrect releases preserve evidence (logs, GHCR image if pushed). Never move or delete stable tags, GitHub Releases, or GHCR images automatically. Fix forward with the next patch `vX.Y.(Z+1)`.

To roll back a deployment, redeploy by the immutable prior digest recorded before upgrade; see `docs/releases/v2.2.1.md#rollback`.

## References

- Workflow: `.github/workflows/release.yml`
- Hooks: `scripts/release-preflight`, `scripts/release-publish`, `scripts/release-verify`
- Current notes: `docs/releases/v2.2.1.md`
- Image: `ghcr.io/jonasotoaguilar/serviceflow`
