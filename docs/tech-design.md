# SD Native Habitat Garden — Technical Design Document

**Project:** Sunny Desai Native Habitat Garden — Poway, CA
**Version:** 1.0
**Last Updated:** 2026-04-14

---

## 1. Problem Statement

### Problem

Habitat gardens planted with California native species generate a complex web of time-varying information: which plants bloom when, what wildlife visits each month, how to water and prune on the right schedule, and whether citizen-science observations confirm the garden's ecological value. This information lives in field guides, Calscape pages, iNaturalist records, and the gardener's memory — scattered across sources and difficult to act on in the moment.

### Value

A single, data-driven reference site consolidates all of this into one place:

- **For the gardener:** A month-by-month dashboard answers "what should I do this week?" and "what wildlife should I look for?" without cross-referencing multiple sources.
- **For conservation:** Integrating live iNaturalist observation data quantifies the garden's contribution to local biodiversity in the Poway area, one of the last fragments of Southern California's endangered coastal sage scrub ecosystem.
- **For the community:** An open-source, no-cost, no-login site can inspire neighbors to plant native gardens and contribute to a wildlife corridor.

---

## 2. Functional Requirements

Derived from the [Product Requirements Document](PRD.md) §3.

| ID | Requirement | Implementation |
|---|---|---|
| FR-1 | **Plant inventory** with 17 species, each displaying common/scientific names, images, descriptions, keystone badge, category, planting requirements, and links to Calscape/iNaturalist | Single-page app renders `data/plants.json` into expandable card components grouped by category. Cards are filterable by category, keystone status, and free-text search. |
| FR-2 | **Maintenance schedule** per plant showing 12-month watering frequency and pruning tasks | Per-plant tab with two 6×2 grids (watering cells color-coded by frequency, pruning cells with scissor indicators). Current month highlighted. |
| FR-3 | **Bloom, berry & seed phenology** with actual botanical colors | Per-plant tab with 12-month color-coded cells (CSS gradients for multi-color blooms, stripe pattern for seeds, dot overlay for berries). Garden-wide phenology chart as a scrollable HTML table with sticky plant-name column. |
| FR-4 | **Wildlife schedule** per plant with specific named species, activity type, and month ranges | Per-plant tab listing each species with image, activity label, 12-month indicator grid, and notes. Images fetched at runtime from iNaturalist taxa API. |
| FR-5 | **Garden Calendar** showing garden-wide monthly summary | Month-navigable dashboard with three sub-sections: wildlife (deduplicated by species, classified Common/Uncommon/Rare), maintenance (two-column: watering and pruning), and observation trends (SVG sparkline cards). |
| FR-6 | **Observation data** for each plant showing monthly histograms and year-over-year trends | Fetched at runtime from iNaturalist histogram API. Displayed in per-plant Observations tab and garden-wide trend chart. Frequency badge (common/uncommon/rare) derived from 5-year total. |
| FR-7 | **Wildlife rarity classification** using live observation counts | For each unique wildlife species in the current calendar month, the site fetches monthly observation data from iNaturalist, then classifies species into Common/Uncommon/Rare using percentile-based thresholds calculated dynamically from the current month's data. |
| FR-8 | **Cache management** with manual refresh | Footer displays cache timestamp and a "Refresh Data" button that clears all `localStorage` caches and reloads the page. |

---

## 3. Non-Functional Requirements

Derived from the [Product Requirements Document](PRD.md) §2.

