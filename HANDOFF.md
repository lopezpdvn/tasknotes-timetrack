# TaskNotes TimeTrack - maintainer handoff

Snapshot: 2026-10-10. Recheck this state when resuming and update or remove this file after the first release.

## Goal and agreed scope

Prepare this companion plugin for public GitHub Releases and installation/updates through BRAT. The user chose this distribution route and is comfortable with a public repository. Prepare distribution first; functional improvements will be specified afterward.

The final repository/package/plugin ID is `tasknotes-timetrack`, the display name is **TaskNotes TimeTrack**, and the main class is `TaskNotesTimeTrack`. Version `0.1.0` is the intended first release. MIT licensing was prepared.

A native Community plugins listing and an upstream TaskNotes contribution are optional future work. They are not required for the current distribution task. Keep the current timer behavior while completing packaging.

## Verified local state

- The source repository has been moved out of the original Obsidian vault. Git history is preserved; the initial scaffold commit is `5d814ef` on `main`.
- The rename is complete. Pending rename changes are in `README.md`, `manifest.json`, `package.json`, `scripts/validate-release.mjs`, `src/main.ts`, and `tests/plugin.test.cjs`; they are not committed yet. Preserve these edits and the existing history.
- Eight behavioral tests passed again on 2026-10-10 using `node --test tests/plugin.test.cjs`. They ran through Node's TypeScript-stripping source fallback because no production `main.js` exists.
- This verifies mocked timer behavior only. Dependency installation, strict TypeScript checking, the esbuild bundle, staged release validation, and live Obsidian/BRAT installation remain unverified.
- There is no `package-lock.json`, installed dependency tree, built `main.js`, or staged `.release/` output yet.
- There is no configured Git remote. No GitHub repository or release was created during this work.
- CI and tag-release workflows are prepared but still use `npm install` as a bootstrap step. Switch them to `npm ci` after generating and committing the lockfile.

The previous agent session was rooted in the original vault. Its external writes and dependency downloads were blocked by that session's environment. Resume with this repository as the primary workspace; those failures are not evidence that the plugin fails to build. Network permissions are separate from filesystem permissions.

## Next actions

1. Read `README.md`, inspect the current working tree, and preserve existing changes. Do not reinitialize the Git repository or repeat the move/rename.
2. Install dependencies with Node.js 22.13 or newer. On Windows PowerShell, use `npm.cmd install` if execution policy blocks `npm.ps1`.
3. Run `npm.cmd run check` (or `npm run check` where supported). Fix actual packaging, typing, or build failures and rerun affected checks. This command must typecheck, build, test the compiled bundle, validate metadata, and stage exactly `main.js` and `manifest.json`.
4. Commit `package-lock.json`; change both workflows to `npm ci` and update the README's normal install instructions. Optional setup-node npm caching should be added only once the lockfile exists.
5. Commit the completed rename and distribution changes after checks pass. Generated `main.js`, `.release/`, caches, and `node_modules/` are intentionally ignored; publish built assets through releases.
6. Create the public GitHub repository named `tasknotes-timetrack` using the user's authenticated account, configure `origin`, and push `main`. If a remote/repository already exists when resuming, inspect and use it instead of creating a duplicate. Publish only this plugin repository.
7. Keep the first release at `0.1.0`. Push a tag exactly matching the manifest version, without a `v` prefix. Verify the Actions run and the resulting GitHub Release assets; a pushed tag alone is not successful distribution.
8. Replace placeholder installation directions with the actual repository URL. Verify BRAT installation in a target vault with TaskNotes enabled, including timer switching and both commands. Verify an update through BRAT before retiring the existing delivery route.

## Integration and behavior to preserve

`src/main.ts` is the editable implementation. `src/tasknotes-api.ts` is a structural subset of TaskNotes' runtime API, not a complete upstream type package. No TaskNotes fork, bundled TaskNotes code, or HTTP server is needed.

Reconciliation is reactive, retaining the task with the latest start timestamp. Equal timestamps retain the first returned session. Existing timers are preserved at startup until the user invokes a command. TaskNotes connection retries last about 30 seconds; reloading TaskNotes may require reloading this companion. Atomic concurrency across requests/devices is not guaranteed. These are existing semantics, not new feature requests.

