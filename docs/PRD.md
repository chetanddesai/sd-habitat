# SD Habitat — Product Requirements Document

**Project:** Sunny Desai Native Habitat Garden — Poway, CA
**Version:** 0.2 (Draft)
**Last Updated:** 2026-04-10

---

## 1. Overview

A static informational website showcasing a native habitat garden in Poway, CA. The site serves as a living reference for the garden's plant inventory, maintenance calendar, bloom/berry/seed phenology, and the wildlife each plant supports throughout the year. All content is data-driven (JSON-backed) so that adding or editing plants requires no code changes.

---

## 2. Non-Functional Requirements

### 2.1 Hosting & Technology

| Constraint | Detail |
|---|---|
| **Hosting** | GitHub Pages (static only — no server-side rendering) |
| **Allowed assets** | HTML, CSS, JavaScript (vanilla or lightweight library), JSON data files, image assets |
| **Build step** | None required. The site must work by serving the repo root (or a configured publish directory) directly. A lightweight build step (e.g., a Node script to generate HTML from JSON) is acceptable as long as the **output** is committed static files. |
| **Browser support** | Latest two versions of Chrome, Safari, Firefox, Edge; mobile Safari & Chrome on iOS/Android |

### 2.2 Data Architecture

| Requirement | Detail |
|---|---|
| **Data format** | One or more JSON files stored in a `data/` directory |
| **Schema** | Each plant is a single JSON object containing all inventory, schedule, bloom, and wildlife data (see §4 for schema draft) |
| **Extensibility** | Adding a new plant = adding a JSON entry + an optional image. No HTML changes needed. |
| **Image strategy** | All plant and wildlife images hotlinked from iNaturalist CDN (no local copies). The site displays skeleton/placeholder states while images load and sets `Cache-Control` headers via `<meta>` or service worker to cache images locally in the browser after first load. |
| **iNaturalist helper script** | A standalone Node script (`scripts/update-observations.js`) queries the iNaturalist `/observations/histogram` API with `interval=month_of_year` for each plant, scoped to a **Poway bounding box** (`nelat` / `nelng` / `swlat` / `swlng` — same values as the iNaturalist observation search links) over a **rolling 5-year window**. Returns per-month observation counts (Jan–Dec) and per-year totals, enabling both seasonal patterns in the calendar view and year-over-year trend lines. Still **one API call per plant** (17 total). Run manually or on a schedule; outputs updated values into `data/plants.json`. |

### 2.3 Favicons & Touch Icons

| Asset | Specification |
|---|---|
| **favicon.ico** | 16×16 and 32×32 multi-resolution ICO |
| **favicon.svg** | SVG favicon for modern browsers |
| **apple-touch-icon.png** | 180×180 PNG |
| **Android icons** | 192×192 and 512×512 PNGs referenced via `site.webmanifest` |
| **`site.webmanifest`** | Standard Web App Manifest with name, icons, theme_color, background_color |

### 2.4 Performance & Accessibility

| Requirement | Detail |
|---|---|
| **Lighthouse score targets** | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90 |
| **Page weight** | < 500 KB first load (excluding off-site images) |
| **Accessibility** | Semantic HTML, ARIA landmarks, sufficient color contrast (WCAG AA), keyboard-navigable, alt text on all images |
| **Responsive design** | Mobile-first; must look great on 375px–1440px+ viewports |

### 2.5 SEO & Social Sharing

| Requirement | Detail |
|---|---|
| **Meta tags** | `<title>`, `<meta name="description">`, Open Graph (`og:title`, `og:description`, `og:image`), Twitter Card |
| **Structured data** | JSON-LD for the site (WebSite schema) — stretch goal |

---

## 3. Functional Requirements

### 3.1 Plant Inventory

The primary section of the site. Each plant entry displays:

| Field | Source / Notes |
|---|---|
| **Common name(s)** | May have multiple common names |
| **Scientific name** | Displayed in *italics* per convention |
| **Synonyms** | Former scientific names where applicable (e.g., *Zauschneria californica* for CA Fuchsia) |
| **Hero image** | Hotlinked from iNaturalist CDN (Creative Commons licensed). Skeleton placeholder shown while loading; cached locally in the browser after first load. |
| **Image citation** | Photographer name, license type, and link back to the iNaturalist observation |
| **Calscape link** | Direct URL to the plant's page on calscape.org (nursery availability, growing info) |
| **iNaturalist observation data** | Monthly observation histogram (Jan–Dec) showing when this plant is most commonly sighted in Poway, CA by citizen scientists, plus year-over-year totals for trend analysis. A frequency indicator (Common / Uncommon / Rare) is derived from the 5-year total. |
| **Description** | 2–4 sentence narrative about the plant's role in supporting native wildlife (insects, birds, mammals, etc.) |
| **Keystone species indicator** | Boolean flag + visual badge if true |
| **Category** | One of: `Large Tree`, `Large Shrub`, `Small Shrub`, `Groundcover — Perennial`, `Groundcover — Annual`, `Herbaceous Perennial` |

#### Planting Requirements

Static site-condition data displayed as part of each plant's inventory card/detail:

| Field | Detail |
|---|---|
| **Sun exposure** | Full Sun, Part Shade, Full Shade, or combination |
| **Slope / drainage** | Flat, gentle slope, steep slope, well-drained required, clay-tolerant, etc. |
| **Soil requirements** | Sandy, loam, clay, serpentine-tolerant, pH preference, amendment notes |

These do not vary month-to-month and are therefore part of the plant profile rather than the maintenance schedule.

#### Sorting & Filtering

- Default sort: grouped by category in the order listed above (Large Tree → … → Groundcover)
- Within each category: alphabetical by common name
- Filter/search bar to quickly find a plant by common or scientific name
- Optional: filter by keystone species, bloom color, wildlife supported

### 3.2 Maintenance Schedule

A calendar-oriented view (12 months) for each plant covering time-varying care tasks:

| Field | Detail |
|---|---|
| **Watering requirements** | Frequency and amount by season (e.g., "Deep water 1×/month Nov–Mar, no summer water once established") |
| **Watering schedule** | Per-month indicator: None / Low / Moderate / Regular |
| **Pruning notes** | When and how to prune (by month or season) |
| **Special maintenance** | Deadheading, dividing, fire-clearing, pest notes |

> **Note:** Static planting conditions (sun exposure, slope/drainage, soil) live in the Plant Inventory section under Planting Requirements (§3.1) since they don't vary by month.

#### Presentation

- A 12-month grid/timeline per plant, or a combined garden-wide calendar
- Color-coded intensity bands for watering
- Ability to view "this month" at a glance across all plants

### 3.3 Bloom, Berry & Seed Schedule

A phenology calendar for each plant:

| Field | Detail |
|---|---|
| **Bloom months** | Start and end month |
| **Bloom color(s)** | Displayed as a color swatch + label |
| **Berry/fruit months** | Start and end month (if applicable) |
| **Berry/fruit color** | Color swatch + label |
| **Seed months** | Start and end month |
| **Ecological value** | What the bloom/berry/seed supports (e.g., "Nectar for native bees; berries eaten by Western Bluebird") |

#### Presentation

- 12-month timeline rows, color-coded: bloom phase → berry phase → seed phase
- Garden-wide phenology chart showing which plants are blooming/fruiting in each month
- Filter by bloom color

### 3.4 Wildlife Schedule

A month-by-month wildlife interaction calendar per plant:

| Field | Detail |
|---|---|
| **Month** | 1–12 |
| **Wildlife visitors** | **Specific, identifiable species only** (e.g., "Monarch butterfly", "Anna's Hummingbird", "Acmon Blue butterfly"). Generic groupings like "native bees" or "hover flies" belong in the plant description and `ecologicalValue` field, not as separate wildlife entries. |
| **Wildlife image** | Hotlinked from iNaturalist CDN (Creative Commons). Same loading/caching strategy as plant images. Attribution stored with the image URL. |
| **Activity** | What they're doing: nectar/pollen foraging, eating seeds, eating berries, nesting, caterpillar host plant, shelter/roosting |
| **Notes** | Any special observations (e.g., "Monarch caterpillars exclusively feed on milkweed") |

> **Guideline — specific species only:** Each wildlife entry must name a specific, identifiable species (or a named species-level organism like "Bombus crotchii"). Broad groups such as "Native bees", "Native solitary bees (Halictidae)", or "Hover flies (Syrphidae)" should **not** appear as wildlife entries. Instead, fold that information into the plant's `description` field or the phenology `ecologicalValue` field where it serves as useful ecological context without cluttering the wildlife tab with entries that can't produce a meaningful image or calendar marker.

#### Presentation

- Per-plant: 12-month row showing wildlife icons/badges by month
- Garden-wide: "What to look for this month" summary across all plants
- Optional: wildlife-centric view — pick a species, see which plants support it and when

---

## 4. Data Schema (Draft)

Each plant object in `data/plants.json`:

```json
{
  "id": "eriogonum-fasciculatum",
  "commonNames": ["California Buckwheat"],
  "scientificName": "Eriogonum fasciculatum",
  "synonyms": [],
  "category": "small-shrub",
  "isKeystone": true,
  "description": "One of the most important nectar sources for native pollinators in coastal sage scrub...",
  "image": {
    "url": "https://inaturalist-open-data.s3.amazonaws.com/photos/...",
    "attribution": "Photo by Jane Doe, CC BY-NC 4.0",
    "iNaturalistUrl": "https://www.inaturalist.org/observations/12345"
  },
  "calscapeUrl": "https://calscape.org/Eriogonum-fasciculatum-(California-Buckwheat)",
  "iNaturalistData": {
    "taxonId": 54999,
    "bounds": {
      "nelat": 33.0652649,
      "nelng": -116.9575429,
      "swlat": 32.899128,
      "swlng": -117.103013
    },
    "searchUrl": "https://www.inaturalist.org/observations?taxon_id=54999&nelat=33.0652649&nelng=-116.9575429&swlat=32.899128&swlng=-117.103013",
    "observationsByMonth": {
      "jan": 12, "feb": 18, "mar": 35, "apr": 52, "may": 68, "jun": 71,
      "jul": 42, "aug": 19, "sep": 10, "oct": 6, "nov": 5, "dec": 4
    },
    "observationsByYear": {
      "2021": 58, "2022": 72, "2023": 65, "2024": 91, "2025": 103
    },
    "totalObservations": 389,
    "frequency": "common",
    "lastUpdated": "2026-04-10"
  },
  "plantingRequirements": {
    "sunExposure": "Full Sun",
    "slopeRequirements": "Well-drained, tolerates slopes",
    "soilRequirements": "Sandy to loam, low fertility, no amendments needed"
  },
  "maintenance": {
    "wateringSchedule": {
      "jan": "none", "feb": "none", "mar": "low", "apr": "low",
      "may": "low", "jun": "none", "jul": "none", "aug": "none",
      "sep": "none", "oct": "none", "nov": "none", "dec": "none"
    },
    "wateringNotes": "Extremely drought-tolerant once established; no summer water needed",
    "pruningNotes": "Cut back by 1/3 in late fall after seeds drop",
    "specialNotes": ""
  },
  "phenology": {
    "bloom": {
      "months": [5, 6, 7, 8, 9],
      "colors": ["white", "pink"]
    },
    "berry": null,
    "seed": {
      "months": [9, 10, 11],
      "description": "Russet seed heads persist through winter"
    },
    "ecologicalValue": "Major nectar source for 50+ native bee species; seeds eaten by goldfinches and sparrows"
  },
  "wildlife": [
    {
      "months": [5, 6, 7],
      "species": "Acmon Blue butterfly",
      "activity": "caterpillar-host",
      "notes": "Buckwheat is a primary host plant for this common blue butterfly",
      "image": {
        "url": "https://inaturalist-open-data.s3.amazonaws.com/photos/...",
        "attribution": "Photo by John Smith, CC BY 4.0",
        "iNaturalistUrl": "https://www.inaturalist.org/observations/67890"
      }
    },
    {
      "months": [10, 11, 12],
      "species": "Lesser Goldfinch",
      "activity": "eating-seeds",
      "notes": "Feeds on dried seed heads",
      "image": {
        "url": "https://inaturalist-open-data.s3.amazonaws.com/photos/...",
        "attribution": "Photo by Maria Lopez, CC BY-NC 4.0",
        "iNaturalistUrl": "https://www.inaturalist.org/observations/11223"
      }
    }
  ]
}
```