| ID | Requirement | Implementation |
|---|---|---|
| NFR-1 | **Static hosting on GitHub Pages** — no server-side rendering | Entire site is HTML + CSS + JS + JSON. No build step, no server, no database. Deployed by pushing to `main` branch. |
| NFR-2 | **Performance: Lighthouse ≥ 90** across all categories | Page shell < 500 KB (excluding off-site images). Images lazy-loaded via `IntersectionObserver`. API calls parallelized and cached. CSS uses system font stack (no web font downloads). |
| NFR-3 | **Accessibility: WCAG AA** | Semantic HTML (`<nav>`, `<main>`, `<section>`, `<footer>`), ARIA landmarks and labels, keyboard-navigable cards (`tabindex`, `role="button"`, `aria-expanded`), skip link, sufficient color contrast, alt text on all images. |
| NFR-4 | **Responsive: 375px–1440px+** | Mobile-first CSS with breakpoints at 480px, 600px, and 768px. CSS Grid with `auto-fill`/`auto-fit` for fluid column counts. Hamburger menu on mobile. |
| NFR-5 | **SEO & social sharing** | `<title>`, `<meta description>`, Open Graph tags, Twitter Card tags, semantic heading hierarchy, favicon suite (SVG, PNG, ICO, Apple Touch Icon, Web App Manifest). |
| NFR-6 | **Data freshness with 7-day TTL** | All runtime-fetched data (plant observations, wildlife observations, species images) cached in `localStorage` with a shared timestamp. Cache expires after 7 days; expired entries are re-fetched on next access. |
| NFR-7 | **Graceful degradation** | If iNaturalist API is unavailable, the site falls back to stale cached data or shows placeholder states. Plant inventory, maintenance, phenology, and wildlife schedules all render from local JSON without any API dependency. |
| NFR-8 | **No external dependencies** | Zero npm packages, zero frameworks, zero CDN dependencies. Vanilla HTML/CSS/JS only. |

---

## 4. Assumptions & Considerations

| # | Constraint | Impact on Design |
|---|---|---|
| 1 | **GitHub Pages is static-only** — no server-side code, no environment variables, no scheduled jobs | All dynamic data (observation counts, species images) must be fetched client-side. There is no server to proxy API calls, enforce rate limits, or store secrets. The iNaturalist API is called directly from the browser. |
| 2 | **iNaturalist API has no authentication requirement** but informal rate limits (~1 req/sec recommended) | Plant observation fetches are parallelized in bulk (2 calls × 17 plants = 34 calls on first load of the trend chart). Wildlife observation fetches are parallelized per-month (up to ~15 unique species). Aggressive `localStorage` caching with a 7-day TTL minimizes repeat calls. |
| 3 | **iNaturalist CDN images are hotlinked** — no local copies | If iNaturalist changes image URLs or goes down, images break. Mitigated by caching resolved image URLs in `localStorage`. All images are Creative Commons licensed and properly attributed. |
| 4 | **`localStorage` has a ~5 MB quota** per origin | Three caches share this space: plant observations, wildlife observations, and image metadata. For 17 plants and ~40 wildlife species, total cached data is well under 1 MB. |
| 5 | **Single JSON file for all plant data** | With 17 plants, the file is ~30 KB (minified). If the inventory grows to hundreds of plants, the file may need splitting or lazy loading. Current size is not a concern. |
| 6 | **No build step** | All code is hand-written and committed as-is. No transpilation, minification, or bundling. This keeps the project simple but means no TypeScript, no JSX, and no tree-shaking. |
| 7 | **Poway bounding box is hardcoded** | The geographic scope (`nelat=33.0652649, nelng=-116.9575429, swlat=32.899128, swlng=-117.103013`) is baked into both the JavaScript and the iNaturalist search URLs in `plants.json`. Relocating the garden would require updating both. |
| 8 | **Browser must support ES2020+** | The app uses optional chaining (`?.`), `Promise.all`, `async/await`, `IntersectionObserver`, `Map`, `Set`, and template literals. Supported by all target browsers (latest 2 versions of Chrome, Safari, Firefox, Edge). |

---

## 5. Physical Component Diagram

