# EMR Architecture Documentation — Angular App Design Spec

**Date:** 2026-09-10  
**Project:** EMR Multitenant Platform Architecture Documentation Site  
**Target:** Lightweight Angular SPA with Static Pre-rendering, deployed on Vercel

---

## Executive Summary

Convert the existing EMR architecture HTML document into a modern, responsive Angular application optimized for Vercel deployment. The app will be a static documentation site with dark mode, full-text search, responsive navigation, analytics integration, and SEO optimization.

**Key Decisions:**
- **Approach:** Lightweight Angular SPA with static pre-rendering
- **Deployment:** Vercel (zero-cost static hosting)
- **Performance Target:** Lighthouse 95+
- **Mobile-First:** Responsive design with hamburger navigation
- **Analytics:** Vercel Analytics (deployment-agnostic, works with Vercel out of box)

---

## Architecture Overview

### Technology Stack
- **Framework:** Angular 17+ (latest LTS)
- **Build:** Angular CLI with `@angular/prerender`
- **Styling:** SCSS + CSS Variables (light/dark theme)
- **Search:** Client-side full-text search (Lunr.js or native)
- **Analytics:** Vercel Analytics + Google Analytics (optional)
- **Deployment:** Vercel (git-connected, auto-deploy on push)

### Project Structure
```
emr-infra/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── search.service.ts (full-text search)
│   │   │   │   ├── theme.service.ts (dark/light mode)
│   │   │   │   ├── analytics.service.ts (GA + Vercel)
│   │   │   │   └── content.service.ts (loads architecture data)
│   │   │   └── interceptors/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── sidebar-nav/
│   │   │   │   ├── section-card/
│   │   │   │   ├── diagram-box/
│   │   │   │   ├── table-component/
│   │   │   │   ├── callout/
│   │   │   │   └── search-modal/
│   │   │   └── pipes/
│   │   ├── features/
│   │   │   └── architecture/
│   │   │       ├── pages/
│   │   │       │   ├── architecture-overview.component.ts
│   │   │       │   ├── section.component.ts (dynamic section renderer)
│   │   │       │   └── not-found.component.ts
│   │   │       └── architecture.module.ts
│   │   ├── app.component.ts (root layout)
│   │   └── app.module.ts
│   ├── assets/
│   │   ├── diagrams/ (SVG files from original HTML)
│   │   ├── data/ (architecture.data.ts with structured content)
│   │   └── styles/
│   │       ├── _variables.scss (colors, spacing, fonts)
│   │       ├── _theme.scss (dark/light mode)
│   │       └── global.scss
│   ├── index.html (with SEO meta tags)
│   └── main.ts
├── docs/
│   └── DESIGN.md (this file)
├── angular.json (with prerender config for all routes)
├── vercel.json (Vercel deployment config)
├── environment.ts (API keys, analytics config)
└── package.json
```

---

## Content Management

### Data Structure
All content lives in `src/assets/data/architecture.data.ts` as a structured TypeScript object:

```typescript
export const architectureData = {
  title: "Arsitektur produksi platform EMR multitenant",
  lede: "...",
  metadata: { region, dr, isolation, estimasi },
  sections: [
    {
      id: "s1",
      number: 1,
      title: "Master architecture diagram",
      content: "...",
      diagram: { file: "master-diagram.svg", caption: "..." },
      callouts: [{ type: "info", content: "..." }]
    },
    // ... 9 sections total
  ]
};
```

**Benefits:**
- Single source of truth for all content
- Automatically indexed for search
- Decoupled from component logic
- Easy to maintain and update

### SVG Diagrams
- Extract all SVG diagrams from original HTML
- Store in `src/assets/diagrams/` as individual files
- Reference by filename in data structure
- Preserve original styling + CSS variables for theme support

---

## Component Architecture

### Core Components

#### `AppComponent` (Root)
- Layout shell with header, sidebar, main content area
- Listens to route changes
- Manages theme context (passes dark/light mode to children)

#### `HeaderComponent`
- Logo/title
- Search input (opens SearchModalComponent)
- Dark mode toggle
- Mobile hamburger menu button

#### `SidebarNavComponent`
- Table of contents (sections list)
- Active section highlighting
- Scroll-to-section navigation
- Collapses to hamburger on mobile

#### `SectionComponent`
- Dynamic renderer for each section
- Handles diagrams, tables, callouts, text
- Passes data from route to child components

#### `DiagramBoxComponent`
- Wraps SVG + caption
- Responsive sizing
- Accessible alt text

#### `TableComponent`
- Reusable table renderer
- Accessible headers
- Responsive overflow on mobile

#### `CalloutComponent`
- Info/warning/note boxes
- Styled by type (icon + color)

#### `SearchModalComponent`
- Full-screen or modal search interface
- Real-time search results
- Keyboard navigation (ESC to close, arrow keys to navigate)
- Links to result sections

---

## Feature Implementation

### 1. Dark Mode
**Implementation:**
- CSS variables for all colors: `--bg, --text, --border, --accent, etc.`
- `ThemeService` reads/writes to localStorage
- `[data-theme="dark"]` class on `<html>` element
- Global SCSS with media query fallback: `@media (prefers-color-scheme: dark)`

**Components affected:** All (inherit theme automatically)

### 2. Search
**Implementation:**
- `SearchService` indexes all section content at build time
- Lunr.js or native Array.filter + String.match (lightweight)
- Triggered by header search input
- Results show section title + matching excerpt + link
- Search modal opens on input focus

