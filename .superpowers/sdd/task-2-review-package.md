# Review Package: Task 2 — Global Styling & Theme System

BASE: cbe7397
HEAD: f83a5e45838dd18ea5a18b3049fdff8b9ea54766

## Commits
f83a5e4 feat: Add global SCSS theming system with light/dark mode support

## Diff stat
 .superpowers/sdd/task-2-report.md | 112 ++++++++++++++++++++++++
 src/index.html                    |  20 +++++
 src/styles.scss                   |   2 +-
 src/styles/_variables.scss        | 113 ++++++++++++++++++++++++
 src/styles/global.scss            | 178 ++++++++++++++++++++++++++++++++++++++
 5 files changed, 424 insertions(+), 1 deletion(-)

## Full diff
diff --git a/.superpowers/sdd/task-2-report.md b/.superpowers/sdd/task-2-report.md
new file mode 100644
index 0000000..bb8c765
--- /dev/null
+++ b/.superpowers/sdd/task-2-report.md
@@ -0,0 +1,112 @@
+# Task 2: Global SCSS Styling & Dark/Light Theme System
+
+## Summary
+
+Successfully implemented a comprehensive theming system for the EMR Angular documentation app using CSS custom properties with light/dark mode support.
+
+## Changes Made
+
+### 1. Created `src/styles/_variables.scss`
+- Defined CSS custom properties for light mode (`:root` defaults)
+- Implemented dark mode via two mechanisms:
+  - `@media (prefers-color-scheme: dark)` with `:root:not([data-theme='light'])` selector
+  - `[data-theme='dark']` attribute selector for forced dark mode
+  - `[data-theme='light']` attribute selector for forced light mode
+- Organized variables into logical sections:
+  - **Colors**: paper, panel, ink (3 shades), rule (2 shades), semantic colors (teal, indigo, clay, amber with soft and line variants)
+  - **Typography**: font families (sans, serif, mono) from IBM Plex family
+  - **Spacing**: xs through xl scale (4px to 32px)
+  - **Layout**: sidebar-width (238px), header-height (64px)
+
+### 2. Created `src/styles/global.scss`
+- Imported variables using `@use 'variables' as *`
+- Implemented base styles:
+  - **Reset**: `* { box-sizing: border-box }`
+  - **HTML**: `scroll-behavior: smooth`
+  - **Body**: background (var(--paper)), color (var(--ink)), font-family (var(--font-serif)), 16px base font-size, 1.7 line-height, antialiasing, smooth 0.2s transitions for background-color and color
+  - **Links**: teal color, no underline by default, underline on hover
+  - **Code**: monospace font (var(--font-mono)), teal-soft background, teal text, light padding, small border-radius
+  - **Pre/Code blocks**: additional styling for code block containers
+  - **Headings** (h1-h6): sans-serif font, 600 weight, proper sizing scale (2.5em down to 1em), managed margins
+  - **Tables**: border-collapse, 100% width, sans-serif font, 13.5px size, proper padding (9px 14px 9px 0), border-bottom rules, bold headers with ink3 color, bold first column
+  - **Additional elements**: paragraphs, lists, blockquotes, horizontal rules with proper styling
+  - **Selection**: styled with teal-soft background and teal text
+
+### 3. Updated `src/styles.scss`
+- Replaced comment with `@forward 'styles/global';`
+- Used `@forward` instead of `@use` to ensure global styles apply without namespace prefixes
+- This ensures `body {}` and other top-level selectors from global.scss apply globally
+
+### 4. Updated `src/index.html`
+- Added meta tags:
+  - `<meta name="theme-color" content="#ffffff">` for browser UI color
+  - `<meta name="color-scheme" content="light dark">` to indicate support for both themes
+- Added Google Fonts preconnect and stylesheet link:
+  - Preconnect to fonts.googleapis.com and fonts.gstatic.com
+  - IBM Plex Sans (weights 400, 500, 600)
+  - IBM Plex Serif (weights 400, 500)
+  - IBM Plex Mono (weights 400, 500)
+- Added inline theme detection script in `<head>` (runs before first paint):
+  - Reads `localStorage.getItem('theme')` for stored preference
+  - Falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches`
+  - Sets `data-theme='dark'` attribute if dark mode should be active
+  - Prevents white flash on dark mode systems
+
+## Build Verification
+
+### Build Status
+```
+✔ Building...
+Browser bundles     
+Initial chunk files  | Names            |  Raw size | Estimated transfer size
+main-P7Z2ATXQ.js     | main             | 256.17 kB |                71.50 kB
+styles-3P47RGWP.css  | styles           |   3.57 kB |               990 bytes
+
+Prerendered 10 static routes.
+Application bundle generation complete. [2.378 seconds]
+
+Output location: /Users/yukopangestu/yukopangestu/emr-infra/dist/emr-docs
+```
+
+### CSS Variables Verification
+Compiled CSS file: `dist/emr-docs/browser/styles-3P47RGWP.css`
+
+Confirmed CSS variables in compiled output:
+- `--paper: #f5f7f6` (light mode default)
+- `--teal: #0f6e56` (light mode default)
+- Dark mode variables via `@media` query
+- `[data-theme=dark]` selector with all dark values
+- `[data-theme=light]` selector with all light values
+
+### Global Styles Verification
+Confirmed in compiled CSS:
+- `*{box-sizing:border-box}` ✓
+- `html{scroll-behavior:smooth}` ✓
+- `body{background:var(--paper);color:var(--ink);font-family:var(--font-serif);...}` ✓
+- `table{border-collapse:collapse;width:100%;font-family:var(--font-sans);...}` ✓
+- `table th{font-weight:600;color:var(--ink3);...}` ✓
+- All heading styles (h1-h6) present with proper sizing and weights ✓
+
+## File Structure
+
+```
+src/
+├── styles/
+│   ├── _variables.scss      (Light/dark CSS custom properties)
+│   └── global.scss          (Base styles using variables)
+├── styles.scss              (@forward global)
+└── index.html               (Meta tags + theme script)
+```
+
+## Git Commit Hash
+
+(To be provided after commit)
+
+## Testing Notes
+
+- No theme-toggling service created yet (separate task)
+- Theme detection script runs before first paint to prevent flash
+- CSS variables properly cascade for light/dark modes
+- Build succeeds without warnings
+- All 10 routes prerendered successfully
+- Compiled CSS contains all variables and base styles
diff --git a/src/index.html b/src/index.html
index a325d9a..6a43f42 100644
--- a/src/index.html
+++ b/src/index.html
@@ -1,13 +1,33 @@
 <!doctype html>
 <html lang="en">
 <head>
   <meta charset="utf-8">
   <title>EmrDocs</title>
   <base href="/">
   <meta name="viewport" content="width=device-width, initial-scale=1">