The manifest currently requires Obsidian 1.12.2 and allows mobile. TaskNotes 4.12.5 was the original target; current source signatures were inspected, but live compatibility and mobile behavior have not been tested.

Only the development source belongs in this repository. Each Obsidian vault still needs installed plugin files, which BRAT will manage. An existing manually copied plugin bundle and vault export workflow remain in use until BRAT installation and updates are verified on all target vaults. Any edits to that separate vault/workflow require their own authorized workspace; do not add private vault paths or vault contents to this public repository.

## Resumption update - 2026-10-10

This file was copied from the vault handoff into the source repository and linked from `README.md`. The sections above preserve the originating snapshot; this update supersedes its stale local-state details.

- The rename had already been committed as `fc097d7` before this resumption. The working tree was clean at the start; preserve that commit and `5d814ef`.
- The public repository is <https://github.com/lopezpdvn/tasknotes-timetrack>, owned by `lopezpdvn`. The checked distribution preparation is commit `861dcf0`; `main` was pushed with the existing history preserved. README installation directions contain the actual URL.
- `scripts/stage-release.mjs` now rebuilds the staging directory after validating metadata, so stale files cannot enter the staged release. It checks that the directory is inside the repository and refuses a symbolic-link staging directory. A fixture-based regression check passed with stale files and a nested stale directory; the resulting staging directory contained exactly two byte-matching assets. The production build was subsequently verified below.
- Network access was enabled after the initial registry failures. `package-lock.json` was generated, and a clean `npm ci --no-audit --no-fund --cache .npm-cache` succeeded. The pinned dependencies were retained. Both workflows and README development instructions now use `npm ci`; the workflows cache npm downloads using the lockfile.
- `npm.cmd run check` passed: strict TypeScript checking, the production esbuild bundle, all eight behavioral tests against that compiled bundle, release metadata validation, and production staging for version `0.1.0`. JavaScript syntax and `git diff --check` also passed for the earlier changes.
- The user repaired the obsolete Windows deny entries on `.git`, and local Git writes now succeed. `origin` is configured as `https://github.com/lopezpdvn/tasknotes-timetrack.git`. Windows TLS and credential storage still prevented authenticated command-line pushes in this session. Publication used the authenticated GitHub connector and a one-time Actions workflow; public Git fetches work with `-c http.sslBackend=openssl`.
- Release [0.1.0](https://github.com/lopezpdvn/tasknotes-timetrack/releases/tag/0.1.0) is published, and its tag points to checked commit `861dcf0a65c38cb9de538ca7e22a156a4947dbea`. The [source CI run](https://github.com/lopezpdvn/tasknotes-timetrack/actions/runs/38089325363) and [initial publication run](https://github.com/lopezpdvn/tasknotes-timetrack/actions/runs/38089649110) succeeded. The temporary initial-publication workflow was removed after publication. The existing tag workflow remains for later releases; its tag-triggered execution was not exercised by this initial publication.
- The release contains exactly `main.js` (5906 bytes) and `manifest.json` (295 bytes). Both public downloads were compared byte-for-byte with the locally staged assets. SHA-256: `main.js` = `19badb5540d90c28252b024f5c9ba73e5a01ff641e9895839e92b6d8759a56a2`; `manifest.json` = `19e3caf22c1bbd9eff78e8128633a18e1624c0a7976ffa1035e01d182d116dd8`.
- The Obsidian CLI could not connect to the running app from this session. Live Obsidian/BRAT installation, commands, timer switching, mobile behavior, and BRAT updating remain unverified. Retain the existing manual delivery route.

Distribution packaging and the first public release are complete. Next, verify BRAT installation in the target vaults with TaskNotes enabled, using disposable tasks to exercise timer switching and both commands; verify mobile behavior where applicable. An actual update to a later version is still required before retiring manual delivery. Keep the existing delivery route until those live checks pass; do not bump the first release merely to simulate an update check.
