---
name: add-plant
description: >-
  Add a new native plant to the SD Habitat garden website. Handles all steps:
  researching the plant, creating the JSON entry in data/plants.json, looking up
  the iNaturalist taxon ID, updating plant counts across index.html / README.md /
  docs/PRD.md, and verifying the result. Observation data is fetched at runtime. Use when
  the user wants to add a plant, add a species, expand the inventory, or mentions
  a new plant they want on the site.
---

# Add a New Plant to SD Habitat

## Prerequisites

Before starting, confirm with the user:
1. **Scientific name** (required — everything else can be researched)
2. **Common name(s)** (if the user doesn't provide them, look them up on Calscape or iNaturalist)
3. **Category** — ask the user to pick from: `large-tree`, `large-shrub`, `small-shrub`, `herbaceous-perennial`, `groundcover-perennial`, `groundcover-annual`

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Research the plant
- [ ] Step 2: Find the iNaturalist taxon ID
- [ ] Step 3: Build the JSON entry
- [ ] Step 4: Insert into data/plants.json
- [ ] Step 5: Update plant counts across the site
- [ ] Step 6: Verify wildlife image & observation searchability
- [ ] Step 7: Verify locally
```

---

### Step 1: Research the Plant

Gather this information (Calscape, iNaturalist, and web search are the primary sources):

| Field | Where to find it |
|---|---|
| Common names | Calscape page title, iNaturalist common name |
| Synonyms | Calscape "Synonyms" section or iNaturalist "Taxonomy" tab |
| Keystone status | National Wildlife Federation keystone search or Calscape "Wildlife supported" |
| Description | Write 1–2 sentences: what the plant is, its ecological role, why it matters for the garden. Focus on wildlife value. |
| Sun / Slope / Soil | Calscape "Growing conditions" section |
| Watering schedule | Calscape water needs + common knowledge for the species. Use numeric frequencies: `0` = none, `1` = once/month, `2` = twice/month. Native plants generally need `0` Nov–Mar and `1` Jun–Sep. |
| Pruning months | Which months to prune. Derive from Calscape or native plant care guides. 1-indexed integers (1=Jan, 12=Dec). Leave as `[]` if pruning is not needed (e.g., annuals). |
| Pruning task | Short actionable summary of what to do (e.g., "Cut back by half", "Remove spent flower stalks", "Cut to ground after die-back"). |
| Pruning notes | Longer explanation of pruning approach, timing, and caveats. |
| Bloom months + colors | Calscape "Bloom" section. Months are 1-indexed integers (1=Jan, 12=Dec). |
| Berry/fruit months + colors | Calscape or general botany references. Include a `colors` array (e.g., `["red"]`). Set to `null` if the plant doesn't produce notable berries/fruit. Berry colors are displayed in the phenology chart, so accuracy matters. |
| Seed months | If applicable, when seeds are available for wildlife. Set to `null` if not notable. |
| Ecological value | 1 sentence on what the blooms/berries/seeds support (pollinators, birds, etc.) |
| Wildlife visitors | 2–4 entries of **specific, named species** that interact with this plant. Generic groups like "Native bees" or "Hover flies" belong in the description/ecologicalValue, NOT as wildlife entries. Species names must resolve on iNaturalist — they're used for both **image loading** AND **observation data fetching** in the Garden Calendar (see below). See **Wildlife Species Naming Rules** below and Activity Enums at the end. |

### Step 2: Find the iNaturalist Taxon ID

1. Search `https://api.inaturalist.org/v1/taxa?q=SCIENTIFIC_NAME&per_page=1&is_active=true`
2. The `results[0].id` is the `taxonId`.
3. Verify the returned `name` matches the expected scientific name.
4. Build the search URL: `https://www.inaturalist.org/observations?taxon_id=TAXON_ID&nelat=33.0652649&nelng=-116.9575429&swlat=32.899128&swlng=-117.103013`
5. Build the Calscape URL: `https://calscape.org/GENUS-SPECIES-(Common-Name)` (hyphens between words, parentheses around common name).

### Step 3: Build the JSON Entry

Use this template. All fields are required unless marked optional.

```json
{
  "id": "genus-species",
  "commonNames": ["Primary Common Name", "Alternate Name"],
  "scientificName": "Genus species",
  "synonyms": [],
  "category": "small-shrub",
  "isKeystone": false,
  "description": "...",
  "image": {
    "url": "",
    "attribution": "",
    "iNaturalistUrl": ""
  },
  "calscapeUrl": "https://calscape.org/Genus-species-(Common-Name)",
  "iNaturalistData": {
    "taxonId": 12345,
    "searchUrl": "https://www.inaturalist.org/observations?taxon_id=12345&nelat=33.0652649&nelng=-116.9575429&swlat=32.899128&swlng=-117.103013"
  },
  "plantingRequirements": {
    "sunExposure": "Full Sun",
    "slopeRequirements": "...",
    "soilRequirements": "..."
  },
  "maintenance": {
    "wateringSchedule": {
      "jan": 0, "feb": 0, "mar": 0, "apr": 0,
      "may": 1, "jun": 1, "jul": 1, "aug": 1,
      "sep": 0, "oct": 0, "nov": 0, "dec": 0
    },
    "wateringNotes": "...",
    "pruningMonths": [10, 11],
    "pruningTask": "Cut back by half to shape",
    "pruningNotes": "...",
    "specialNotes": ""
  },
  "phenology": {
    "bloom": {
      "months": [3, 4, 5],
      "colors": ["yellow"]
    },
    "berry": null,
    "seed": null,
    "ecologicalValue": "..."
  },
  "wildlife": [
    {
      "months": [3, 4, 5],
      "species": "Species name (Family or Genus)",
      "activity": "nectar-pollen",
      "notes": "Brief note on behavior",
      "image": {
        "url": "",
        "attribution": "",
        "iNaturalistUrl": ""
      }
    }
  ]
}
```

**Important conventions:**
- `id`: lowercase scientific name with hyphens, e.g. `"bahiopsis-laciniata"`
- `image`: Leave `url`, `attribution`, and `iNaturalistUrl` as empty strings — the client-side JS fetches images dynamically from the iNaturalist taxa API at runtime using the scientific name. The image object is a fallback only.
- Wildlife `image` objects: Same approach — leave empty. The JS searches iNaturalist using the **first two words** of the `species` field for images and the full name (minus parenthetical content) for observation data.
- **Wildlife entries must be specific, named species** — do NOT add generic group entries like "Native bees", "Hover flies", or "Bumblebees". Generic pollinator info belongs in `description` or `ecologicalValue` instead. The Garden Calendar deduplicates wildlife entries across plants (e.g., Anna's Hummingbird appearing on 3 plants becomes one card listing all interactions) and classifies species into Common/Uncommon/Rare using real iNaturalist observation counts for the Poway area.
- Include 2–4 entries covering the major ecological interactions. Common patterns: a specific pollinator species visiting blooms, a named bird nesting, a specific butterfly as caterpillar host, a named bird eating seeds/berries.
- `wateringSchedule`: Use numeric frequencies (`0`, `1`, `2`) — **not** string values like `"none"` or `"low"`.
- `pruningMonths`: Array of 1-indexed month numbers when pruning should occur. Use `[]` if no pruning is needed.
- `pruningTask`: A short, actionable description of the pruning work (e.g., "Remove spent flower stalks", "Cut to ground after die-back"). Required if `pruningMonths` is non-empty.

**Wildlife Species Naming Rules (critical for image loading AND observation data):**

The species name is used in two places at runtime:
1. **Image loading** — the JS calls `species.split(' ').slice(0, 2).join(' ')` to search the iNaturalist taxa API for photos.
2. **Garden Calendar observation data** — the JS calls `species.replace(/\s*\(.*\)/, '').trim()` to query the iNaturalist histogram API for monthly observation counts in Poway. These counts drive the Common/Uncommon/Rare classification.

Both lookups must succeed. The first two words (or the name minus parenthetical content) **must** return results on iNaturalist. Follow these rules:

1. **Birds, lizards, mammals** — Use the standard common name. These almost always resolve.
   - Good: `"Anna's Hummingbird"`, `"Western Fence Lizard"`, `"Mule deer"`
2. **Butterflies/moths** — Use the proper common name WITHOUT the word "butterfly"/"moth" appended, unless it's part of the official two-word name. The first two words must be the searchable name.
   - Good: `"Common Buckeye"`, `"Painted Lady butterfly"`, `"Monarch butterfly"`
   - Bad: `"Buckeye butterfly"` (iNaturalist returns 0 results for "Buckeye butterfly")
3. **Insects with scientific names** — Put the scientific binomial FIRST, common name in parentheses. The first two words (the binomial) will be the search term.
   - Good: `"Bombus crotchii (Crotch's Bumblebee)"`, `"Xylocopa varipuncta (Valley Carpenter Bee)"`
   - Bad: `"Crotch's Bumblebee (Bombus crotchii)"` (iNaturalist returns 0 for "Crotch's Bumblebee")
4. **Never combine multiple species** in one entry.
   - Bad: `"Bumblebees (Bombus crotchii, B. vosnesenskii)"` — pick the primary species and mention others in `notes`.

### Step 4: Insert into data/plants.json

1. Read `data/plants.json`.
2. Append the new entry to the array (before the closing `]`).
3. Plants are loosely grouped by category in the file but the JS sorts dynamically, so exact position doesn't matter — appending to the end is fine.

### Step 5: Update Plant Counts

The total plant count appears in **6 locations** across 3 files. Search for the old count (e.g. `17`) and increment to the new count (e.g. `18`):

**`index.html`** — 5 occurrences:
- `<meta name="description" ...>` (line ~7)
- `<meta property="og:description" ...>` (line ~11)
- `<meta name="twitter:description" ...>` (line ~18)
- Hero description `<p class="hero-desc">` (line ~57)
- Inventory section description `<p class="section-desc">` (line ~67)

**`README.md`** — 1 occurrence:
- Features bullet: `**Plant Inventory** — N California native plants...`

**`docs/PRD.md`** — 3 occurrences:
- Plant inventory table (add a new row `| N | ...`)
- Success criteria (`All N plants populated`)
- Success criteria (`observation data loads at runtime for all N plants`)

### Step 6: Verify Wildlife Image & Observation Searchability

**Before** starting the dev server, validate that every wildlife `species` name resolves on iNaturalist for both images and observations. For each wildlife entry in the new plant, run:

**Image check** (uses first two words of species name):
```bash
curl -s "https://api.inaturalist.org/v1/taxa?q=FIRST+TWO+WORDS&per_page=1&is_active=true" | python3 -c "
import json, sys
data = json.load(sys.stdin)
r = data.get('results', [])
if r and r[0].get('default_photo'):
    print(f'OK: {r[0][\"name\"]} — {r[0].get(\"preferred_common_name\",\"\")}')
else:
    print('FAIL: no results or no photo — rename the species field')
"
```

**Observation check** (uses name minus parenthetical content):
```bash
curl -s "https://api.inaturalist.org/v1/observations/histogram?taxon_name=SPECIES_NAME&nelat=33.0652649&nelng=-116.9575429&swlat=32.899128&swlng=-117.103013&interval=month_of_year&d1=2021-01-01" | python3 -c "
import json, sys
data = json.load(sys.stdin)
m = data.get('results', {}).get('month_of_year', {})
total = sum(m.values())
if total > 0:
    print(f'OK: {total} observations across months')
else:
    print('WARN: 0 observations in Poway — species will appear as Rare in the Garden Calendar')
"
```

Replace `FIRST+TWO+WORDS` with the first two words of the `species` field (URL-encoded), and `SPECIES_NAME` with the full name minus any parenthetical content (URL-encoded). If the image check prints `FAIL`, fix the `species` name using the naming rules above. The observation check returning 0 is acceptable (species will be classified as Rare) but a non-zero count confirms the name resolves correctly.

### Step 7: Verify Locally

1. Start the local dev server if not running: `npx http-server . -p 8090 -c-1`
2. Open the site and check:
   - New plant card appears in the inventory under the correct category
   - Expanding the card shows all 4 tabs (Maintenance, Bloom & Seeds, Wildlife, Observations)
   - **Wildlife tab**: every species entry loads a photo (no broken image placeholders)
   - The phenology chart includes the new plant row
   - The observation trends section has a sparkline card for the new plant
   - The garden calendar shows the plant in the appropriate months
   - **Garden Calendar wildlife**: navigate to a month where the new plant's wildlife is active; species should appear in the "Wildlife to Look For" section with observation counts, deduped with any existing entries for the same species on other plants

---

## Reference: Enum Values

### Category
| Value | Display |
|---|---|
| `large-tree` | Large Tree |
| `large-shrub` | Large Shrub |
| `small-shrub` | Small Shrub |
| `herbaceous-perennial` | Herbaceous Perennial |
| `groundcover-perennial` | Groundcover — Perennial |
| `groundcover-annual` | Groundcover — Annual |

### Wildlife Activity
| Value | Display |
|---|---|
| `nectar-pollen` | Nectar / Pollen Foraging |
| `eating-seeds` | Eating Seeds |
| `eating-berries` | Eating Berries |
| `nesting` | Nesting |
| `caterpillar-host` | Caterpillar Host Plant |
| `shelter` | Shelter / Roosting |
| `browsing` | Browsing Foliage |

### Watering Frequencies
`0` = none | `1` = 1×/month | `2` = 2×/month (numeric integers, not strings)

### Poway Bounding Box (constant across all plants)
```
nelat: 33.0652649, nelng: -116.9575429
swlat: 32.899128,  swlng: -117.103013
```
