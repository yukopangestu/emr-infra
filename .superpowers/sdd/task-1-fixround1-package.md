# Fix Round 1 Review Package: Task 1 prerender fix

FIX_BASE: d2bb823
HEAD: cbe7397

## Commits
cbe7397 docs: Append fix round report for Task 1 prerender configuration
9d0ccb9 fix: Add @angular/ssr and configure prerendering for all 10 routes

## Diff stat
 .superpowers/sdd/progress.md              |  14 +
 .superpowers/sdd/task-1-report.md         | 393 +++++++++++++
 .superpowers/sdd/task-1-review-package.md | 929 ++++++++++++++++++++++++++++++
 angular.json                              |  12 +-
 package-lock.json                         | 227 +++++---
 package.json                              |  10 +-
 src/app/app.config.server.ts              |  10 +
 src/app/app.config.ts                     |  15 +-
 src/app/app.routes.server.ts              |  44 ++
 src/app/app.routes.ts                     |  34 +-
 src/main.server.ts                        |  11 +
 src/server.ts                             |  68 +++
 tsconfig.app.json                         |  10 +-
 13 files changed, 1691 insertions(+), 86 deletions(-)

## Full diff
diff --git a/.superpowers/sdd/progress.md b/.superpowers/sdd/progress.md
index f97ccd0..f95cff5 100644
--- a/.superpowers/sdd/progress.md
+++ b/.superpowers/sdd/progress.md
@@ -41,10 +41,24 @@
 
 - [ ] Task 1: Initialize Angular Project & Dependencies
 - [ ] Task 2: Create Global Styling & Theme System
 - [ ] Task 3: Create Core Services (Search, Theme, Analytics, Content)
 - [ ] Task 4: Create Shared Components (Header, Sidebar, Cards)
 - [ ] Task 5: Extract SVG Diagrams from HTML
 - [ ] Task 6: Create Architecture Data Structure
 
 ---
 
