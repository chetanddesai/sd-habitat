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
| **iNaturalist observation data** | All observation data (plant and wildlife) is fetched **client-side at runtime** from the iNaturalist `/observations/histogram` API, scoped to a **Poway bounding box** over a **rolling 5-year window**. Plant observations use `taxon_id` with both `month_of_year` and `year` intervals (2 calls per plant). Wildlife observations use `taxon_name` with `month_of_year` interval (1 call per species). All results are cached in `localStorage` with a **7-day TTL**. A footer "Refresh Data" button allows manual cache clearing. No server-side scripts or pre-computation needed. |

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
| **Watering schedule** | Per-month numeric frequency: `0` = none, `1` = once/month, `2` = twice/month. Displayed as "1×", "2×" in the UI. |
| **Watering notes** | Free-text description of watering strategy (e.g., "Deep water monthly in summer for first 2–3 years; no irrigation once established") |
| **Pruning months** | Array of 1-indexed months when pruning should be done |
| **Pruning task** | Short actionable description of what to do (e.g., "Cut back by half for fall rebloom", "Remove dead or crossing branches") |
| **Pruning notes** | Longer free-text explanation of pruning approach and timing |
| **Special maintenance** | Deadheading, dividing, fire-clearing, pest notes |

> **Note:** Static planting conditions (sun exposure, slope/drainage, soil) live in the Plant Inventory section under Planting Requirements (§3.1) since they don't vary by month.

#### Presentation

- Per-plant: 12-month grid showing watering frequency and pruning tasks, with current-month highlighting
- Garden-wide: two-column layout in the Garden Calendar — **Watering** (plant name + frequency like "1×/month") and **Pruning** (plant name + actionable task description) — for the selected month
- Columns stack vertically on mobile; empty columns show "None this month"

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

- 12-month timeline rows showing actual botanical colors: bloom cells use the plant's real flower color(s) (gradient for multi-color blooms), berry cells use the fruit color with a dot indicator, and seed cells use a tan stripe pattern
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

- Per-plant: 12-month grid showing active months for each wildlife species, with current-month highlighting and clickable images/names linking to iNaturalist
- Garden-wide "Wildlife to Look For" section in the Garden Calendar:
  - Wildlife entries are **deduplicated by species** across all plants — each species appears once with all its interactions consolidated (e.g., "Anna's Hummingbird · 46 obs/mo" with "Nectar / Pollen on Black Sage, Red Bush Monkeyflower, Tornleaf Goldeneye")
  - Species are classified into **Common / Uncommon / Rare** columns based on the wildlife species' own monthly observation count in the Poway area (fetched from iNaturalist at runtime, cached in localStorage)
  - Rarity thresholds are calculated dynamically (percentile-based on the current month's data) and displayed in column headers (e.g., "Common ≥ 9 obs", "Rare < 9 obs")
  - Each entry includes the species photo, observation count, and a breakdown of activities by host plant
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
    "searchUrl": "https://www.inaturalist.org/observations?taxon_id=54999&nelat=33.0652649&nelng=-116.9575429&swlat=32.899128&swlng=-117.103013"
  },
  "plantingRequirements": {
    "sunExposure": "Full Sun",
    "slopeRequirements": "Well-drained, tolerates slopes",
    "soilRequirements": "Sandy to loam, low fertility, no amendments needed"
  },
  "maintenance": {
    "wateringSchedule": {
      "jan": 0, "feb": 0, "mar": 1, "apr": 1,
      "may": 1, "jun": 0, "jul": 0, "aug": 0,
      "sep": 0, "oct": 0, "nov": 0, "dec": 0
    },
    "wateringNotes": "Extremely drought-tolerant once established; no summer water needed",
    "pruningMonths": [11],
    "pruningTask": "Cut back by ⅓ after seeds drop",
    "pruningNotes": "Cut back by 1/3 in late fall after seeds drop to maintain compact form.",
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
│   │   ├── Wildlife to Look For (deduped by species, Common/Uncommon/Rare via live iNaturalist obs data)
│   │   └── Maintenance (two-column: Watering frequencies | Pruning tasks)
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
| 2 | **Data population** | Manual curation for all plant data. All iNaturalist observation data (plant and wildlife) is fetched client-side at runtime from the histogram API, cached in localStorage with a 7-day TTL. No server-side scripts needed. |
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
- [ ] iNaturalist observation data loads at runtime for all 17 plants and caches correctly