```mermaid
flowchart TB
    subgraph "GitHub Pages (Static Host)"
        HTML["index.html<br/>Single-page shell"]
        CSS["css/styles.css<br/>Mobile-first stylesheet"]
        JS["js/app.js<br/>Application logic (IIFE)"]
        JSON["data/plants.json<br/>Plant inventory data"]
        ASSETS["images/*<br/>Favicons & icons"]
        MANIFEST["site.webmanifest"]
    end

    subgraph "Client Browser"
        DOM["DOM<br/>Rendered UI"]
        LS["localStorage<br/>3 cache stores"]

        subgraph "Cache Stores"
            PLANT_CACHE[["sd-habitat-plant-obs-v1<br/>Plant observation data"]]
            WL_CACHE[["sd-habitat-wl-obs-v1<br/>Wildlife observation data"]]
            IMG_CACHE[["sd-habitat-img-cache-v1<br/>Image URL metadata"]]
            TS_CACHE[["sd-habitat-cache-ts<br/>Shared TTL timestamp"]]
        end
    end

    subgraph "iNaturalist API (External)"
        HIST_API["/v1/observations/histogram<br/>Observation counts by time"]
        TAXA_API["/v1/taxa<br/>Species images & metadata"]
    end

    subgraph "iNaturalist CDN (External)"
        IMG_CDN["inaturalist-open-data.s3.amazonaws.com<br/>Creative Commons images"]
    end

    HTML --> DOM
    CSS --> DOM
    JS --> DOM
    JS -- "fetch()" --> JSON
    JS -- "fetch() + cache" --> HIST_API
    JS -- "fetch() + cache" --> TAXA_API
    TAXA_API -- "image URLs" --> IMG_CDN
    IMG_CDN -- "<img src>" --> DOM
    JS <-- "read/write" --> LS
```

### Module Breakdown (`js/app.js`)

The entire application is a single IIFE with the following logical modules:

```mermaid
flowchart LR
    subgraph "app.js (IIFE)"
        INIT["init()<br/>Bootstrap"]
        CACHE["Cache Infrastructure<br/>TTL, clear, status UI"]

        subgraph "Data Fetchers"
            FPO["fetchPlantObs(taxonId)<br/>2 parallel API calls"]
            FWO["fetchWildlifeObs(species)<br/>1 API call"]
            FTI["fetchTaxonImage(img)<br/>1 API call + queue"]
        end

        subgraph "Renderers"
            INV["renderInventory()<br/>Plant cards + filters"]
            CAL["renderCalendar()<br/>Wildlife + maintenance"]
            PHENO["renderPhenologyChart()<br/>Garden-wide table"]
            TREND["renderTrendChart()<br/>SVG sparklines"]
        end

        subgraph "UI Components"
            CARD["plantCard / plantDetail<br/>Expandable cards"]
            TABS["Maintenance / Phenology<br/>Wildlife / Observations tabs"]
            FILT["Filter bar<br/>Search, category, keystone"]
        end
    end

    INIT --> INV
    INIT --> CAL
    INIT --> PHENO
    INIT --> TREND
    INV --> CARD
    CARD --> TABS
    TABS --> FPO
    TABS --> FTI
    CAL --> FWO
    CAL --> FTI
    TREND --> FPO
    FPO --> CACHE
    FWO --> CACHE
    FTI --> CACHE
```

---

## 6. Sequence Diagrams

### 6.1 Page Load & Initialization

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as GitHub Pages
    participant JS as app.js
    participant JSON as plants.json
    participant iNat as iNaturalist API

    B->>S: GET index.html
    S-->>B: HTML + CSS + JS refs
    B->>S: GET js/app.js, css/styles.css
    B->>S: GET data/plants.json
    S-->>B: plants.json (17 plants)

    Note over JS: DOMContentLoaded → init()
    JS->>JS: renderInventory()
    Note over JS: Cards rendered with "…" frequency badges
    JS->>JS: setupImageObserver()
    Note over JS: IntersectionObserver watches card thumbnails

    JS->>JS: renderCalendar()
    JS->>JS: renderPhenologyChart()

    par Trend Chart (async)
        JS->>JS: renderTrendChart()
        loop For each of 17 plants (parallel)
            JS->>JS: fetchPlantObs(taxonId)
            alt Cache valid (< 7 days)
                JS-->>JS: Return cached data
            else Cache expired or empty
                JS->>iNat: GET /histogram?taxon_id=X&interval=month_of_year
                JS->>iNat: GET /histogram?taxon_id=X&interval=year
                iNat-->>JS: Monthly counts
                iNat-->>JS: Yearly counts
                JS->>JS: Write to localStorage
            end
        end
        JS->>JS: Render SVG sparkline cards
        JS->>JS: Update frequency badges
    end

    par Wildlife Calendar (async)
        loop For each unique species this month (parallel)
            JS->>JS: fetchWildlifeObs(species)
            alt Cache valid
                JS-->>JS: Return cached data
            else Cache miss
                JS->>iNat: GET /histogram?taxon_name=X&interval=month_of_year
                iNat-->>JS: Monthly counts
                JS->>JS: Write to localStorage
            end
        end
        JS->>JS: Classify Common / Uncommon / Rare
        JS->>JS: Render 3-column wildlife grid
    end