+  <meta name="theme-color" content="#ffffff">
+  <meta name="color-scheme" content="light dark">
   <link rel="icon" type="image/x-icon" href="favicon.ico">
+
+  <!-- Google Fonts: IBM Plex Sans, Serif, Mono -->
+  <link rel="preconnect" href="https://fonts.googleapis.com">
+  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
+  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@400;500&display=swap" rel="stylesheet">
+
+  <!-- Theme Detection Script (runs before first paint) -->
+  <script>
+    (function() {
+      const stored = localStorage.getItem('theme');
+      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
+      const theme = stored || (prefersDark ? 'dark' : 'light');
+
+      if (theme === 'dark') {
+        document.documentElement.setAttribute('data-theme', 'dark');
+      }
+    })();
+  </script>
 </head>
 <body>
   <app-root></app-root>
 </body>
 </html>
diff --git a/src/styles.scss b/src/styles.scss
index 90d4ee0..223712a 100644
--- a/src/styles.scss
+++ b/src/styles.scss
@@ -1 +1 @@
-/* You can add global styles to this file, and also import other style files */
+@forward 'styles/global';
diff --git a/src/styles/_variables.scss b/src/styles/_variables.scss
new file mode 100644
index 0000000..9cc5744
--- /dev/null
+++ b/src/styles/_variables.scss
@@ -0,0 +1,113 @@
+// CSS Custom Properties for Light/Dark Theme System
+
+:root {
+  // Colors - Light Mode (defaults)
+  --paper: #f5f7f6;
+  --panel: #ffffff;
+  --ink: #16211e;
+  --ink2: #4a5a55;
+  --ink3: #7c8a85;
+  --rule: #d9e0dd;
+  --rule2: #c3ceca;
+
+  // Semantic Colors
+  --teal: #0f6e56;
+  --teal-soft: #e1efe9;
+  --teal-line: #8fc4b2;
+  --indigo: #3b4e8c;
+  --indigo-soft: #e7eaf4;
+  --indigo-line: #a9b6dc;
+  --clay: #9e4a34;
+  --clay-soft: #f5e7e2;
+  --clay-line: #dcae9e;
+  --amber: #8a6108;
+  --amber-soft: #f7eeda;
+  --amber-line: #d9be84;
+
+  // Typography
+  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
+  --font-serif: 'IBM Plex Serif', Georgia, serif;
+  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
+
+  // Spacing
+  --spacing-xs: 4px;
+  --spacing-sm: 8px;
+  --spacing-md: 16px;
+  --spacing-lg: 24px;
+  --spacing-xl: 32px;
+
+  // Layout
+  --sidebar-width: 238px;
+  --header-height: 64px;
+}
+
+// Dark Mode - System Preference
+@media (prefers-color-scheme: dark) {
+  :root:not([data-theme='light']) {
+    --paper: #101614;
+    --panel: #18211e;
+    --ink: #e6ece9;
+    --ink2: #a8b6b1;
+    --ink3: #7a8884;
+    --rule: #2a3733;
+    --rule2: #3a4a45;
+    --teal: #5dcaa5;
+    --teal-soft: #14352c;
+    --teal-line: #2f6b58;
+    --indigo: #8fa3de;
+    --indigo-soft: #1b2340;
+    --indigo-line: #3e4c7e;
+    --clay: #d98a72;
+    --clay-soft: #33201a;
+    --clay-line: #6e4335;
+    --amber: #d9b36a;
+    --amber-soft: #2e2617;
+    --amber-line: #6b5a32;
+  }
+}
+
+// Dark Mode - Forced via data-theme attribute
+[data-theme='dark'] {
+  --paper: #101614;
+  --panel: #18211e;
+  --ink: #e6ece9;
+  --ink2: #a8b6b1;
+  --ink3: #7a8884;
+  --rule: #2a3733;
+  --rule2: #3a4a45;
+  --teal: #5dcaa5;
+  --teal-soft: #14352c;
+  --teal-line: #2f6b58;
+  --indigo: #8fa3de;
+  --indigo-soft: #1b2340;
+  --indigo-line: #3e4c7e;
+  --clay: #d98a72;
+  --clay-soft: #33201a;
+  --clay-line: #6e4335;
+  --amber: #d9b36a;
+  --amber-soft: #2e2617;
+  --amber-line: #6b5a32;
+}
+
+// Light Mode - Force via data-theme attribute
+[data-theme='light'] {
+  --paper: #f5f7f6;
+  --panel: #ffffff;
+  --ink: #16211e;
+  --ink2: #4a5a55;
+  --ink3: #7c8a85;
+  --rule: #d9e0dd;
+  --rule2: #c3ceca;
+  --teal: #0f6e56;
+  --teal-soft: #e1efe9;
+  --teal-line: #8fc4b2;
+  --indigo: #3b4e8c;
+  --indigo-soft: #e7eaf4;
+  --indigo-line: #a9b6dc;
+  --clay: #9e4a34;
+  --clay-soft: #f5e7e2;
+  --clay-line: #dcae9e;
+  --amber: #8a6108;
+  --amber-soft: #f7eeda;
+  --amber-line: #d9be84;
+}
diff --git a/src/styles/global.scss b/src/styles/global.scss
new file mode 100644
index 0000000..1402f92
--- /dev/null
+++ b/src/styles/global.scss
@@ -0,0 +1,178 @@
+@use 'variables' as *;
+
+// Reset and base styles
+* {
+  box-sizing: border-box;
+}
+
+html {
+  scroll-behavior: smooth;
+}
+
+body {
+  background: var(--paper);
+  color: var(--ink);
+  font-family: var(--font-serif);
+  font-size: 16px;
+  line-height: 1.7;
+  -webkit-font-smoothing: antialiased;
+  -moz-osx-font-smoothing: grayscale;
+  transition: background-color 0.2s ease, color 0.2s ease;
+  margin: 0;
+  padding: 0;
+}
+
+// Links
+a {
+  color: var(--teal);
+  text-decoration: none;
+  transition: color 0.2s ease;
+
+  &:hover {
+    text-decoration: underline;
+  }
+}
+
+// Code blocks and inline code
+code {
+  font-family: var(--font-mono);
+  background: var(--teal-soft);
+  color: var(--teal);
+  padding: 1px 5px;
+  border-radius: 3px;
+  font-size: 0.95em;
+}
+
+pre {
+  code {
+    padding: 12px 16px;
+    display: block;
+    overflow-x: auto;
+    background: var(--panel);
+    border: 1px solid var(--rule);
+    border-radius: 4px;
+  }
+}
+
+// Headings
+h1,
+h2,
+h3,
+h4,
+h5,
+h6 {
+  font-family: var(--font-sans);
+  font-weight: 600;
+  line-height: 1.3;
+  margin-top: 1.5em;
+  margin-bottom: 0.75em;
+
+  &:first-child {
+    margin-top: 0;
+  }
+}
+
+h1 {
+  font-size: 2.5em;
+}
+
+h2 {
+  font-size: 2em;
+}
+
+h3 {
+  font-size: 1.5em;
+}
+
+h4 {
+  font-size: 1.25em;
+}
+
+h5 {
+  font-size: 1.1em;
+}
+
+h6 {
+  font-size: 1em;
+}
+
+// Tables
+table {
+  border-collapse: collapse;
+  width: 100%;
+  font-family: var(--font-sans);
+  font-size: 13.5px;
+  margin: 1em 0;
+
+  th {
+    font-weight: 600;
+    color: var(--ink3);
+    text-align: left;
+  }
+
+  th,
+  td {
+    padding: 9px 14px 9px 0;
+    border-bottom: 1px solid var(--rule);
+  }
+
+  tbody tr:last-child td {
+    border-bottom: none;
+  }
+
+  td:first-child {
+    font-weight: 500;
+  }
+}
+
+// Paragraphs and text blocks
+p {
+  margin-top: 1em;
+  margin-bottom: 1em;
+
+  &:first-child {
+    margin-top: 0;
+  }
+
+  &:last-child {
+    margin-bottom: 0;
+  }
+}
+
+// Lists
+ul,
+ol {
+  margin: 1em 0;
+  padding-left: 2em;
+}
+
+li {
+  margin: 0.5em 0;
+}
+
+// Blockquotes
+blockquote {
+  margin: 1em 0;
+  padding-left: 1em;
+  border-left: 4px solid var(--teal);
+  color: var(--ink2);
+  font-style: italic;
+}
+
+// Horizontal rule
+hr {
+  border: none;
+  border-top: 1px solid var(--rule);
+  margin: 2em 0;
+}
+
+// Selection
+::selection {
+  background: var(--teal-soft);
+  color: var(--teal);
+}
+
+::-moz-selection {
+  background: var(--teal-soft);
+  color: var(--teal);
+}
