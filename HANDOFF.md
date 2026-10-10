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
- The authenticated GitHub account is `lopezpdvn`. Its public repository already exists at <https://github.com/lopezpdvn/tasknotes-timetrack>; GitHub reported it as empty. Reuse it. README installation directions now contain that URL.
- `scripts/stage-release.mjs` now rebuilds the staging directory after validating metadata, so stale files cannot enter the staged release. It checks that the directory is inside the repository and refuses a symbolic-link staging directory. A fixture-based regression check passed with stale files and a nested stale directory; the resulting staging directory contained exactly two byte-matching assets. This does not verify a production build.
- Network access was enabled after the initial registry failures. `package-lock.json` was generated, and a clean `npm ci --no-audit --no-fund --cache .npm-cache` succeeded. The pinned dependencies were retained. Both workflows and README development instructions now use `npm ci`; the workflows cache npm downloads using the lockfile.
- `npm.cmd run check` passed: strict TypeScript checking, the production esbuild bundle, all eight behavioral tests against that compiled bundle, release metadata validation, and production staging for version `0.1.0`. JavaScript syntax and `git diff --check` also passed for the earlier changes.
- The user repaired the obsolete Windows deny entries on `.git`, and Git writes now succeed. `origin` is configured as `https://github.com/lopezpdvn/tasknotes-timetrack.git`. Git reaches the public repository when invoked with `-c http.sslBackend=openssl`; the default Windows TLS backend failed. Command-line push authentication and publication remain pending. Do not infer that the GitHub connector's authentication grants command-line Git authentication.
- The Obsidian CLI could not connect to the running app from this session. Live Obsidian/BRAT installation, commands, timer switching, mobile behavior, and BRAT updating remain unverified. Retain the existing manual delivery route.

The checked distribution changes are ready to commit and push to `main`: this handoff, README directions, both workflows, the staging fix, and `package-lock.json`. Publish the intended first version `0.1.0`, then verify Actions, both release assets, and live BRAT installation. An actual update to a later version is still required before retiring manual delivery; do not bump the intended first release merely to simulate that check.