### Category Enum Values

| Value | Display Label |
|---|---|
| `large-tree` | Large Tree |
| `large-shrub` | Large Shrub |
| `small-shrub` | Small Shrub |
| `groundcover-perennial` | Groundcover — Perennial |
| `groundcover-annual` | Groundcover — Annual |
| `herbaceous-perennial` | Herbaceous Perennial |

### Activity Enum Values

| Value | Display Label |
|---|---|
| `nectar-pollen` | Nectar / Pollen Foraging |
| `eating-seeds` | Eating Seeds |
| `eating-berries` | Eating Berries |
| `nesting` | Nesting |
| `caterpillar-host` | Caterpillar Host Plant |
| `shelter` | Shelter / Roosting |
| `browsing` | Browsing Foliage |

---

## 5. Starting Plant Inventory

| # | Scientific Name | Common Name(s) | Category (Proposed) |
|---|---|---|---|
| 1 | *Quercus engelmannii* | Engelmann Oak | Large Tree |
| 2 | *Heteromeles arbutifolia* | Toyon | Large Shrub |
| 3 | *Malosma laurina* | Laurel Sumac | Large Shrub |
| 4 | *Baccharis sarothroides* | Desert Broom | Large Shrub |
| 5 | *Xylococcus bicolor* | Mission Manzanita | Large Shrub |
| 6 | *Encelia californica* | Bush Sunflower | Small Shrub |
| 7 | *Artemisia californica* | California Sagebrush | Small Shrub |
| 8 | *Eriogonum fasciculatum* | California Buckwheat | Small Shrub |
| 9 | *Salvia apiana* | White Sage | Small Shrub |
| 10 | *Salvia mellifera* | Black Sage | Small Shrub |
| 11 | *Diplacus puniceus* | Red Bush Monkeyflower | Small Shrub |
| 12 | *Epilobium canum* (syn. *Zauschneria californica*) | California Fuchsia | Herbaceous Perennial |
| 13 | *Eriophyllum confertiflorum* | Golden Yarrow | Herbaceous Perennial |
| 14 | *Asclepias fascicularis* | Narrowleaf Milkweed | Herbaceous Perennial |
| 15 | *Acmispon glaber* var. *brevialatus* | Short-winged Deerweed | Groundcover — Perennial |
| 16 | *Lupinus succulentus* | Arroyo Lupine | Groundcover — Annual |
| 17 | *Bahiopsis laciniata* | Tornleaf Goldeneye / San Diego Sunflower | Small Shrub |

---

## 6. Site Map & Navigation

