---
name: add-plant
description: >-
  Add a new native plant to the SD Habitat garden website. Handles all steps:
  researching the plant, creating the JSON entry in data/plants.json, looking up
  the iNaturalist taxon ID, running the observation script, updating plant counts
  across index.html / README.md / docs/PRD.md, and verifying the result. Use when
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
- [ ] Step 5: Run the observation script
- [ ] Step 6: Update plant counts across the site
- [ ] Step 7: Verify wildlife image searchability
- [ ] Step 8: Verify locally
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
| Wildlife visitors | 2–4 entries of **specific, named species** that interact with this plant. Generic groups like "Native bees" or "Hover flies" belong in the description/ecologicalValue, NOT as wildlife entries. See **Wildlife Species Naming Rules** below and Activity Enums at the end. |

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
    "searchUrl": "https://www.inaturalist.org/observations?taxon_id=12345&nelat=33.0652649&nelng=-116.9575429&swlat=32.899128&swlng=-117.103013",
    "observationsByMonth": {
      "jan": 0, "feb": 0, "mar": 0, "apr": 0, "may": 0, "jun": 0,
      "jul": 0, "aug": 0, "sep": 0, "oct": 0, "nov": 0, "dec": 0
    },
    "observationsByYear": {},
    "totalObservations": 0,
    "frequency": "rare",
    "lastUpdated": "",
    "bounds": {
      "nelat": 33.0652649,
      "nelng": -116.9575429,
      "swlat": 32.899128,
      "swlng": -117.103013
    }
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
- Wildlife `image` objects: Same approach — leave empty. The JS searches iNaturalist using the **first two words** of the `species` field.
- **Wildlife entries must be specific, named species** — do NOT add generic group entries like "Native bees", "Hover flies", or "Bumblebees". Generic pollinator info belongs in `description` or `ecologicalValue` instead.
- Include 2–4 entries covering the major ecological interactions. Common patterns: a specific pollinator species visiting blooms, a named bird nesting, a specific butterfly as caterpillar host, a named bird eating seeds/berries.
- `wateringSchedule`: Use numeric frequencies (`0`, `1`, `2`) — **not** string values like `"none"` or `"low"`.
- `pruningMonths`: Array of 1-indexed month numbers when pruning should occur. Use `[]` if no pruning is needed.
- `pruningTask`: A short, actionable description of the pruning work (e.g., "Remove spent flower stalks", "Cut to ground after die-back"). Required if `pruningMonths` is non-empty.

**Wildlife Species Naming Rules (critical for image loading):**

The JS image loader calls `species.split(' ').slice(0, 2).join(' ')` to build the iNaturalist search query. The first two words of the `species` field **must** return results on the iNaturalist taxa API. Follow these rules:

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

### Step 5: Run the Observation Script

```bash
node scripts/update-observations.js
```

This will:
- Query the iNaturalist histogram API for **all** plants (including the new one)
- Populate `observationsByMonth`, `observationsByYear`, `totalObservations`, `frequency`, and `lastUpdated`
- Write updated data back to `data/plants.json`

Verify the new plant shows observations in the script output. If it shows 0 observations, double-check that the `taxonId` is correct.

### Step 6: Update Plant Counts

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
- iNaturalist helper script description (`N total`)
- Plant inventory table (add a new row `| N | ...`)
- Success criteria (`All N plants populated`)
- Success criteria (`script runs successfully against all N plants`)

### Step 7: Verify Wildlife Image Searchability

**Before** starting the dev server, validate that every wildlife `species` name resolves on iNaturalist. For each wildlife entry in the new plant, run:

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

Replace `FIRST+TWO+WORDS` with the first two words of the `species` field (URL-encoded). If **any** entry prints `FAIL`, fix the `species` name using the naming rules above before proceeding.

### Step 8: Verify Locally

1. Start the local dev server if not running: `npx http-server . -p 8090 -c-1`
2. Open the site and check:
   - New plant card appears in the inventory under the correct category
   - Expanding the card shows all 4 tabs (Maintenance, Bloom & Seeds, Wildlife, Observations)
   - **Wildlife tab**: every species entry loads a photo (no broken image placeholders)
   - The phenology chart includes the new plant row
   - The observation trends section has a sparkline card for the new plant
   - The garden calendar shows the plant in the appropriate months

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