```

### 6.2 Plant Card Expansion & Image Loading

```mermaid
sequenceDiagram
    participant U as User
    participant JS as app.js
    participant LS as localStorage
    participant iNat as iNaturalist API
    participant CDN as iNaturalist CDN

    U->>JS: Click plant card header
    JS->>JS: toggleCard() → expanded = true

    par Load detail images
        JS->>JS: queueImageFetch(hero img)
        JS->>JS: queueImageFetch(wildlife imgs)
        loop Process queue (max 3 concurrent)
            alt Image in cache
                JS->>LS: Read imageCache[species]
                LS-->>JS: {url, attribution, inatUrl}
                JS->>CDN: <img src=url>
                CDN-->>JS: Image bytes
            else Cache miss
                JS->>iNat: GET /v1/taxa?q=species&per_page=1
                iNat-->>JS: Taxon with default_photo
                JS->>LS: Write imageCache[species]
                JS->>CDN: <img src=medium_url>
                CDN-->>JS: Image bytes
            end
        end
    end

    par Load observations tab
        JS->>JS: loadObservationsTab(card)
        JS->>JS: fetchPlantObs(taxonId)
        alt Cache valid
            JS->>LS: Read plantObsCache[taxonId]
            LS-->>JS: {byMonth, byYear, total, frequency}
        else Cache miss
            JS->>iNat: GET /histogram (month_of_year + year)
            iNat-->>JS: Observation data
            JS->>LS: Write plantObsCache[taxonId]
        end
        JS->>JS: renderObservationsContent()
        JS->>JS: Update frequency badge
    end
```

### 6.3 Cache Refresh Flow

```mermaid
sequenceDiagram
    participant U as User
    participant JS as app.js
    participant LS as localStorage
    participant B as Browser

    U->>JS: Click "↻ Refresh Data" button
    JS->>JS: clearAllCaches()
    JS->>LS: Remove sd-habitat-plant-obs-v1
    JS->>LS: Remove sd-habitat-wl-obs-v1
    JS->>LS: Remove sd-habitat-img-cache-v1
    JS->>LS: Remove sd-habitat-cache-ts
    JS->>B: window.location.reload()

    Note over B: Page reloads → init()
    Note over JS: All fetch functions find empty caches
    Note over JS: Fresh API calls to iNaturalist for all data
    JS->>LS: Write new cache entries
    JS->>LS: Write new timestamp
    JS->>JS: updateCacheStatusUI(now)
```

---

## 7. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     data/plants.json                         │
│  (static: IDs, names, descriptions, phenology, wildlife,    │
│   maintenance schedules, taxonIds, searchUrls)               │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch() on page load
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      js/app.js                               │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Inventory │  │ Phenology    │  │ Garden Calendar        │ │
│  │ (sync)    │  │ Chart (sync) │  │ Wildlife (async+cache) │ │
│  └──────────┘  └──────────────┘  │ Maint    (sync)        │ │
│                                   │ Trends   (async+cache) │ │
│  ┌──────────────────────┐        └────────────────────────┘ │
│  │ Per-plant tabs:       │                                   │
│  │  Maintenance (sync)   │         ┌──────────────────────┐ │
│  │  Phenology   (sync)   │         │ Image Queue          │ │
│  │  Wildlife    (sync)   │         │ (async, 3 concurrent)│ │
│  │  Observations(async)  │         └──────────────────────┘ │
│  └──────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   iNaturalist    iNaturalist    iNaturalist
   /histogram     /taxa          CDN images
   (obs data)     (image URLs)   (photo files)
          │              │              │
          └──────┬───────┘              │
                 ▼                      │
          localStorage                  │
          (7-day TTL)                   │
                 │                      │
                 └──────────┬───────────┘
                            ▼
                     Rendered DOM
```
