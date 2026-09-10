# Task 2: Global SCSS Styling & Dark/Light Theme System

## Summary

Successfully implemented a comprehensive theming system for the EMR Angular documentation app using CSS custom properties with light/dark mode support.

## Changes Made

### 1. Created `src/styles/_variables.scss`
- Defined CSS custom properties for light mode (`:root` defaults)
- Implemented dark mode via two mechanisms:
  - `@media (prefers-color-scheme: dark)` with `:root:not([data-theme='light'])` selector
  - `[data-theme='dark']` attribute selector for forced dark mode
  - `[data-theme='light']` attribute selector for forced light mode
- Organized variables into logical sections:
  - **Colors**: paper, panel, ink (3 shades), rule (2 shades), semantic colors (teal, indigo, clay, amber with soft and line variants)
  - **Typography**: font families (sans, serif, mono) from IBM Plex family
  - **Spacing**: xs through xl scale (4px to 32px)
  - **Layout**: sidebar-width (238px), header-height (64px)

### 2. Created `src/styles/global.scss`
- Imported variables using `@use 'variables' as *`
- Implemented base styles:
  - **Reset**: `* { box-sizing: border-box }`
  - **HTML**: `scroll-behavior: smooth`
  - **Body**: background (var(--paper)), color (var(--ink)), font-family (var(--font-serif)), 16px base font-size, 1.7 line-height, antialiasing, smooth 0.2s transitions for background-color and color
  - **Links**: teal color, no underline by default, underline on hover
  - **Code**: monospace font (var(--font-mono)), teal-soft background, teal text, light padding, small border-radius
  - **Pre/Code blocks**: additional styling for code block containers
  - **Headings** (h1-h6): sans-serif font, 600 weight, proper sizing scale (2.5em down to 1em), managed margins
  - **Tables**: border-collapse, 100% width, sans-serif font, 13.5px size, proper padding (9px 14px 9px 0), border-bottom rules, bold headers with ink3 color, bold first column
  - **Additional elements**: paragraphs, lists, blockquotes, horizontal rules with proper styling
  - **Selection**: styled with teal-soft background and teal text

### 3. Updated `src/styles.scss`
- Replaced comment with `@forward 'styles/global';`
- Used `@forward` instead of `@use` to ensure global styles apply without namespace prefixes
- This ensures `body {}` and other top-level selectors from global.scss apply globally

### 4. Updated `src/index.html`
- Added meta tags:
  - `<meta name="theme-color" content="#ffffff">` for browser UI color
  - `<meta name="color-scheme" content="light dark">` to indicate support for both themes
- Added Google Fonts preconnect and stylesheet link:
  - Preconnect to fonts.googleapis.com and fonts.gstatic.com
  - IBM Plex Sans (weights 400, 500, 600)
  - IBM Plex Serif (weights 400, 500)
  - IBM Plex Mono (weights 400, 500)
- Added inline theme detection script in `<head>` (runs before first paint):
  - Reads `localStorage.getItem('theme')` for stored preference
  - Falls back to `window.matchMedia('(prefers-color-scheme: dark)').matches`
  - Sets `data-theme='dark'` attribute if dark mode should be active
  - Prevents white flash on dark mode systems

## Build Verification

### Build Status
```
✔ Building...
Browser bundles     
Initial chunk files  | Names            |  Raw size | Estimated transfer size
main-P7Z2ATXQ.js     | main             | 256.17 kB |                71.50 kB
styles-3P47RGWP.css  | styles           |   3.57 kB |               990 bytes

Prerendered 10 static routes.
Application bundle generation complete. [2.378 seconds]

Output location: /Users/yukopangestu/yukopangestu/emr-infra/dist/emr-docs
```

### CSS Variables Verification
Compiled CSS file: `dist/emr-docs/browser/styles-3P47RGWP.css`

Confirmed CSS variables in compiled output:
- `--paper: #f5f7f6` (light mode default)
- `--teal: #0f6e56` (light mode default)
- Dark mode variables via `@media` query
- `[data-theme=dark]` selector with all dark values
- `[data-theme=light]` selector with all light values

### Global Styles Verification
Confirmed in compiled CSS:
- `*{box-sizing:border-box}` ✓
- `html{scroll-behavior:smooth}` ✓
- `body{background:var(--paper);color:var(--ink);font-family:var(--font-serif);...}` ✓
- `table{border-collapse:collapse;width:100%;font-family:var(--font-sans);...}` ✓
- `table th{font-weight:600;color:var(--ink3);...}` ✓
- All heading styles (h1-h6) present with proper sizing and weights ✓

## File Structure

```
src/
├── styles/
│   ├── _variables.scss      (Light/dark CSS custom properties)
│   └── global.scss          (Base styles using variables)
├── styles.scss              (@forward global)
└── index.html               (Meta tags + theme script)
```

## Git Commit Hash

(To be provided after commit)

## Testing Notes

- No theme-toggling service created yet (separate task)
- Theme detection script runs before first paint to prevent flash
- CSS variables properly cascade for light/dark modes
- Build succeeds without warnings
- All 10 routes prerendered successfully
- Compiled CSS contains all variables and base styles