```
/ (Home)
├── Hero section — garden overview, location context, mission statement
├── #inventory — Plant Inventory (default view)
│   ├── Filter bar (category, keystone, search)
│   └── Plant cards grouped by category
│       └── Expanded plant detail (inline expansion, no modals)
│           ├── Image + attribution
│           ├── Description + keystone badge
│           ├── Links (Calscape, iNaturalist)
│           ├── Planting requirements (sun, slope, soil)
│           ├── Maintenance tab (watering, pruning — monthly)
│           ├── Phenology tab (bloom/berry/seed timeline)
│           ├── Wildlife tab (month-by-month)
│           └── Observations tab (monthly histogram + year-over-year trend)
├── #calendar — Garden Calendar
│   ├── Month selector or horizontal scroll
│   ├── "This Month" summary across all plants
│   │   ├── What's blooming
│   │   ├── What wildlife to expect
│   │   ├── Maintenance tasks
│   │   └── iNaturalist sightings — which plants are most observed this month
│   ├── Watering overview grid
│   └── Year-over-year observation trends (sparkline or bar chart per plant)
├── #about — About the Garden
│   ├── Why native plants matter
│   ├── Poway's coastal sage scrub ecosystem
│   └── How to start your own habitat garden
└── Footer
    ├── Data sources & credits (iNaturalist, Calscape, NWF)
    └── GitHub repo link
```

**Single-page application** — all content on one page with smooth-scroll navigation anchors. No multi-page routing needed for the initial release.

---

## 7. Visual Design Direction

| Aspect | Guidance |
|---|---|
| **Palette** | Earth tones — sage green, warm sand, terracotta, oak brown, sky blue accent |
| **Typography** | Clean sans-serif body (system font stack or Inter); serif or slab-serif for headings for a naturalist/field-guide feel |
| **Card design** | Rounded corners, subtle shadows, generous whitespace |
| **Icons** | Simple line icons for wildlife types, sun/water indicators, bloom colors |
| **Imagery** | Full-bleed hero image of the garden or a native landscape; plant images in consistent aspect ratio cards |
| **Dark mode** | Stretch goal — CSS custom properties make this straightforward |

---

## 8. Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | **Image hosting** | Hotlink from iNaturalist CDN. Show skeleton/placeholder while loading. Cache locally in browser after first load. No images stored in the repo. |
| 2 | **Data population** | Manual curation for all plant data. A helper script (`scripts/update-observations.js`) uses the iNaturalist `/observations/histogram` API with `interval=month_of_year` over a rolling 5-year window. One call per plant returns monthly counts (for calendar integration) and yearly totals (for trend analysis). |
| 3 | **Plant detail layout** | Inline expansion only — no modal overlays anywhere on the site. |
| 4 | **Calendar view scope** | Both: garden-wide "What's happening this month" is the primary view, with drill-down to per-plant detail. |
| 5 | **Additional plant categories** | No `vine` or `succulent` categories. The garden is strictly California natives; the current six categories are sufficient. |
| 6 | **Wildlife images** | Yes — sourced from iNaturalist under Creative Commons, same hotlink + cache strategy as plant images. Each wildlife entry in the data schema includes an `image` object with `url`, `attribution`, and `iNaturalistUrl`. |

---

## 9. Future Enhancements (Out of Scope for V1)

- Interactive garden layout map (SVG or Canvas-based) showing plant placement
- Photo gallery from the actual garden
- Companion planting recommendations
- Water usage calculator
- Print-friendly plant care sheets
- PWA offline support
- Dark mode toggle
- Multi-language support

---

## 10. Success Criteria

- [ ] All 17 plants populated with complete data
- [ ] Site shell (HTML/CSS/JS, excluding off-site images) loads in < 500 KB
- [ ] Plant and wildlife images display skeleton placeholders while loading and cache in browser after first load
- [ ] Passes Lighthouse audits at target thresholds
- [ ] Works on all target browsers (§2.1)
- [ ] All plant and wildlife images properly attributed with Creative Commons compliance
- [ ] Garden calendar provides actionable "this month" guidance
- [ ] A non-technical gardener can understand and use the site without instruction
- [ ] iNaturalist observation count helper script runs successfully against all 17 plants
