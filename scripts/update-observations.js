#!/usr/bin/env node

/**
 * Fetches iNaturalist observation histograms for each plant in plants.json
 * and updates the observationsByMonth, observationsByYear, totalObservations,
 * frequency, and lastUpdated fields.
 *
 * Uses the /observations/histogram endpoint with a rolling 5-year window.
 * Queries are scoped to a Poway, CA bounding box (nelat/nelng/swlat/swlng), not county-wide.
 * One API call per plant (17 total for the current inventory).
 *
 * Usage:  node scripts/update-observations.js
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'plants.json');
const API_BASE = 'https://api.inaturalist.org/v1';
const LOOKBACK_YEARS = 5;
const RATE_LIMIT_MS = 1200; // ~1 req/sec to be polite to the API

/** Poway area — same bounds for web UI links and API histogram */
const POWAY_BOUNDS = {
  nelat: 33.0652649,
  nelng: -116.9575429,
  swlat: 32.899128,
  swlng: -117.103013
};

function boundsQueryString() {
  const b = POWAY_BOUNDS;
  return `nelat=${b.nelat}&nelng=${b.nelng}&swlat=${b.swlat}&swlng=${b.swlng}`;
}

function buildSearchUrl(taxonId) {
  return `https://www.inaturalist.org/observations?taxon_id=${taxonId}&${boundsQueryString()}`;
}

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function computeFrequency(total) {
  if (total >= 200) return 'common';
  if (total >= 50) return 'uncommon';
  return 'rare';
}

async function fetchHistogram(taxonId, d1, d2, interval) {
  const url = `${API_BASE}/observations/histogram?taxon_id=${taxonId}&${boundsQueryString()}&d1=${d1}&d2=${d2}&interval=${interval}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'sd-habitat-garden/1.0 (github.com/cdesai/sd-habitat)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for taxon ${taxonId}: ${await res.text()}`);
  return res.json();
}

async function updatePlant(plant) {
  const { taxonId } = plant.iNaturalistData;
  if (!taxonId) {
    console.warn(`  ⚠ Skipping ${plant.id}: missing taxonId`);
    return;
  }

  plant.iNaturalistData.bounds = { ...POWAY_BOUNDS };
  delete plant.iNaturalistData.placeId;
  plant.iNaturalistData.searchUrl = buildSearchUrl(taxonId);

  const now = new Date();
  const d2 = now.toISOString().slice(0, 10);
  const d1 = `${now.getFullYear() - LOOKBACK_YEARS}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Monthly histogram (month_of_year gives Jan–Dec aggregated across all years)
  const monthData = await fetchHistogram(taxonId, d1, d2, 'month_of_year');
  await sleep(RATE_LIMIT_MS);

  // Yearly histogram
  const yearData = await fetchHistogram(taxonId, d1, d2, 'year');
  await sleep(RATE_LIMIT_MS);

  const monthResults = monthData.results?.month_of_year || {};
  const yearResults = yearData.results?.year || {};

  const observationsByMonth = {};
  for (let m = 1; m <= 12; m++) {
    observationsByMonth[MONTH_KEYS[m - 1]] = monthResults[m] || 0;
  }

  const observationsByYear = {};
  for (const [dateStr, count] of Object.entries(yearResults)) {
    const year = dateStr.slice(0, 4);
    observationsByYear[year] = (observationsByYear[year] || 0) + count;
  }

  const totalObservations = Object.values(observationsByMonth).reduce((s, v) => s + v, 0);

  plant.iNaturalistData.observationsByMonth = observationsByMonth;
  plant.iNaturalistData.observationsByYear = observationsByYear;
  plant.iNaturalistData.totalObservations = totalObservations;
  plant.iNaturalistData.frequency = computeFrequency(totalObservations);
  plant.iNaturalistData.lastUpdated = d2;
}

async function main() {
  console.log('📊 Updating iNaturalist observation data...\n');

  const plants = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  console.log(`Found ${plants.length} plants\n`);

  for (const plant of plants) {
    process.stdout.write(`  ${plant.commonNames[0]} (${plant.scientificName})... `);
    try {
      await updatePlant(plant);
      console.log(`✓ ${plant.iNaturalistData.totalObservations} obs (${plant.iNaturalistData.frequency})`);
    } catch (err) {
      console.error(`✗ ${err.message}`);
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(plants, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Updated ${DATA_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