**Indexing:**
```typescript
// Build search index from architectureData
const searchIndex = architectureData.sections.map(s => ({
  id: s.id,
  title: s.title,
  content: s.content,
  searchText: `${s.title} ${s.content}`.toLowerCase()
}));
```

### 3. Responsive Navigation
**Desktop (1024px+):**
- Fixed sidebar (238px) on left
- Content area fills remaining space
- Main content + TOC visible simultaneously

**Tablet (768px - 1023px):**
- Sidebar becomes hamburger menu
- Full-width content
- Hamburger button in header

**Mobile (< 768px):**
- Hamburger menu takes full height when open
- Content takes full width
- Sticky header with hamburger + search

### 4. Table of Contents
**Implementation:**
- Left sidebar with numbered section list
- Active section highlighted as user scrolls
- Click to jump to section
- Smooth scroll behavior

### 5. Analytics
**Implementation:**
```typescript
// analytics.service.ts
export class AnalyticsService {
  trackPageView(sectionId: string, sectionTitle: string) {
    // Vercel Analytics (automatic on Vercel)
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va?.track('Page View', { sectionId });
    }
    // Google Analytics (optional, if configured)
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', { page_path: `/${sectionId}` });
    }
  }
}
```

**Events tracked:**
- Page view (section change)
- Search query
- Dark mode toggle
- External link clicks (SATUSEHAT, BPJS, etc.)

### 6. SEO Optimization
**Implementation:**
- `TitleService` + `MetaService` set per-section meta tags
- Canonical URL
- Open Graph tags (og:title, og:description, og:image)
- Structured data (schema.org Article)
- Sitemap generation
- robots.txt

**Per-section meta:**
```typescript
{
  title: "Master Architecture Diagram — EMR Platform",
  description: "AWS infrastructure for multitenant healthcare platform...",
  image: "og-master-diagram.png"
}
```

---

## Build & Deployment

### Pre-rendering
**Angular Config (`angular.json`):**
```json
{
  "projects": {
    "emr-infra": {
      "architect": {
        "build": {
          "options": {
            "prerender": {
              "routes": [
                "/",
                "/s1", "/s2", "/s3", "/s4", "/s5", "/s6", "/s7", "/s8", "/s9"
              ],
              "guessRoutes": false
            }
          }
        }
      }
    }
  }
}
```

**Build Output:**
- Static HTML files for each route
- Lazy-loaded JSON data
- Assets bundled, optimized
- Gzipped output

### Vercel Deployment
**vercel.json:**
```json
{
  "buildCommand": "ng build --configuration production",
  "outputDirectory": "dist/emr-infra",
  "env": {
    "ANALYTICS_ID": "@ANALYTICS_ID"
  }
}
```

**Deploy process:**
1. Git push to main
2. Vercel auto-builds (`ng build`)
3. Pre-rendered static files deployed
4. Live at `emr-infra.vercel.app`

### Environment Configuration
- `environment.prod.ts` → Google Analytics ID (if enabled)
- No secrets needed (static site)
- Vercel environment variables for future use

---

## Testing Strategy

### Unit Tests
- `SearchService`: test indexing and search results
- `ThemeService`: test localStorage persistence, theme switching
- Components: test rendering with mock data

### Integration Tests
- Route navigation
- Search → navigate to result
- Dark mode toggle → CSS variables applied

### E2E Tests (Optional)
- Full user flow: load page → search → navigate sections → toggle theme

**Tools:**
- Jasmine/Karma (unit)
- Cypress/Playwright (E2E)

---

## Performance & Accessibility

### Performance
- Lazy-load section data on navigation
- Image optimization (SVGs are scalable)
- Critical CSS inline
- Preload fonts
- Target Lighthouse 95+

### Accessibility
- Semantic HTML5
- ARIA labels on interactive elements
- Keyboard navigation (search modal, TOC)
- Color contrast WCAG AA
- Alt text on diagrams

---

## Timeline & Milestones

**Phase 1: Setup & Components (2 days)**
- Initialize Angular project
- Create core components (header, sidebar, section)
- Set up routing, theming

**Phase 2: Content & Features (2 days)**
- Extract SVG diagrams
- Build content data structure
- Implement search, dark mode

**Phase 3: Polish & Deploy (1 day)**
- SEO setup, meta tags
- Analytics integration
- Pre-render configuration
- Deploy to Vercel

**Total: ~5 days**

---

## Future Enhancements

- PDF export of sections
- Comment/annotation system
- Version control for architecture changes
- Integration with JIRA/Linear for ticket references
- Multi-language support (currently Indonesian)

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Static pre-rendering over SSR | Fastest deployment, zero server cost on Vercel |
| Content as data (not hardcoded) | Easier maintenance, enables search indexing |
| CSS Variables for theming | Native browser support, no additional deps |
| Vercel Analytics default | Works out-of-box with Vercel, deployment-agnostic |
| Client-side search | No server needed, instant results, offline-capable |

---

## Assumptions & Constraints

**Assumptions:**
- Content is stable (architecture unlikely to change frequently)
- Audience is technical (developers, architects, stakeholders)
- No user authentication required
- No backend APIs needed

**Constraints:**
- Must work offline (pre-rendered static files)
- Search limited to client-side indexing
- No real-time updates to architecture data

---

**Spec approved by:** User (autonomous implementation)  
**Ready for:** Implementation via writing-plans skill