+
+## Ruling: Task 1 architecture conflict (2026-09-10)
+
+**Conflict:** Task 1 implementer used Angular CLI 22.1.7, which scaffolds standalone-component/bootstrapApplication architecture. The plan's Tasks 2-14 are written entirely in NgModule idiom (AppModule, SharedModule, ArchitectureModule, declarations/imports/exports). Additionally, angular.json has no prerender config — the old `prerender` key inside `build.options` no longer applies to the `@angular/build:application` builder; modern Angular requires `ng add @angular/ssr` for static route prerendering.
+
+**Ruling:** Adopt standalone-component architecture and Angular 22 as-is (this matches the user's explicit choice during brainstorming: "Approach C — adapt for modern web standards," and NgModules are legacy Angular idiom as of v17+; forcing an older CLI to get NgModules would contradict that choice and ship an outdated toolchain). Two concrete actions:
+
+1. **Fix round on Task 1:** add `@angular/ssr` + configure prerender routes for `/, /s1-/s9` so the build produces real static HTML per route (required for Vercel static hosting — this is the modern equivalent of the plan's old `prerender` config block).
+2. **All subsequent task briefs (Tasks 2-14) are adapted from NgModule code to standalone-component code when dispatched** — components get `standalone: true` + `imports: [...]` per component instead of `standalone: false` + NgModule declarations; routing uses `provideRouter()` in `app.config.ts` + functional route configs instead of `RouterModule.forRoot()`/`forChild()` NgModules; no `AppModule`/`SharedModule`/`ArchitectureModule` files are created. I (controller) will translate each task's plan text to standalone idiom in the dispatch brief rather than quoting the plan's NgModule code verbatim.
+
+**Kept as-is (not worth the churn):** project internal name stays `emr-docs` (angular.json project key, package.json name, vercel.json `dist/emr-docs/browser`) rather than renaming to `emr-infra` — purely cosmetic, already internally consistent, renaming risks breaking working config for no functional gain. Vitest stays as the test runner (Angular 22's official default, integrates with `TestBed` via `@angular/core/testing` — the reviewer's compatibility concern is real to research but not yet confirmed broken; verify empirically in Task 3's test run rather than assuming failure).
+
+**Cost if wrong:** If standalone/Vitest choice turns out unworkable downstream, the fix is rewriting component decorators and route config — mechanical, not a full re-scaffold. If prerender via `@angular/ssr` doesn't fully satisfy "no server-side rendering at runtime," fallback is pure client-side SPA with a single index.html (loses per-route static HTML, acceptable degradation, not a rebuild).
+
diff --git a/.superpowers/sdd/task-1-report.md b/.superpowers/sdd/task-1-report.md
new file mode 100644
index 0000000..e4e2b78
--- /dev/null
+++ b/.superpowers/sdd/task-1-report.md
@@ -0,0 +1,393 @@
+# Task 1: Angular 17 Project Initialization - Report
+
+**Status:** DONE
+
+**Date:** 2026-09-10
+
+**Commit Hash:** `d2bb823641cfdaf28fcfd1123dd2c0ae4b99fcda`
+
+---
+
+## Summary
+
+Successfully initialized a new Angular 22 project from scratch with all required dependencies, build configuration, and Vercel deployment setup. The project builds successfully and is ready for further development.
+
+---
+
+## Steps Completed
+
+### 1. Project Initialization
+- Used `npx @angular/cli@latest new` with `--skip-git` flag
+- Configured with routing enabled and SCSS for styling
+- Skipped automatic npm install to manage dependencies manually
+- Moved all generated files from temporary `emr-docs/` directory to repository root
+
+### 2. Dependency Management
+- Verified Angular 22.1.0 installation (meets Angular 17+ requirement)
+- Confirmed RxJS 7.8.0 and TypeScript 6.0.2 were installed
+- Added **lunr** (v2.3.9) to dependencies for search functionality
+- Total of 378 packages installed with zero vulnerabilities
+
+**Package Summary:**
+```
+Dependencies:
+- @angular/common: ^22.1.0
+- @angular/compiler: ^22.1.0
+- @angular/core: ^22.1.0
+- @angular/forms: ^22.1.0
+- @angular/platform-browser: ^22.1.0
+- @angular/router: ^22.1.0
+- lunr: ^2.3.9
+- rxjs: ~7.8.0
+- tslib: ^2.3.0
+
+Dev Dependencies:
+- @angular/build: ^22.1.7
+- @angular/cli: ^22.1.7
+- @angular/compiler-cli: ^22.1.0
+- typescript: ~6.0.2
+- vitest: ^4.0.8
+- prettier: ^3.8.1
+- jsdom: ^28.0.0
+```
+
+### 3. Build Configuration
+
+#### angular.json
+- Updated build output hashing for production mode
+- Added production/development build configurations
+- Configured SCSS as the inline style language
+- Set up proper asset handling with public folder
+
+#### vercel.json
+Created comprehensive Vercel deployment configuration:
+- **Build Command:** `npm run build`
+- **Output Directory:** `dist/emr-docs/browser`
+- **Cache Headers:**
+  - Generic routes: 3600s (1 hour) cache
+  - HTML routes (index.html, /s[0-9].html): Must-revalidate with 3600s server cache
+  - Assets: 31536000s (1 year) immutable cache
+- **Environment Variables:** APP_TITLE and APP_VERSION configured
+
+**Note on Prerender Routes:** Initial attempts to configure prerender routes in angular.json for /, /s1-/s9 revealed that Angular 22's application builder requires server-side rendering setup. This is deferred to a follow-up task that implements full SSR with a server build. Standard client-side routing is currently configured.
+
+### 4. Project Structure
+- Created `.gitignore` with comprehensive Angular project exclusions
+  - Excludes: node_modules, dist, .angular, build artifacts, IDE files, system files
+  - Preserves: source code, configuration files, documentation
+- Preserved generated project structure:
+  - `/src`: Application source files
+  - `/public`: Static assets (favicon)
+  - `/src/app`: Root component and routing configuration
+
+### 5. Build Verification
+
+**npm install Output:**
+```
+added 378 packages, and audited 379 packages in 7s
+112 packages are looking for funding
+found 0 vulnerabilities
+```
+
+**Build Output:**
+```
+> emr-docs@0.0.0 build
+> ng build
+
+❯ Building...
+✔ Building...
+Initial chunk files | Names         |  Raw size | Estimated transfer size
+main-IOJKSJLE.js    | main          | 217.20 kB |                59.65 kB
+styles-5INURTSO.css | styles        |   0 bytes |                 0 bytes
+
+                    | Initial total | 217.20 kB |                59.65 kB
+
+Application bundle generation complete. [1.853 seconds] - 2026-09-10T10:42:33.154Z
+
+Output location: /Users/yukopangestu/yukopangestu/emr-infra/dist/emr-docs
+```
+
+**Output Structure Verified:**
+```
+dist/emr-docs/
+├── browser/
+│   ├── favicon.ico
+│   ├── index.html
+│   ├── main-IOJKSJLE.js (217 KB)
+│   └── styles-5INURTSO.css
+├── 3rdpartylicenses.txt
+└── prerendered-routes.json
+```
+
+### 6. Git Commit
+- Committed all project files (20 files changed, 8838 insertions)
+- Commit message includes full project setup description
+- Excluded node_modules and dist directories per .gitignore
+
+---
+
+## Key Files Created/Modified
+
+| File | Purpose |
+|------|---------|
+| `package.json` | NPM configuration with all dependencies |
+| `angular.json` | Angular CLI configuration with build settings |
+| `vercel.json` | Vercel deployment and caching configuration |
+| `.gitignore` | Git ignore patterns for Angular projects |
+| `tsconfig.json` | TypeScript compiler configuration |
+| `src/main.ts` | Application bootstrap |
+| `src/index.html` | HTML entry point |
+| `src/app/` | Root application component with routing |
+| `public/favicon.ico` | Application favicon |
+
+---
+
+## Concerns & Follow-Up Items
+
+### Minor Concerns
+1. **Prerender Routes Not Yet Implemented:**
+   - Angular 22's application builder requires SSR setup for prerender functionality
+   - Current implementation uses standard client-side routing
+   - **Action:** Implement server-side rendering in Task 2 to enable prerender routes for /, /s1-/s9
+
+2. **Bundle Size Considerations:**
+   - Main bundle is 217 KB (uncompressed, ~60 KB compressed)
+   - Will need optimization for production use with documentation content
+   - **Action:** Monitor and optimize bundle size after adding documentation content
+
+3. **Lunr Search Library:**
+   - Successfully added as dependency but not yet integrated into application
+   - TypeScript types are available via lunr's built-in types
+   - **Action:** Integrate search functionality in subsequent tasks
+
+---
+
+## Verification Checklist
+
+- [x] Angular 17+ project initialized (v22.1.0)
+- [x] Dependencies installed: Angular, RxJS, TypeScript, lunr.js, SCSS
+- [x] angular.json configured with proper build settings
+- [x] vercel.json created with build command, output directory, cache headers
+- [x] .gitignore created for Angular projects
+- [x] npm install completed successfully (378 packages, 0 vulnerabilities)
+- [x] npm run build completed successfully
+- [x] Build output verified at dist/emr-docs/browser
+- [x] All changes committed to git
+- [x] Commit hash: d2bb823641cfdaf28fcfd1123dd2c0ae4b99fcda
+
+---
+
+## Repository State
+
+**Branch:** main
+
+**Working Directory:** Clean (all changes committed)
+
+**Project Structure:**
+```
+/Users/yukopangestu/yukopangestu/emr-infra/
+├── .gitignore
+├── .superpowers/
+├── .git/
+├── .angular/ (build cache)
+├── .claude/
+├── .vscode/
+├── docs/ (existing documentation)
+├── node_modules/ (378 packages)
+├── public/ (assets)
+├── src/ (source code)
+├── dist/ (build output)
+├── angular.json
+├── package.json
+├── package-lock.json
+├── tsconfig.json
+├── tsconfig.app.json
+├── tsconfig.spec.json
+├── vercel.json
+└── README.md
+```
+
+---
+
+## Next Steps (Task 2+)
+
+1. Implement server-side rendering (SSR) for prerender routes
+2. Create routing guards and lazy loading structure for 9 sections
+3. Integrate lunr.js search functionality
+4. Build documentation content components
+5. Configure environment-specific builds for staging/production
+6. Set up CI/CD pipeline for automated builds and Vercel deployments
+
+---
+
+**Report Generated:** 2026-09-10 17:43 UTC
+
+**Status Final:** ✅ DONE
+
+---
+
+## Fix Round: Prerender Configuration (2026-09-10)
+
+**Issue Found:** The initial angular.json had no working prerender configuration. The old-style `prerender` key inside `build.options` does not work with Angular 22's `@angular/build:application` builder.
+
+**Fix Implemented:**
+
+### 1. Added @angular/ssr Support
+- Ran `npx ng add @angular/ssr --skip-confirmation`
+- Installed @angular/ssr v22.1.7 (matching Angular version)
+- Generated server-side rendering infrastructure:
+  - `/src/main.server.ts` - Server bootstrap configuration
+  - `/src/server.ts` - Express.js server for runtime SSR (optional for Vercel)
+  - `/src/app/app.config.server.ts` - Server-specific Angular configuration
+  - `/src/app/app.routes.server.ts` - Route prerendering configuration
+
+### 2. Configured Routes for Prerendering
+**Updated `/src/app/app.routes.ts`:**
+```typescript
+export const routes: Routes = [
+  { path: '', pathMatch: 'full' },
+  { path: 's1' },
+  { path: 's2' },
+  { path: 's3' },
+  { path: 's4' },
+  { path: 's5' },
+  { path: 's6' },
+  { path: 's7' },
+  { path: 's8' },
+  { path: 's9' },
+];
+```
+
+**Updated `/src/app/app.routes.server.ts`:**
+Configured explicit prerendering for all 10 routes:
+```typescript
+export const serverRoutes: ServerRoute[] = [
+  { path: "", renderMode: RenderMode.Prerender },
+  { path: "s1", renderMode: RenderMode.Prerender },
+  // ... s2 through s9 ...
+];
+```
+
+### 3. Updated Build Configuration
+- Modified `angular.json` to include SSR configuration:
+  - Added `server: "src/main.server.ts"`
+  - Added `outputMode: "server"`
+  - Added security and SSR entry point configuration
+
+### 4. Build Verification
+
+**Build Command:**
+```bash
+npm run build
+```
+
+**Build Output:**
+```
+❯ Building...
+✔ Building...
+Browser bundles     
+  main-P7Z2ATXQ.js     | main    | 256.17 kB
+  styles-5INURTSO.css  | styles  |   0 bytes
+
+Server bundles      
+  server.mjs           | server           | 820.17 kB
+  main.server.mjs      | main.server      | 706.43 kB
+  polyfills.server.mjs | polyfills.server | 235.00 kB
+
+Prerendered 10 static routes.
+Application bundle generation complete. [2.599 seconds]
+
+Output location: /Users/yukopangestu/yukopangestu/emr-infra/dist/emr-docs
+```
+
+**Static HTML Files Generated:**
+```
+dist/emr-docs/browser/
+├── index.html (21 KB) — Route: /
+├── s1/index.html (21 KB) — Route: /s1
+├── s2/index.html (21 KB) — Route: /s2
+├── s3/index.html (21 KB) — Route: /s3
+├── s4/index.html (21 KB) — Route: /s4
+├── s5/index.html (21 KB) — Route: /s5
+├── s6/index.html (21 KB) — Route: /s6
+├── s7/index.html (21 KB) — Route: /s7
+├── s8/index.html (21 KB) — Route: /s8
+├── s9/index.html (21 KB) — Route: /s9
+├── main-P7Z2ATXQ.js (256 KB)
+├── styles-5INURTSO.css
+└── favicon.ico
+```
+
+**Prerender Verification:**
+File list shows all 10 routes prerendered to static HTML:
+```bash
+$ ls -lh dist/emr-docs/browser/*/index.html dist/emr-docs/browser/index.html
+-rw-r--r--  1 yukopangestu  staff  21K Sep 10 17:48 dist/emr-docs/browser/index.html
+-rw-r--r--  1 yukopangestu  staff  21K Sep 10 17:48 dist/emr-docs/browser/s1/index.html
+... (s2-s9) ...
+```
+
+**Prerendered Routes Configuration:**
+```json
+{
+  "routes": {
+    "/": {},
+    "/s1": {},
+    "/s2": {},
+    "/s3": {},
+    "/s4": {},
+    "/s5": {},
+    "/s6": {},
+    "/s7": {},
+    "/s8": {},
+    "/s9": {}
+  }
+}
+```
+
+### 5. Deployment Configuration
+- `vercel.json` already configured correctly to serve from `dist/emr-docs/browser`
+- No changes needed — output directory matches prerendered static files location
+- Vercel will serve static HTML files without requiring a server at runtime
+
+### 6. Verification Commands
+
+**Verify build produces HTML files:**
+```bash
+find dist/emr-docs/browser -name "index.html" | sort
+# Output: 10 HTML files (index.html + s1-s9)
+```
+
+**Verify prerendered routes configuration:**
+```bash
+cat dist/emr-docs/prerendered-routes.json
+# Output: JSON with all 10 routes listed
+```
+
+**Sample HTML file verification:**
+Each prerendered file contains:
+- Full Angular application code
+- Initial route rendering
+- Pre-rendered component markup
+- Ready for immediate display (no client-side loading delay)
+
+---
+
+## Fix Report Summary
+
+| Aspect | Status |
+|--------|--------|
+| SSR package added | ✅ Complete (@angular/ssr v22.1.7) |
+| 10 routes configured | ✅ Complete (/, /s1-/s9) |
+| Static HTML files generated | ✅ Complete (10 × 21KB HTML files) |
+| Build produces prerendered output | ✅ Complete ("Prerendered 10 static routes" confirmed) |
+| Vercel deployment ready | ✅ Complete (no server required) |
+| Project configuration preserved | ✅ Complete (standalone architecture, Vitest, project name `emr-docs`) |
+
+---
+
+**Commit Hash:** `9d0ccb9`
+
+**Files Changed:** 13 files (angular.json, package.json, routes, SSR files, build config)
+
+**Status:** ✅ DONE — All 10 routes now prerender to static HTML files for Vercel static hosting without runtime server requirement.
diff --git a/.superpowers/sdd/task-1-review-package.md b/.superpowers/sdd/task-1-review-package.md
new file mode 100644
index 0000000..e733632
--- /dev/null
+++ b/.superpowers/sdd/task-1-review-package.md
@@ -0,0 +1,929 @@
+# Review Package: Task 1 — Initialize Angular Project & Dependencies
+
+**Base:** c9a6cd3
+**Head:** d2bb823641cfdaf28fcfd1123dd2c0ae4b99fcda
+
+## Commits
+```
+d2bb823 feat: Initialize Angular 17 project with Vercel deployment config
+```
+
+## Diff stat
+```
+ .gitignore                   |   48 +
+ .superpowers/sdd/progress.md |   50 +
+ README.md                    |   59 +
+ angular.json                 |   78 +
+ package-lock.json            | 8052 ++++++++++++++++++++++++++++++++++++++++++
+ package.json                 |   33 +
+ public/favicon.ico           |  Bin 0 -> 15086 bytes
+ src/app/app.config.ts        |   10 +
+ src/app/app.html             |  344 ++
+ src/app/app.routes.ts        |    3 +
+ src/app/app.scss             |    0
+ src/app/app.spec.ts          |   24 +
+ src/app/app.ts               |   12 +
+ src/index.html               |   13 +
+ src/main.ts                  |    6 +
+ src/styles.scss              |    1 +
+ tsconfig.app.json            |   14 +
+ tsconfig.json                |   31 +
+ tsconfig.spec.json           |   14 +
+ vercel.json                  |   46 +
+ 20 files changed, 8838 insertions(+)
+```
+
+## Full diff (excluding package-lock.json, favicon binary)
+
+diff --git a/.gitignore b/.gitignore
+new file mode 100644
+index 0000000..9ba1284
+--- /dev/null
++++ b/.gitignore
+@@ -0,0 +1,48 @@
++# See http://help.github.com/ignore-files/ for more about ignoring files.
++
++# Compiled output
++/dist
++/tmp
++/out-tsc
++/bazel-out
++
++# Node
++/node_modules
++npm-debug.log
++npm-error.log
++yarn-error.log
++
++# IDEs and editors
++.idea/
++.project
++.classpath
++.c9/
++*.launch
++.settings/
++*.sublime-workspace
++
++# Visual Studio Code
++.vscode/*
++!.vscode/settings.json
++!.vscode/tasks.json
++!.vscode/launch.json
++!.vscode/extensions.json
++.history/*
++
++# Miscellaneous
++/.angular/cache
++.sass-cache/
++/connect.lock
++/coverage
++/libpeerconnection.log
++testem.log
++/typings
++
++# System files
++.DS_Store
++Thumbs.db
++
++# Local environment variables
++.env
++.env.local
++.env.*.local
+diff --git a/.superpowers/sdd/progress.md b/.superpowers/sdd/progress.md
+new file mode 100644
+index 0000000..f97ccd0
+--- /dev/null
++++ b/.superpowers/sdd/progress.md
+@@ -0,0 +1,50 @@
++# SDD ledger — plan: docs/superpowers/plans/2026-09-10-emr-angular-implementation.md
++
++**Branch:** main  
++**Merge Base:** c9a6cd3 (initial setup with design spec)  
++**Workspace:** .superpowers/sdd/
++
++## Pre-flight conflict scan
++
++| Task pair | Interface contract | Conflict found | Ruling |
++|-----------|-------------------|---|---|
++| T1 ↔ All | Angular project scaffold | None — T1 creates scaffold, all others depend on it | Proceed |
++| T2 ↔ T3-T6 | Global styles, CSS vars | None — T2 defines vars, T3+ consume them | Proceed |
++| T3 ↔ T4 | Core services exports | T4 imports from T3/services/index — spec includes this | Proceed |
++| T4 ↔ T5 | SVG diagram files | T5 creates files, T4 references by filename in data | Proceed |
++| T5 ↔ T6 | architecture.data.ts structure | T6 creates data, T4/T5 structure matches interfaces defined in T3 | Proceed |
++| T1-T6 internal | No conflicting file edits | None found — each task creates distinct files | Proceed |
++
++**Self-check: all tasks self-consistent?**
++- T1: creates `.gitignore`, `vercel.json`, `angular.json` — no later edits ✓
++- T2: creates styles in `src/styles/` — no later edits ✓
++- T3: creates services in `src/app/core/services/` — specs are authoritative ✓
++- T4: creates components in `src/app/shared/components/` — no later component edits ✓
++- T5: creates SVG files in `src/assets/diagrams/` — standalone ✓
++- T6: creates data in `src/assets/data/` — standalone ✓
++
++**Spec coverage check (global constraints):**
++- Angular 17+ LTS ✓ (T1 installs)
++- Node.js 18+ ✓ (assumed in environment)
++- Pre-render all routes ✓ (T12 finalizes, T1 scaffolds)
++- Lighthouse 95+ ✓ (T13 verifies)
++- Dark mode via CSS variables ✓ (T2 creates)
++- Search with Lunr.js ✓ (T3 creates, T1 installs)
++- Analytics (Vercel + GA) ✓ (T3 + T11 implement)
++- SEO ✓ (T10 implements)
++
++**Scan result:** Clean. No conflicts found. Proceed to Task 1.
++
++---
++
++## Tasks
++
++- [ ] Task 1: Initialize Angular Project & Dependencies
++- [ ] Task 2: Create Global Styling & Theme System
++- [ ] Task 3: Create Core Services (Search, Theme, Analytics, Content)
++- [ ] Task 4: Create Shared Components (Header, Sidebar, Cards)
++- [ ] Task 5: Extract SVG Diagrams from HTML
++- [ ] Task 6: Create Architecture Data Structure
++
++---
++
+diff --git a/README.md b/README.md
+new file mode 100644
+index 0000000..a49daa7
+--- /dev/null
++++ b/README.md
+@@ -0,0 +1,59 @@
++# EmrDocs
++
++This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.7.
++
++## Development server
++
++To start a local development server, run:
++
++```bash
++ng serve
++```
++
++Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.
++
++## Code scaffolding
++
++Angular CLI includes powerful code scaffolding tools. To generate a new component, run:
++
++```bash
++ng generate component component-name
++```
++
++For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:
++
++```bash
++ng generate --help
++```
++
++## Building
++
++To build the project run:
++
++```bash
++ng build
++```
++
++This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.
++
++## Running unit tests
++
++To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:
++
++```bash
++ng test
++```
++
++## Running end-to-end tests
++
++For end-to-end (e2e) testing, run:
++
++```bash
++ng e2e
++```
++
++Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.
++
++## Additional Resources
++
++For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
+diff --git a/angular.json b/angular.json
+new file mode 100644
+index 0000000..7294e7a
+--- /dev/null
++++ b/angular.json
+@@ -0,0 +1,78 @@
++{
++  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
++  "version": 1,
++  "cli": {
++    "packageManager": "npm"
++  },
++  "newProjectRoot": "projects",
++  "projects": {
++    "emr-docs": {
++      "projectType": "application",
++      "schematics": {
++        "@schematics/angular:component": {
++          "style": "scss"
++        }
++      },
++      "root": "",
++      "sourceRoot": "src",
++      "prefix": "app",
++      "architect": {
++        "build": {
++          "builder": "@angular/build:application",
++          "options": {
++            "browser": "src/main.ts",
++            "tsConfig": "tsconfig.app.json",
++            "inlineStyleLanguage": "scss",
++            "assets": [
++              {
++                "glob": "**/*",
++                "input": "public"
++              }
++            ],
++            "styles": [
++              "src/styles.scss"
++            ]
++          },
++          "configurations": {
++            "production": {
++              "budgets": [
++                {
++                  "type": "initial",
++                  "maximumWarning": "500kB",
++                  "maximumError": "1MB"
++                },
++                {
++                  "type": "anyComponentStyle",
++                  "maximumWarning": "4kB",
++                  "maximumError": "8kB"
++                }
++              ],
++              "outputHashing": "all"
++            },
++            "development": {
++              "optimization": false,
++              "extractLicenses": false,
++              "sourceMap": true
++            }
++          },
++          "defaultConfiguration": "production"
++        },
++        "serve": {
++          "builder": "@angular/build:dev-server",
++          "configurations": {
++            "production": {
++              "buildTarget": "emr-docs:build:production"
++            },
++            "development": {
++              "buildTarget": "emr-docs:build:development"
++            }
++          },
++          "defaultConfiguration": "development"
++        },
++        "test": {
++          "builder": "@angular/build:unit-test"
++        }
++      }
++    }
++  }
++}
+diff --git a/package.json b/package.json
+new file mode 100644
+index 0000000..4d4a913
+--- /dev/null
++++ b/package.json
+@@ -0,0 +1,33 @@
++{
++  "name": "emr-docs",
++  "version": "0.0.0",
++  "scripts": {
++    "ng": "ng",
++    "start": "ng serve",
++    "build": "ng build",
++    "watch": "ng build --watch --configuration development",
++    "test": "ng test"
++  },
++  "private": true,
++  "packageManager": "npm@11.12.1",
++  "dependencies": {
++    "@angular/common": "^22.1.0",
++    "@angular/compiler": "^22.1.0",
++    "@angular/core": "^22.1.0",
++    "@angular/forms": "^22.1.0",
++    "@angular/platform-browser": "^22.1.0",
++    "@angular/router": "^22.1.0",
++    "lunr": "^2.3.9",
++    "rxjs": "~7.8.0",
++    "tslib": "^2.3.0"
++  },
++  "devDependencies": {
++    "@angular/build": "^22.1.7",
++    "@angular/cli": "^22.1.7",
++    "@angular/compiler-cli": "^22.1.0",
++    "jsdom": "^28.0.0",
++    "prettier": "^3.8.1",
++    "typescript": "~6.0.2",
++    "vitest": "^4.0.8"
++  }
++}
+\ No newline at end of file
+diff --git a/src/app/app.config.ts b/src/app/app.config.ts
+new file mode 100644
+index 0000000..e60fc79
+--- /dev/null
++++ b/src/app/app.config.ts
+@@ -0,0 +1,10 @@
++import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
++import { provideRouter } from '@angular/router';
++import { routes } from './app.routes';
++
++export const appConfig: ApplicationConfig = {
++  providers: [
++    provideBrowserGlobalErrorListeners(),
++    provideRouter(routes)
++  ]
++};
+diff --git a/src/app/app.html b/src/app/app.html
+new file mode 100644
+index 0000000..a1c4296
+--- /dev/null
++++ b/src/app/app.html
+@@ -0,0 +1,344 @@
++<!-- * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * -->
++<!-- * * * * * * * * * * * The content below * * * * * * * * * * * -->
++<!-- * * * * * * * * * * is only a placeholder * * * * * * * * * * -->
++<!-- * * * * * * * * * * and can be replaced.  * * * * * * * * * * -->
++<!-- * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * -->
++<!-- * * * * * * * * * Delete the template below * * * * * * * * * -->
++<!-- * * * * * * * to get started with your project! * * * * * * * -->
++<!-- * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * -->
++
++<style>
++  :host {
++    --bright-blue: oklch(51.01% 0.274 263.83);
++    --electric-violet: oklch(53.18% 0.28 296.97);
++    --french-violet: oklch(47.66% 0.246 305.88);
++    --vivid-pink: oklch(69.02% 0.277 332.77);
++    --hot-red: oklch(61.42% 0.238 15.34);
++    --orange-red: oklch(63.32% 0.24 31.68);
++
++    --gray-900: oklch(19.37% 0.006 300.98);
++    --gray-700: oklch(36.98% 0.014 302.71);
++    --gray-400: oklch(70.9% 0.015 304.04);
++
++    --red-to-pink-to-purple-vertical-gradient: linear-gradient(
++      180deg,
++      var(--orange-red) 0%,
++      var(--vivid-pink) 50%,
++      var(--electric-violet) 100%
++    );
++
++    --red-to-pink-to-purple-horizontal-gradient: linear-gradient(
++      90deg,
++      var(--orange-red) 0%,
++      var(--vivid-pink) 50%,
++      var(--electric-violet) 100%
++    );
++
++    --pill-accent: var(--bright-blue);
++
++    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
++      Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
++      "Segoe UI Symbol";
++    box-sizing: border-box;
++    -webkit-font-smoothing: antialiased;
++    -moz-osx-font-smoothing: grayscale;
++    display: block;
++    height: 100dvh;
++  }
++
++  h1 {
++    font-size: 3.125rem;
++    color: var(--gray-900);
++    font-weight: 500;
++    line-height: 100%;
++    letter-spacing: -0.125rem;
++    margin: 0;
++    font-family: "Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
++      Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
++      "Segoe UI Symbol";
++  }
++
++  p {
++    margin: 0;
++    color: var(--gray-700);
++  }
++
++  main {
++    width: 100%;
++    min-height: 100%;
++    display: flex;
++    justify-content: center;
++    align-items: center;
++    padding: 1rem;
++    box-sizing: inherit;
++    position: relative;
++  }
++
++  .angular-logo {
++    max-width: 9.2rem;
++  }
++
++  .content {
++    display: flex;
++    justify-content: space-around;
++    width: 100%;
++    max-width: 700px;
++    margin-bottom: 3rem;
++  }
++
++  .content h1 {
++    margin-top: 1.75rem;
++  }
++
++  .content p {
++    margin-top: 1.5rem;
++  }
++
++  .divider {
++    width: 1px;
++    background: var(--red-to-pink-to-purple-vertical-gradient);
++    margin-inline: 0.5rem;
++  }
++
++  .pill-group {
++    display: flex;
++    flex-direction: column;
++    align-items: start;
++    flex-wrap: wrap;
++    gap: 1.25rem;
++  }
++
++  .pill {
++    display: flex;
++    align-items: center;
++    --pill-accent: var(--bright-blue);
++    background: color-mix(in srgb, var(--pill-accent) 5%, transparent);
++    color: var(--pill-accent);
++    padding-inline: 0.75rem;
++    padding-block: 0.375rem;
++    border-radius: 2.75rem;
++    border: 0;
++    transition: background 0.3s ease;
++    font-family: var(--inter-font);
++    font-size: 0.875rem;
++    font-style: normal;
++    font-weight: 500;
++    line-height: 1.4rem;
++    letter-spacing: -0.00875rem;
++    text-decoration: none;
++    white-space: nowrap;
++  }
++
++  .pill:hover {
++    background: color-mix(in srgb, var(--pill-accent) 15%, transparent);
++  }
++
++  .pill-group .pill:nth-child(6n + 1) {
++    --pill-accent: var(--bright-blue);
++  }
++  .pill-group .pill:nth-child(6n + 2) {
++    --pill-accent: var(--electric-violet);
++  }
++  .pill-group .pill:nth-child(6n + 3) {
++    --pill-accent: var(--french-violet);
++  }
++
++  .pill-group .pill:nth-child(6n + 4),
++  .pill-group .pill:nth-child(6n + 5),
++  .pill-group .pill:nth-child(6n + 6) {
++    --pill-accent: var(--hot-red);
++  }
++
++  .pill-group svg {
++    margin-inline-start: 0.25rem;
++  }
++
++  .social-links {
++    display: flex;
++    align-items: center;
++    gap: 0.73rem;
++    margin-top: 1.5rem;
++  }
++
++  .social-links path {
++    transition: fill 0.3s ease;
++    fill: var(--gray-400);
++  }
++
++  .social-links a:hover svg path {
++    fill: var(--gray-900);
++  }
++
++  @media screen and (max-width: 650px) {
++    .content {
++      flex-direction: column;
++      width: max-content;
++    }
++
++    .divider {
++      height: 1px;
++      width: 100%;
++      background: var(--red-to-pink-to-purple-horizontal-gradient);
++      margin-block: 1.5rem;
++    }
++  }
++</style>
++
++<main class="main">
++  <div class="content">
++    <div class="left-side">
++      <svg
++        xmlns="http://www.w3.org/2000/svg"
++        viewBox="0 0 982 239"
++        fill="none"
++        class="angular-logo"
++      >
++        <g clip-path="url(#a)">
++          <path
++            fill="url(#b)"
++            d="M388.676 191.625h30.849L363.31 31.828h-35.758l-56.215 159.797h30.848l13.174-39.356h60.061l13.256 39.356Zm-65.461-62.675 21.602-64.311h1.227l21.602 64.311h-44.431Zm126.831-7.527v70.202h-28.23V71.839h27.002v20.374h1.392c2.782-6.71 7.2-12.028 13.255-15.956 6.056-3.927 13.584-5.89 22.503-5.89 8.264 0 15.465 1.8 21.684 5.318 6.137 3.518 10.964 8.673 14.319 15.382 3.437 6.71 5.074 14.81 4.992 24.383v76.175h-28.23v-71.92c0-8.019-2.046-14.237-6.219-18.819-4.173-4.5-9.819-6.791-17.102-6.791-4.91 0-9.328 1.063-13.174 3.272-3.846 2.128-6.792 5.237-9.001 9.328-2.046 4.009-3.191 8.918-3.191 14.728ZM589.233 239c-10.147 0-18.82-1.391-26.103-4.091-7.282-2.7-13.092-6.382-17.511-10.964-4.418-4.582-7.528-9.655-9.164-15.219l25.448-6.136c1.145 2.372 2.782 4.663 4.991 6.954 2.209 2.291 5.155 4.255 8.837 5.81 3.683 1.554 8.428 2.291 14.074 2.291 8.019 0 14.647-1.964 19.884-5.81 5.237-3.845 7.856-10.227 7.856-19.064v-22.665h-1.391c-1.473 2.946-3.601 5.892-6.383 9.001-2.782 3.109-6.464 5.645-10.965 7.691-4.582 2.046-10.228 3.109-17.101 3.109-9.165 0-17.511-2.209-25.039-6.545-7.446-4.337-13.42-10.883-17.757-19.474-4.418-8.673-6.628-19.473-6.628-32.565 0-13.091 2.21-24.301 6.628-33.383 4.419-9.082 10.311-15.955 17.839-20.7 7.528-4.746 15.874-7.037 25.039-7.037 7.037 0 12.846 1.145 17.347 3.518 4.582 2.373 8.182 5.236 10.883 8.51 2.7 3.272 4.746 6.382 6.137 9.327h1.554v-19.8h27.821v121.749c0 10.228-2.454 18.737-7.364 25.447-4.91 6.709-11.538 11.7-20.048 15.055-8.509 3.355-18.165 4.991-28.884 4.991Zm.245-71.266c5.974 0 11.047-1.473 15.302-4.337 4.173-2.945 7.446-7.118 9.573-12.519 2.21-5.482 3.274-12.027 3.274-19.637 0-7.609-1.064-14.155-3.274-19.8-2.127-5.646-5.318-10.064-9.491-13.255-4.174-3.11-9.329-4.746-15.384-4.746s-11.537 1.636-15.792 4.91c-4.173 3.272-7.365 7.772-9.492 13.418-2.128 5.727-3.191 12.191-3.191 19.392 0 7.2 1.063 13.745 3.273 19.228 2.127 5.482 5.318 9.736 9.573 12.764 4.174 3.027 9.41 4.582 15.629 4.582Zm141.56-26.51V71.839h28.23v119.786h-27.412v-21.273h-1.227c-2.7 6.709-7.119 12.191-13.338 16.446-6.137 4.255-13.747 6.382-22.748 6.382-7.855 0-14.81-1.718-20.783-5.237-5.974-3.518-10.72-8.591-14.075-15.382-3.355-6.709-5.073-14.891-5.073-24.464V71.839h28.312v71.921c0 7.609 2.046 13.664 6.219 18.083 4.173 4.5 9.655 6.709 16.365 6.709 4.173 0 8.183-.982 12.111-3.028 3.927-2.045 7.118-5.072 9.655-9.082 2.537-4.091 3.764-9.164 3.764-15.218Zm65.707-109.395v159.796h-28.23V31.828h28.23Zm44.841 162.169c-7.61 0-14.402-1.391-20.457-4.091-6.055-2.7-10.883-6.791-14.32-12.109-3.518-5.319-5.237-11.946-5.237-19.801 0-6.791 1.228-12.355 3.765-16.773 2.536-4.419 5.891-7.937 10.228-10.637 4.337-2.618 9.164-4.664 14.647-6.055 5.4-1.391 11.046-2.373 16.856-3.027 7.037-.737 12.683-1.391 17.102-1.964 4.337-.573 7.528-1.555 9.574-2.782 1.963-1.309 3.027-3.273 3.027-5.973v-.491c0-5.891-1.718-10.391-5.237-13.664-3.518-3.191-8.51-4.828-15.056-4.828-6.955 0-12.356 1.473-16.447 4.5-4.009 3.028-6.71 6.546-8.183 10.719l-26.348-3.764c2.046-7.282 5.483-13.336 10.31-18.328 4.746-4.909 10.638-8.59 17.511-11.045 6.955-2.455 14.565-3.682 22.912-3.682 5.809 0 11.537.654 17.265 2.045s10.965 3.6 15.711 6.71c4.746 3.109 8.51 7.282 11.455 12.6 2.864 5.318 4.337 11.946 4.337 19.883v80.184h-27.166v-16.446h-.9c-1.719 3.355-4.092 6.464-7.201 9.328-3.109 2.864-6.955 5.237-11.619 6.955-4.828 1.718-10.229 2.536-16.529 2.536Zm7.364-20.701c5.646 0 10.556-1.145 14.729-3.354 4.173-2.291 7.364-5.237 9.655-9.001 2.292-3.763 3.355-7.854 3.355-12.273v-14.155c-.9.737-2.373 1.391-4.5 2.046-2.128.654-4.419 1.145-7.037 1.636-2.619.491-5.155.9-7.692 1.227-2.537.328-4.746.655-6.628.901-4.173.572-8.019 1.472-11.292 2.781-3.355 1.31-5.973 3.11-7.855 5.401-1.964 2.291-2.864 5.318-2.864 8.918 0 5.237 1.882 9.164 5.728 11.782 3.682 2.782 8.51 4.091 14.401 4.091Zm64.643 18.328V71.839h27.412v19.965h1.227c2.21-6.955 5.974-12.274 11.292-16.038 5.319-3.763 11.456-5.645 18.329-5.645 1.555 0 3.355.082 5.237.163 1.964.164 3.601.328 4.91.573v25.938c-1.227-.41-3.109-.819-5.646-1.146a58.814 58.814 0 0 0-7.446-.49c-5.155 0-9.738 1.145-13.829 3.354-4.091 2.209-7.282 5.236-9.655 9.164-2.373 3.927-3.519 8.427-3.519 13.5v70.448h-28.312ZM222.077 39.192l-8.019 125.923L137.387 0l84.69 39.192Zm-53.105 162.825-57.933 33.056-57.934-33.056 11.783-28.556h92.301l11.783 28.556ZM111.039 62.675l30.357 73.803H80.681l30.358-73.803ZM7.937 165.115 0 39.192 84.69 0 7.937 165.115Z"
++          />
++          <path
++            fill="url(#c)"
++            d="M388.676 191.625h30.849L363.31 31.828h-35.758l-56.215 159.797h30.848l13.174-39.356h60.061l13.256 39.356Zm-65.461-62.675 21.602-64.311h1.227l21.602 64.311h-44.431Zm126.831-7.527v70.202h-28.23V71.839h27.002v20.374h1.392c2.782-6.71 7.2-12.028 13.255-15.956 6.056-3.927 13.584-5.89 22.503-5.89 8.264 0 15.465 1.8 21.684 5.318 6.137 3.518 10.964 8.673 14.319 15.382 3.437 6.71 5.074 14.81 4.992 24.383v76.175h-28.23v-71.92c0-8.019-2.046-14.237-6.219-18.819-4.173-4.5-9.819-6.791-17.102-6.791-4.91 0-9.328 1.063-13.174 3.272-3.846 2.128-6.792 5.237-9.001 9.328-2.046 4.009-3.191 8.918-3.191 14.728ZM589.233 239c-10.147 0-18.82-1.391-26.103-4.091-7.282-2.7-13.092-6.382-17.511-10.964-4.418-4.582-7.528-9.655-9.164-15.219l25.448-6.136c1.145 2.372 2.782 4.663 4.991 6.954 2.209 2.291 5.155 4.255 8.837 5.81 3.683 1.554 8.428 2.291 14.074 2.291 8.019 0 14.647-1.964 19.884-5.81 5.237-3.845 7.856-10.227 7.856-19.064v-22.665h-1.391c-1.473 2.946-3.601 5.892-6.383 9.001-2.782 3.109-6.464 5.645-10.965 7.691-4.582 2.046-10.228 3.109-17.101 3.109-9.165 0-17.511-2.209-25.039-6.545-7.446-4.337-13.42-10.883-17.757-19.474-4.418-8.673-6.628-19.473-6.628-32.565 0-13.091 2.21-24.301 6.628-33.383 4.419-9.082 10.311-15.955 17.839-20.7 7.528-4.746 15.874-7.037 25.039-7.037 7.037 0 12.846 1.145 17.347 3.518 4.582 2.373 8.182 5.236 10.883 8.51 2.7 3.272 4.746 6.382 6.137 9.327h1.554v-19.8h27.821v121.749c0 10.228-2.454 18.737-7.364 25.447-4.91 6.709-11.538 11.7-20.048 15.055-8.509 3.355-18.165 4.991-28.884 4.991Zm.245-71.266c5.974 0 11.047-1.473 15.302-4.337 4.173-2.945 7.446-7.118 9.573-12.519 2.21-5.482 3.274-12.027 3.274-19.637 0-7.609-1.064-14.155-3.274-19.8-2.127-5.646-5.318-10.064-9.491-13.255-4.174-3.11-9.329-4.746-15.384-4.746s-11.537 1.636-15.792 4.91c-4.173 3.272-7.365 7.772-9.492 13.418-2.128 5.727-3.191 12.191-3.191 19.392 0 7.2 1.063 13.745 3.273 19.228 2.127 5.482 5.318 9.736 9.573 12.764 4.174 3.027 9.41 4.582 15.629 4.582Zm141.56-26.51V71.839h28.23v119.786h-27.412v-21.273h-1.227c-2.7 6.709-7.119 12.191-13.338 16.446-6.137 4.255-13.747 6.382-22.748 6.382-7.855 0-14.81-1.718-20.783-5.237-5.974-3.518-10.72-8.591-14.075-15.382-3.355-6.709-5.073-14.891-5.073-24.464V71.839h28.312v71.921c0 7.609 2.046 13.664 6.219 18.083 4.173 4.5 9.655 6.709 16.365 6.709 4.173 0 8.183-.982 12.111-3.028 3.927-2.045 7.118-5.072 9.655-9.082 2.537-4.091 3.764-9.164 3.764-15.218Zm65.707-109.395v159.796h-28.23V31.828h28.23Zm44.841 162.169c-7.61 0-14.402-1.391-20.457-4.091-6.055-2.7-10.883-6.791-14.32-12.109-3.518-5.319-5.237-11.946-5.237-19.801 0-6.791 1.228-12.355 3.765-16.773 2.536-4.419 5.891-7.937 10.228-10.637 4.337-2.618 9.164-4.664 14.647-6.055 5.4-1.391 11.046-2.373 16.856-3.027 7.037-.737 12.683-1.391 17.102-1.964 4.337-.573 7.528-1.555 9.574-2.782 1.963-1.309 3.027-3.273 3.027-5.973v-.491c0-5.891-1.718-10.391-5.237-13.664-3.518-3.191-8.51-4.828-15.056-4.828-6.955 0-12.356 1.473-16.447 4.5-4.009 3.028-6.71 6.546-8.183 10.719l-26.348-3.764c2.046-7.282 5.483-13.336 10.31-18.328 4.746-4.909 10.638-8.59 17.511-11.045 6.955-2.455 14.565-3.682 22.912-3.682 5.809 0 11.537.654 17.265 2.045s10.965 3.6 15.711 6.71c4.746 3.109 8.51 7.282 11.455 12.6 2.864 5.318 4.337 11.946 4.337 19.883v80.184h-27.166v-16.446h-.9c-1.719 3.355-4.092 6.464-7.201 9.328-3.109 2.864-6.955 5.237-11.619 6.955-4.828 1.718-10.229 2.536-16.529 2.536Zm7.364-20.701c5.646 0 10.556-1.145 14.729-3.354 4.173-2.291 7.364-5.237 9.655-9.001 2.292-3.763 3.355-7.854 3.355-12.273v-14.155c-.9.737-2.373 1.391-4.5 2.046-2.128.654-4.419 1.145-7.037 1.636-2.619.491-5.155.9-7.692 1.227-2.537.328-4.746.655-6.628.901-4.173.572-8.019 1.472-11.292 2.781-3.355 1.31-5.973 3.11-7.855 5.401-1.964 2.291-2.864 5.318-2.864 8.918 0 5.237 1.882 9.164 5.728 11.782 3.682 2.782 8.51 4.091 14.401 4.091Zm64.643 18.328V71.839h27.412v19.965h1.227c2.21-6.955 5.974-12.274 11.292-16.038 5.319-3.763 11.456-5.645 18.329-5.645 1.555 0 3.355.082 5.237.163 1.964.164 3.601.328 4.91.573v25.938c-1.227-.41-3.109-.819-5.646-1.146a58.814 58.814 0 0 0-7.446-.49c-5.155 0-9.738 1.145-13.829 3.354-4.091 2.209-7.282 5.236-9.655 9.164-2.373 3.927-3.519 8.427-3.519 13.5v70.448h-28.312ZM222.077 39.192l-8.019 125.923L137.387 0l84.69 39.192Zm-53.105 162.825-57.933 33.056-57.934-33.056 11.783-28.556h92.301l11.783 28.556ZM111.039 62.675l30.357 73.803H80.681l30.358-73.803ZM7.937 165.115 0 39.192 84.69 0 7.937 165.115Z"
++          />
++        </g>
++        <defs>
++          <radialGradient
++            id="c"
++            cx="0"
++            cy="0"
++            r="1"
++            gradientTransform="rotate(118.122 171.182 60.81) scale(205.794)"
++            gradientUnits="userSpaceOnUse"
++          >
++            <stop stop-color="#FF41F8" />
++            <stop offset=".707" stop-color="#FF41F8" stop-opacity=".5" />
++            <stop offset="1" stop-color="#FF41F8" stop-opacity="0" />
++          </radialGradient>
++          <linearGradient
++            id="b"
++            x1="0"
++            x2="982"
++            y1="192"
++            y2="192"
++            gradientUnits="userSpaceOnUse"
++          >
++            <stop stop-color="#F0060B" />
++            <stop offset="0" stop-color="#F0070C" />
++            <stop offset=".526" stop-color="#CC26D5" />
++            <stop offset="1" stop-color="#7702FF" />
++          </linearGradient>
++          <clipPath id="a"><path fill="#fff" d="M0 0h982v239H0z" /></clipPath>
++        </defs>
++      </svg>
++      <h1>Hello, {{ title() }}</h1>
++      <p>Congratulations! Your app is running. 🎉</p>
++    </div>
++    <div class="divider" role="separator" aria-label="Divider"></div>
++    <div class="right-side">
++      <div class="pill-group">
++        @for (item of [
++          { title: 'Explore the Docs', link: 'https://angular.dev' },
++          { title: 'Learn with Tutorials', link: 'https://angular.dev/tutorials' },
++          { title: 'Prompt and best practices for AI', link: 'https://angular.dev/ai/develop-with-ai'},
++          { title: 'CLI Docs', link: 'https://angular.dev/tools/cli' },
++          { title: 'Angular Language Service', link: 'https://angular.dev/tools/language-service' },
++          { title: 'Angular DevTools', link: 'https://angular.dev/tools/devtools' },
++        ]; track item.title) {
++          <a
++            class="pill"
++            [href]="item.link"
++            target="_blank"
++            rel="noopener"
++          >
++            <span>{{ item.title }}</span>
++            <svg
++              xmlns="http://www.w3.org/2000/svg"
++              height="14"
++              viewBox="0 -960 960 960"
++              width="14"
++              fill="currentColor"
++            >
++              <path
++                d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"
++              />
++            </svg>
++          </a>
++        }
++      </div>
++      <div class="social-links">
++        <a
++          href="https://github.com/angular/angular"
++          aria-label="Github"
++          target="_blank"
++          rel="noopener"
++        >
++          <svg
++            width="25"
++            height="24"
++            viewBox="0 0 25 24"
++            fill="none"
++            xmlns="http://www.w3.org/2000/svg"
++            alt="Github"
++          >
++            <path
++              d="M12.3047 0C5.50634 0 0 5.50942 0 12.3047C0 17.7423 3.52529 22.3535 8.41332 23.9787C9.02856 24.0946 9.25414 23.7142 9.25414 23.3871C9.25414 23.0949 9.24389 22.3207 9.23876 21.2953C5.81601 22.0377 5.09414 19.6444 5.09414 19.6444C4.53427 18.2243 3.72524 17.8449 3.72524 17.8449C2.61064 17.082 3.81137 17.0973 3.81137 17.0973C5.04697 17.1835 5.69604 18.3647 5.69604 18.3647C6.79321 20.2463 8.57636 19.7029 9.27978 19.3881C9.39052 18.5924 9.70736 18.0499 10.0591 17.7423C7.32641 17.4347 4.45429 16.3765 4.45429 11.6618C4.45429 10.3185 4.9311 9.22133 5.72065 8.36C5.58222 8.04931 5.16694 6.79833 5.82831 5.10337C5.82831 5.10337 6.85883 4.77319 9.2121 6.36459C10.1965 6.09082 11.2424 5.95546 12.2883 5.94931C13.3342 5.95546 14.3801 6.09082 15.3644 6.36459C17.7023 4.77319 18.7328 5.10337 18.7328 5.10337C19.3942 6.79833 18.9789 8.04931 18.8559 8.36C19.6403 9.22133 20.1171 10.3185 20.1171 11.6618C20.1171 16.3888 17.2409 17.4296 14.5031 17.7321C14.9338 18.1012 15.3337 18.8559 15.3337 20.0084C15.3337 21.6552 15.3183 22.978 15.3183 23.3779C15.3183 23.7009 15.5336 24.0854 16.1642 23.9623C21.0871 22.3484 24.6094 17.7341 24.6094 12.3047C24.6094 5.50942 19.0999 0 12.3047 0Z"
++            />
++          </svg>
++        </a>
++        <a
++          href="https://x.com/angular"
++          aria-label="X"
++          target="_blank"
++          rel="noopener"
++        >
++          <svg
++            width="24"
++            height="24"
++            viewBox="0 0 24 24"
++            fill="none"
++            xmlns="http://www.w3.org/2000/svg"
++            alt="X"
++          >
++            <path
++              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
++            />
++          </svg>
++        </a>
++        <a
++          href="https://www.youtube.com/channel/UCbn1OgGei-DV7aSRo_HaAiw"
++          aria-label="Youtube"
++          target="_blank"
++          rel="noopener"
++        >
++          <svg
++            width="29"
++            height="20"
++            viewBox="0 0 29 20"
++            fill="none"
++            xmlns="http://www.w3.org/2000/svg"
++            alt="Youtube"
++          >
++            <path
++              fill-rule="evenodd"
++              clip-rule="evenodd"
++              d="M27.4896 1.52422C27.9301 1.96749 28.2463 2.51866 28.4068 3.12258C29.0004 5.35161 29.0004 10 29.0004 10C29.0004 10 29.0004 14.6484 28.4068 16.8774C28.2463 17.4813 27.9301 18.0325 27.4896 18.4758C27.0492 18.9191 26.5 19.2389 25.8972 19.4032C23.6778 20 14.8068 20 14.8068 20C14.8068 20 5.93586 20 3.71651 19.4032C3.11363 19.2389 2.56449 18.9191 2.12405 18.4758C1.68361 18.0325 1.36732 17.4813 1.20683 16.8774C0.613281 14.6484 0.613281 10 0.613281 10C0.613281 10 0.613281 5.35161 1.20683 3.12258C1.36732 2.51866 1.68361 1.96749 2.12405 1.52422C2.56449 1.08095 3.11363 0.76113 3.71651 0.596774C5.93586 0 14.8068 0 14.8068 0C14.8068 0 23.6778 0 25.8972 0.596774C26.5 0.76113 27.0492 1.08095 27.4896 1.52422ZM19.3229 10L11.9036 5.77905V14.221L19.3229 10Z"
++            />
++          </svg>
++        </a>
++      </div>
++    </div>
++  </div>
++</main>
++
++<!-- * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * -->
++<!-- * * * * * * * * * * * The content above * * * * * * * * * * * * -->
++<!-- * * * * * * * * * * is only a placeholder * * * * * * * * * * * -->
++<!-- * * * * * * * * * * and can be replaced.  * * * * * * * * * * * -->
++<!-- * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * -->
++<!-- * * * * * * * * * * End of Placeholder  * * * * * * * * * * * * -->
++<!-- * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * -->
++
++
++<router-outlet />
+diff --git a/src/app/app.routes.ts b/src/app/app.routes.ts
+new file mode 100644
+index 0000000..dc39edb
+--- /dev/null
++++ b/src/app/app.routes.ts
+@@ -0,0 +1,3 @@
++import { Routes } from '@angular/router';
++
++export const routes: Routes = [];
+diff --git a/src/app/app.scss b/src/app/app.scss
+new file mode 100644
+index 0000000..e69de29
+diff --git a/src/app/app.spec.ts b/src/app/app.spec.ts
+new file mode 100644
+index 0000000..2cf1911
+--- /dev/null
++++ b/src/app/app.spec.ts
+@@ -0,0 +1,24 @@
++import { TestBed } from '@angular/core/testing';
++import { App } from './app';
++
++describe('App', () => {
++  beforeEach(async () => {
++    await TestBed.configureTestingModule({
++      imports: [App],
++    })
++      .compileComponents();
++  });
++
++  it('should create the app', () => {
++    const fixture = TestBed.createComponent(App);
++    const app = fixture.componentInstance;
++    expect(app).toBeTruthy();
++  });
++
++  it('should render title', async () => {
++    const fixture = TestBed.createComponent(App);
++    await fixture.whenStable();
++    const compiled = fixture.nativeElement as HTMLElement;
++    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, emr-docs');
++  });
++});
+diff --git a/src/app/app.ts b/src/app/app.ts
+new file mode 100644
+index 0000000..c71bd3f
+--- /dev/null
++++ b/src/app/app.ts
+@@ -0,0 +1,12 @@
++import { Component, signal } from '@angular/core';
++import { RouterOutlet } from '@angular/router';
++
++@Component({
++  imports: [RouterOutlet],
++  selector: 'app-root',
++  styleUrl: './app.scss',
++  templateUrl: './app.html',
++})
++export class App {
++  protected readonly title = signal('emr-docs');
++}
+diff --git a/src/index.html b/src/index.html
+new file mode 100644
+index 0000000..a325d9a
+--- /dev/null
++++ b/src/index.html
+@@ -0,0 +1,13 @@
++<!doctype html>
++<html lang="en">
++<head>
++  <meta charset="utf-8">
++  <title>EmrDocs</title>
++  <base href="/">
++  <meta name="viewport" content="width=device-width, initial-scale=1">
++  <link rel="icon" type="image/x-icon" href="favicon.ico">
++</head>
++<body>
++  <app-root></app-root>
++</body>
++</html>
+diff --git a/src/main.ts b/src/main.ts
+new file mode 100644
+index 0000000..5df75f9
+--- /dev/null
++++ b/src/main.ts
+@@ -0,0 +1,6 @@
++import { bootstrapApplication } from '@angular/platform-browser';
++import { appConfig } from './app/app.config';
++import { App } from './app/app';
++
++bootstrapApplication(App, appConfig)
++  .catch((err) => console.error(err));
+diff --git a/src/styles.scss b/src/styles.scss
+new file mode 100644
+index 0000000..90d4ee0
+--- /dev/null
++++ b/src/styles.scss
+@@ -0,0 +1 @@
++/* You can add global styles to this file, and also import other style files */
+diff --git a/tsconfig.app.json b/tsconfig.app.json
+new file mode 100644
+index 0000000..cb151e1
+--- /dev/null
++++ b/tsconfig.app.json
+@@ -0,0 +1,14 @@
++/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
++/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
++{
++  "extends": "./tsconfig.json",
++  "compilerOptions": {
++    "types": []
++  },
++  "include": [
++    "src/**/*.ts"
++  ],
++  "exclude": [
++    "src/**/*.spec.ts"
++  ]
++}
+diff --git a/tsconfig.json b/tsconfig.json
+new file mode 100644
+index 0000000..d2fbb9c
+--- /dev/null
++++ b/tsconfig.json
+@@ -0,0 +1,31 @@
++/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
++/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
++{
++  "compileOnSave": false,
++  "compilerOptions": {
++    "noImplicitOverride": true,
++    "noPropertyAccessFromIndexSignature": true,
++    "noImplicitReturns": true,
++    "noFallthroughCasesInSwitch": true,
++    "skipLibCheck": true,
++    "isolatedModules": true,
++    "experimentalDecorators": true,
++    "importHelpers": true,
++    "target": "ES2022",
++    "module": "preserve"
++  },
++  "angularCompilerOptions": {
++    "enableI18nLegacyMessageIdFormat": false,
++    "strictInjectionParameters": true,
++    "strictInputAccessModifiers": true
++  },
++  "files": [],
++  "references": [
++    {
++      "path": "./tsconfig.app.json"
++    },
++    {
++      "path": "./tsconfig.spec.json"
++    }
++  ]
++}
+diff --git a/tsconfig.spec.json b/tsconfig.spec.json
+new file mode 100644
+index 0000000..9c8efb9
+--- /dev/null
++++ b/tsconfig.spec.json
+@@ -0,0 +1,14 @@
++/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
++/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
++{
++  "extends": "./tsconfig.json",
++  "compilerOptions": {
++    "types": [
++      "vitest/globals"
++    ]
++  },
++  "include": [
++    "src/**/*.d.ts",
++    "src/**/*.spec.ts"
++  ]
++}
+diff --git a/vercel.json b/vercel.json
+new file mode 100644
+index 0000000..71abdcc
+--- /dev/null
++++ b/vercel.json
+@@ -0,0 +1,46 @@
++{
++  "buildCommand": "npm run build",
++  "outputDirectory": "dist/emr-docs/browser",
++  "headers": [
++    {
++      "source": "/(.*)",
++      "headers": [
++        {
++          "key": "Cache-Control",
++          "value": "public, max-age=3600, s-maxage=3600"
++        }
++      ]
++    },
++    {
++      "source": "/index.html",
++      "headers": [
++        {
++          "key": "Cache-Control",
++          "value": "public, max-age=0, s-maxage=3600, must-revalidate"
++        }
++      ]
++    },
++    {
++      "source": "/s[0-9].html",
++      "headers": [
++        {
++          "key": "Cache-Control",
++          "value": "public, max-age=0, s-maxage=3600, must-revalidate"
++        }
++      ]
++    },
++    {
++      "source": "/assets/(.*)",
++      "headers": [
++        {
++          "key": "Cache-Control",
++          "value": "public, max-age=31536000, immutable"
++        }
++      ]
++    }
++  ],
++  "env": {
++    "APP_TITLE": "EMR Documentation",
++    "APP_VERSION": "1.0.0"
++  }
++}
diff --git a/angular.json b/angular.json
index 7294e7a..087ac64 100644
--- a/angular.json
+++ b/angular.json
@@ -22,23 +22,29 @@
           "options": {
             "browser": "src/main.ts",
             "tsConfig": "tsconfig.app.json",
             "inlineStyleLanguage": "scss",
             "assets": [
               {
                 "glob": "**/*",
                 "input": "public"
               }
             ],
-            "styles": [
-              "src/styles.scss"
-            ]
+            "styles": ["src/styles.scss"],
+            "server": "src/main.server.ts",
+            "outputMode": "server",
+            "security": {
+              "allowedHosts": []
+            },
+            "ssr": {
+              "entry": "src/server.ts"
+            }
           },
           "configurations": {
             "production": {
               "budgets": [
                 {
                   "type": "initial",
                   "maximumWarning": "500kB",
                   "maximumError": "1MB"
                 },
                 {
diff --git a/package.json b/package.json
index 4d4a913..11697fd 100644
--- a/package.json
+++ b/package.json
@@ -1,33 +1,39 @@
 {
   "name": "emr-docs",
   "version": "0.0.0",
   "scripts": {
     "ng": "ng",
     "start": "ng serve",
     "build": "ng build",
     "watch": "ng build --watch --configuration development",
-    "test": "ng test"
+    "test": "ng test",
+    "serve:ssr:emr-docs": "node dist/emr-docs/server/server.mjs"
   },
   "private": true,
   "packageManager": "npm@11.12.1",
   "dependencies": {
     "@angular/common": "^22.1.0",
     "@angular/compiler": "^22.1.0",
     "@angular/core": "^22.1.0",
     "@angular/forms": "^22.1.0",
     "@angular/platform-browser": "^22.1.0",
+    "@angular/platform-server": "^22.1.0",
     "@angular/router": "^22.1.0",
+    "@angular/ssr": "^22.1.7",
+    "express": "^5.1.0",
     "lunr": "^2.3.9",
     "rxjs": "~7.8.0",
     "tslib": "^2.3.0"
   },
   "devDependencies": {
     "@angular/build": "^22.1.7",
     "@angular/cli": "^22.1.7",
     "@angular/compiler-cli": "^22.1.0",
+    "@types/express": "^5.0.1",
+    "@types/node": "^20.17.19",
     "jsdom": "^28.0.0",
     "prettier": "^3.8.1",
     "typescript": "~6.0.2",
     "vitest": "^4.0.8"
   }
-}
\ No newline at end of file
+}
diff --git a/src/app/app.config.server.ts b/src/app/app.config.server.ts
new file mode 100644
index 0000000..f3d660a
--- /dev/null
+++ b/src/app/app.config.server.ts
@@ -0,0 +1,10 @@
+import { mergeApplicationConfig, ApplicationConfig } from "@angular/core";
+import { provideServerRendering, withRoutes } from "@angular/ssr";
+import { appConfig } from "./app.config";
+import { serverRoutes } from "./app.routes.server";
+
+const serverConfig: ApplicationConfig = {
+  providers: [provideServerRendering(withRoutes(serverRoutes))],
+};
+
+export const config = mergeApplicationConfig(appConfig, serverConfig);
diff --git a/src/app/app.config.ts b/src/app/app.config.ts
index e60fc79..986d385 100644
--- a/src/app/app.config.ts
+++ b/src/app/app.config.ts
@@ -1,10 +1,15 @@
-import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
-import { provideRouter } from '@angular/router';
-import { routes } from './app.routes';
+import {
+  ApplicationConfig,
+  provideBrowserGlobalErrorListeners,
+} from "@angular/core";
+import { provideRouter } from "@angular/router";
+import { routes } from "./app.routes";
+import { provideClientHydration } from "@angular/platform-browser";
 
 export const appConfig: ApplicationConfig = {
   providers: [
     provideBrowserGlobalErrorListeners(),
-    provideRouter(routes)
-  ]
+    provideRouter(routes),
+    provideClientHydration(),
+  ],
 };
diff --git a/src/app/app.routes.server.ts b/src/app/app.routes.server.ts
new file mode 100644
index 0000000..5ea028a
--- /dev/null
+++ b/src/app/app.routes.server.ts
@@ -0,0 +1,44 @@
+import { RenderMode, ServerRoute } from "@angular/ssr";
+
+export const serverRoutes: ServerRoute[] = [
+  {
+    path: "",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s1",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s2",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s3",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s4",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s5",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s6",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s7",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s8",
+    renderMode: RenderMode.Prerender,
+  },
+  {
+    path: "s9",
+    renderMode: RenderMode.Prerender,
+  },
+];
diff --git a/src/app/app.routes.ts b/src/app/app.routes.ts
index dc39edb..f84aa80 100644
--- a/src/app/app.routes.ts
+++ b/src/app/app.routes.ts
@@ -1,3 +1,35 @@
 import { Routes } from '@angular/router';
 
-export const routes: Routes = [];
+export const routes: Routes = [
+  {
+    path: '',
+    pathMatch: 'full',
+  },
+  {
+    path: 's1',
+  },
+  {
+    path: 's2',
+  },
+  {
+    path: 's3',
+  },
+  {
+    path: 's4',
+  },
+  {
+    path: 's5',
+  },
+  {
+    path: 's6',
+  },
+  {
+    path: 's7',
+  },
+  {
+    path: 's8',
+  },
+  {
+    path: 's9',
+  },
+];
diff --git a/src/main.server.ts b/src/main.server.ts
new file mode 100644
index 0000000..dc7d92c
--- /dev/null
+++ b/src/main.server.ts
@@ -0,0 +1,11 @@
+import {
+  BootstrapContext,
+  bootstrapApplication,
+} from "@angular/platform-browser";
+import { App } from "./app/app";
+import { config } from "./app/app.config.server";
+
+const bootstrap = (context: BootstrapContext) =>
+  bootstrapApplication(App, config, context);
+
+export default bootstrap;
diff --git a/src/server.ts b/src/server.ts
new file mode 100644
index 0000000..9ca10a0
--- /dev/null
+++ b/src/server.ts
@@ -0,0 +1,68 @@
+import {
+  AngularNodeAppEngine,
+  createNodeRequestHandler,
+  isMainModule,
+  writeResponseToNodeResponse,
+} from "@angular/ssr/node";
+import express from "express";
+import { join } from "node:path";
+
+const browserDistFolder = join(import.meta.dirname, "../browser");
+
+const app = express();
+const angularApp = new AngularNodeAppEngine();
+
+/**
+ * Example Express Rest API endpoints can be defined here.
+ * Uncomment and define endpoints as necessary.
+ *
+ * Example:
+ * ```ts
+ * app.get('/api/{*splat}', (req, res) => {
+ *   // Handle API request
+ * });
+ * ```
+ */
+
+/**
+ * Serve static files from /browser
+ */
+app.use(
+  express.static(browserDistFolder, {
+    maxAge: "1y",
+    index: false,
+    redirect: false,
+  }),
+);
+
+/**
+ * Handle all other requests by rendering the Angular application.
+ */
+app.use((req, res, next) => {
+  angularApp
+    .handle(req)
+    .then((response) =>
+      response ? writeResponseToNodeResponse(response, res) : next(),
+    )
+    .catch(next);
+});
+
+/**
+ * Start the server if this module is the main entry point, or it is ran via PM2.
+ * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
+ */
+if (isMainModule(import.meta.url) || process.env["pm_id"]) {
+  const port = process.env["PORT"] || 4000;
+  app.listen(port, (error) => {
+    if (error) {
+      throw error;
+    }
+
+    console.log(`Node Express server listening on http://localhost:${port}`);
+  });
+}
+
+/**
+ * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
+ */
+export const reqHandler = createNodeRequestHandler(app);
diff --git a/tsconfig.app.json b/tsconfig.app.json
index cb151e1..423fed0 100644
--- a/tsconfig.app.json
+++ b/tsconfig.app.json
@@ -1,14 +1,10 @@
 /* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
 /* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
 {
   "extends": "./tsconfig.json",
   "compilerOptions": {
-    "types": []
+    "types": ["node"]
   },
-  "include": [
-    "src/**/*.ts"
-  ],
-  "exclude": [
-    "src/**/*.spec.ts"
-  ]
+  "include": ["src/**/*.ts"],
+  "exclude": ["src/**/*.spec.ts"]
 }
