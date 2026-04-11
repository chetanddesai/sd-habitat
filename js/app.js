/* ============================================================
   SD Habitat — Application
   ============================================================ */
(function () {
  'use strict';

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const CATEGORY_ORDER = [
    'large-tree','large-shrub','small-shrub',
    'herbaceous-perennial','groundcover-perennial','groundcover-annual'
  ];
  const CATEGORY_LABELS = {
    'large-tree': 'Large Trees',
    'large-shrub': 'Large Shrubs',
    'small-shrub': 'Small Shrubs',
    'herbaceous-perennial': 'Herbaceous Perennials',
    'groundcover-perennial': 'Groundcover — Perennial',
    'groundcover-annual': 'Groundcover — Annual'
  };
  const ACTIVITY_LABELS = {
    'nectar-pollen': 'Nectar / Pollen',
    'eating-seeds': 'Eating Seeds',
    'eating-berries': 'Eating Berries',
    'nesting': 'Nesting',
    'caterpillar-host': 'Caterpillar Host',
    'shelter': 'Shelter / Roosting',
    'browsing': 'Browsing'
  };
  const WATER_LABELS = { none: '—', low: 'Low', moderate: 'Med', regular: 'Reg' };
  const COLOR_MAP = {
    'white': '#f5f5f0', 'pink': '#f0a0b0', 'red': '#d44040', 'orange': '#e8833a',
    'orange-red': '#e05530', 'yellow': '#f0d040', 'yellow-green': '#b8cc50',
    'blue': '#5588cc', 'purple': '#8855aa', 'lavender': '#b0a0d0',
    'pale-blue': '#a0c0e0', 'rust': '#b06030', 'brown': '#8b6b4a'
  };

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  // ---- iNaturalist Image Loading (runtime, cached in localStorage) ----
  const INAT_TAXA_API = 'https://api.inaturalist.org/v1/taxa';
  const IMAGE_CACHE_KEY = 'sd-habitat-img-cache-v1';
  const CONCURRENT_FETCHES = 3;

  let imageCache = loadImageCache();
  let fetchQueue = [];
  let activeFetches = 0;

  function loadImageCache() {
    try { return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY)) || {}; }
    catch { return {}; }
  }
  function saveImageCache() {
    try { localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache)); }
    catch { /* storage full */ }
  }

  function queueImageFetch(img) {
    const name = img.dataset.species;
    if (!name) return;
    if (imageCache[name]) {
      applyImage(img, imageCache[name]);
      return;
    }
    fetchQueue.push(img);
    processQueue();
  }

  function processQueue() {
    while (activeFetches < CONCURRENT_FETCHES && fetchQueue.length > 0) {
      const img = fetchQueue.shift();
      activeFetches++;
      fetchTaxonImage(img).finally(() => { activeFetches--; processQueue(); });
    }
  }

  async function fetchTaxonImage(img) {
    const species = img.dataset.species;
    const searchName = species.split(' ').slice(0, 2).join(' ');
    try {
      const resp = await fetch(`${INAT_TAXA_API}?q=${encodeURIComponent(searchName)}&per_page=1&is_active=true`);
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        const taxon = data.results[0];
        if (taxon.default_photo) {
          const photoData = {
            url: (taxon.default_photo.medium_url || taxon.default_photo.url || '').replace('square', 'medium'),
            attribution: taxon.default_photo.attribution || '',
            inatUrl: `https://www.inaturalist.org/taxa/${taxon.id}`
          };
          imageCache[species] = photoData;
          saveImageCache();
          applyImage(img, photoData);
          return;
        }
      }
      showImageFailed(img);
    } catch {
      showImageFailed(img);
    }
  }

  function applyImage(img, photoData) {
    img.onload = () => img.classList.remove('loading');
    img.onerror = () => showImageFailed(img);
    img.src = photoData.url;

    const creditEl = img.parentElement && img.parentElement.querySelector('.img-credit');
    if (creditEl) {
      creditEl.innerHTML = `<a href="${photoData.inatUrl}" target="_blank" rel="noopener" title="${photoData.attribution}">iNaturalist</a>`;
    }
    const attrEl = img.parentElement && img.parentElement.querySelector('.attribution');
    if (attrEl) {
      attrEl.innerHTML = `<a href="${photoData.inatUrl}" target="_blank" rel="noopener">${photoData.attribution}</a>`;
    }
    const imgLink = img.closest('.wildlife-img-link');
    if (imgLink) imgLink.href = photoData.inatUrl;
    const entry = img.closest('.wildlife-entry');
    if (entry) {
      const nameLink = entry.querySelector('.wildlife-species-link');
      if (nameLink) nameLink.href = photoData.inatUrl;
    }
  }

  function showImageFailed(img) {
    img.classList.remove('loading');
    img.alt = 'Photo unavailable';
  }

  function setupImageObserver() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('img[data-species]').forEach(img => queueImageFetch(img));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.species && !img.src) queueImageFetch(img);
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '300px' });
    document.querySelectorAll('img[data-species]').forEach(img => observer.observe(img));
  }

  const CUR_MONTH = new Date().getMonth(); // 0-indexed, actual calendar month
  let plants = [];
  let currentMonth = CUR_MONTH;

  async function init() {
    try {
      const res = await fetch('data/plants.json');
      plants = await res.json();
    } catch (e) {
      document.getElementById('plant-grid').innerHTML =
        '<p style="color:red">Failed to load plant data.</p>';
      return;
    }
    renderInventory();
    renderCalendar();
    renderPhenologyChart();
    renderTrendChart();
    bindEvents();
  }

  // ---- Events ----
  function bindEvents() {
    document.getElementById('plant-search').addEventListener('input', renderInventory);
    document.getElementById('category-filter').addEventListener('change', renderInventory);
    document.getElementById('keystone-filter').addEventListener('change', renderInventory);

    document.querySelectorAll('.month-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentMonth = (currentMonth + parseInt(btn.dataset.dir) + 12) % 12;
        renderCalendar();
      });
    });

    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      const toggleBtt = () => {
        backToTop.classList.toggle('visible', window.scrollY > 600);
      };
      window.addEventListener('scroll', toggleBtt, { passive: true });
      toggleBtt();
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ---- Filtering ----
  function getFilteredPlants() {
    const search = document.getElementById('plant-search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const keystoneOnly = document.getElementById('keystone-filter').checked;

    return plants.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (keystoneOnly && !p.isKeystone) return false;
      if (search) {
        const hay = [p.scientificName, ...p.commonNames, ...(p.synonyms || [])].join(' ').toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  // ============================================================
  // INVENTORY
  // ============================================================
  function renderInventory() {
    const grid = document.getElementById('plant-grid');
    const filtered = getFilteredPlants();
    const grouped = {};
    CATEGORY_ORDER.forEach(c => { grouped[c] = []; });
    filtered.forEach(p => {
      if (grouped[p.category]) grouped[p.category].push(p);
    });
    // Sort within category
    Object.values(grouped).forEach(arr => arr.sort((a, b) => a.commonNames[0].localeCompare(b.commonNames[0])));

    let html = '';
    for (const cat of CATEGORY_ORDER) {
      const list = grouped[cat];
      if (!list.length) continue;
      html += `<div class="category-group">
        <h3 class="category-heading">${CATEGORY_LABELS[cat]}</h3>
        <div class="category-plants">${list.map(plantCard).join('')}</div>
      </div>`;
    }
    if (!html) html = '<p class="cal-empty">No plants match your filters.</p>';
    grid.innerHTML = html;

    grid.querySelectorAll('.plant-card-header').forEach(header => {
      header.addEventListener('click', () => toggleCard(header.closest('.plant-card')));
      header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCard(header.closest('.plant-card')); } });
    });
  }

  function plantCard(p) {
    return `<article class="plant-card" data-id="${p.id}">
      <div class="plant-card-header" tabindex="0" role="button" aria-expanded="false" aria-label="Expand details for ${p.commonNames[0]}">
        <img class="plant-card-img loading" data-species="${p.scientificName}" alt="${p.commonNames[0]}" width="90" height="90">
        <div class="plant-card-info">
          <div class="plant-card-name">${p.commonNames[0]}</div>
          <div class="plant-card-scientific">${p.scientificName}</div>
          <div class="plant-card-meta">
            ${p.isKeystone ? '<span class="badge badge-keystone">★ Keystone</span>' : ''}
            <span class="badge badge-category">${CATEGORY_LABELS[p.category]}</span>
            <span class="badge badge-frequency">${p.iNaturalistData.frequency}</span>
          </div>
        </div>
        <span class="expand-indicator" aria-hidden="true">▼</span>
      </div>
      <div class="plant-detail">${plantDetail(p)}</div>
    </article>`;
  }

  function toggleCard(card) {
    const wasExpanded = card.classList.contains('expanded');
    card.classList.toggle('expanded');
    const header = card.querySelector('.plant-card-header');
    header.setAttribute('aria-expanded', !wasExpanded);

    if (!wasExpanded) {
      // Fetch images for detail section via iNaturalist taxa API
      card.querySelectorAll('.plant-detail img[data-species]').forEach(img => {
        if (!img.src) queueImageFetch(img);
      });
      card.querySelectorAll('.detail-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(card, tab.dataset.tab));
      });
    }
  }

  function switchTab(card, tabName) {
    card.querySelectorAll('.detail-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    card.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === tabName));
  }

  // ---- Plant Detail ----
  function plantDetail(p) {
    return `
      <div class="plant-detail-top">
        <div class="plant-detail-hero">
          <img data-species="${p.scientificName}" alt="${p.commonNames[0]}" class="loading">
          <div class="attribution"></div>
        </div>
        <div class="plant-detail-body">
          <p class="plant-detail-desc">${p.description}</p>
          ${p.synonyms && p.synonyms.length ? `<p style="font-size:.85rem;color:#5a5a5a;margin-bottom:8px"><em>Formerly: ${p.synonyms.join(', ')}</em></p>` : ''}
          <div class="plant-detail-links">
            <a href="${p.calscapeUrl}" target="_blank" rel="noopener">Calscape ↗</a>
            <a href="${p.iNaturalistData.searchUrl}" target="_blank" rel="noopener">iNaturalist ↗</a>
          </div>
          <div class="planting-reqs">
            <div class="planting-req"><strong>Sun</strong>${p.plantingRequirements.sunExposure}</div>
            <div class="planting-req"><strong>Slope / Drainage</strong>${p.plantingRequirements.slopeRequirements}</div>
            <div class="planting-req"><strong>Soil</strong>${p.plantingRequirements.soilRequirements}</div>
          </div>
        </div>
      </div>
      <div class="detail-tabs" role="tablist">
        <button class="detail-tab" data-tab="maintenance" role="tab">Maintenance</button>
        <button class="detail-tab" data-tab="phenology" role="tab">Bloom &amp; Seeds</button>
        <button class="detail-tab active" data-tab="wildlife" role="tab">Wildlife</button>
        <button class="detail-tab" data-tab="observations" role="tab">Observations</button>
      </div>
      <div class="tab-panel" data-tab="maintenance">${maintenanceTab(p)}</div>
      <div class="tab-panel" data-tab="phenology">${phenologyTab(p)}</div>
      <div class="tab-panel active" data-tab="wildlife">${wildlifeTab(p)}</div>
      <div class="tab-panel" data-tab="observations">${observationsTab(p)}</div>`;
  }

  // ---- Maintenance Tab ----
  function maintenanceTab(p) {
    const ws = p.maintenance.wateringSchedule;
    const cells = MONTH_KEYS.map((k, i) => {
      const level = ws[k] || 'none';
      const cur = i === CUR_MONTH ? ' water-current' : '';
      return `<div class="water-cell water-${level}${cur}"><span class="month-label">${MONTHS[i]}</span>${WATER_LABELS[level]}</div>`;
    }).join('');

    return `
      <h5 style="font-size:.85rem;margin-bottom:8px;color:#6b4c3b">Watering Schedule</h5>
      <div class="watering-grid">${cells}</div>
      <div class="maintenance-notes">
        <p><strong>Watering:</strong> ${p.maintenance.wateringNotes}</p>
        <p><strong>Pruning:</strong> ${p.maintenance.pruningNotes}</p>
        ${p.maintenance.specialNotes ? `<p><strong>Notes:</strong> ${p.maintenance.specialNotes}</p>` : ''}
      </div>`;
  }

  // ---- Phenology Tab ----
  function phenologyTab(p) {
    const ph = p.phenology;
    const bloomSet = new Set(ph.bloom ? ph.bloom.months : []);
    const berrySet = new Set(ph.berry ? ph.berry.months : []);
    const seedSet = new Set(ph.seed ? ph.seed.months : []);

    const cells = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      let cls = 'phenology-empty';
      if (bloomSet.has(m)) cls = 'phenology-bloom';
      else if (berrySet.has(m)) cls = 'phenology-berry';
      else if (seedSet.has(m)) cls = 'phenology-seed';
      if (i === CUR_MONTH) cls += ' pheno-current';
      return `<div class="pheno-month ${cls}"><span class="pheno-label">${MONTHS[i]}</span></div>`;
    }).join('');

    let colors = '';
    if (ph.bloom && ph.bloom.colors) {
      colors = `<div class="bloom-colors">${ph.bloom.colors.map(c =>
        `<span class="color-swatch"><span class="color-dot" style="background:${COLOR_MAP[c] || c}"></span>${c}</span>`
      ).join('')}</div>`;
    }

    return `
      <div class="phenology-legend">
        <span class="phenology-legend-item"><span class="legend-swatch" style="background:var(--c-sage-light)"></span>Bloom</span>
        <span class="phenology-legend-item"><span class="legend-swatch" style="background:var(--c-terracotta)"></span>Berry / Fruit</span>
        <span class="phenology-legend-item"><span class="legend-swatch" style="background:var(--c-oak);opacity:.7"></span>Seed</span>
      </div>
      <div class="phenology-row">${cells}</div>
      ${colors}
      ${ph.berry ? `<p style="font-size:.85rem;margin-top:4px"><strong>Berry/Fruit:</strong> ${ph.berry.description || ''}</p>` : ''}
      ${ph.seed ? `<p style="font-size:.85rem;margin-top:4px"><strong>Seed:</strong> ${ph.seed.description || ''}</p>` : ''}
      <div class="phenology-eco">${ph.ecologicalValue}</div>`;
  }

  // ---- Wildlife Tab ----
  function wildlifeTab(p) {
    if (!p.wildlife || !p.wildlife.length) return '<p class="cal-empty">No wildlife data.</p>';

    return p.wildlife.map(w => {
      const monthSet = new Set(w.months);
      const cells = Array.from({ length: 12 }, (_, i) => {
        let cls = monthSet.has(i + 1) ? 'wl-month-active' : 'wl-month-inactive';
        if (i === CUR_MONTH) cls += ' wl-month-current';
        return `<div class="wl-month ${cls}"><span class="wl-month-label">${MONTHS[i]}</span></div>`;
      }).join('');

      const imgHtml = `<a class="wildlife-img-link" target="_blank" rel="noopener"><img class="wildlife-img loading" data-species="${escapeAttr(w.species)}" alt="${escapeAttr(w.species)}" width="60" height="60"></a>`;

      return `<div class="wildlife-entry">
        ${imgHtml}
        <div class="wildlife-info">
          <a class="wildlife-species wildlife-species-link" target="_blank" rel="noopener">${w.species}</a>
          <div class="wildlife-activity">${ACTIVITY_LABELS[w.activity] || w.activity}</div>
          <div class="wildlife-months">${cells}</div>
          ${w.notes ? `<div class="wildlife-notes">${w.notes}</div>` : ''}
          <div class="attribution" style="font-size:.68rem;margin-top:2px"></div>
        </div>
      </div>`;
    }).join('');
  }

  // ---- Observations Tab ----
  function observationsTab(p) {
    const obs = p.iNaturalistData;
    const byMonth = obs.observationsByMonth;
    const byYear = obs.observationsByYear;
    const maxMonth = Math.max(...Object.values(byMonth), 1);
    const maxYear = Math.max(...Object.values(byYear), 1);

    const histogram = MONTH_KEYS.map((k, i) => {
      const v = byMonth[k] || 0;
      const pct = (v / maxMonth * 100).toFixed(0);
      return `<div class="obs-bar-wrap">
        <span class="obs-bar-value">${v}</span>
        <div class="obs-bar" style="height:${pct}%"></div>
        <span class="obs-bar-label">${MONTHS[i]}</span>
      </div>`;
    }).join('');

    const years = Object.keys(byYear).sort();
    const trend = years.map(y => {
      const v = byYear[y];
      const pct = (v / maxYear * 100).toFixed(0);
      return `<div class="obs-trend-bar-wrap">
        <span class="obs-trend-value">${v}</span>
        <div class="obs-trend-bar" style="height:${pct}%"></div>
        <span class="obs-trend-label">${y}</span>
      </div>`;
    }).join('');

    const trendDir = years.length >= 2
      ? (byYear[years[years.length - 1]] > byYear[years[0]] ? '↑ Increasing' : byYear[years[years.length - 1]] < byYear[years[0]] ? '↓ Decreasing' : '→ Stable')
      : '';

    return `
      <p class="obs-total"><strong>${obs.totalObservations}</strong> total observations (5-year) · <strong>${obs.frequency}</strong> in Poway ${trendDir ? `· <strong>${trendDir}</strong>` : ''}</p>
      <h5 style="font-size:.85rem;margin-bottom:8px;color:#6b4c3b">Monthly Observations</h5>
      <div class="obs-histogram">${histogram}</div>
      <h5 style="font-size:.85rem;margin:16px 0 8px;color:#6b4c3b">Year-over-Year Trend</h5>
      <div class="obs-trend">${trend}</div>
      <p style="font-size:.75rem;color:#5a5a5a;margin-top:8px">Data from <a href="${obs.searchUrl}" target="_blank" rel="noopener">iNaturalist</a> · Last updated: ${obs.lastUpdated}</p>`;
  }

  // ============================================================
  // GARDEN CALENDAR
  // ============================================================
  function renderCalendar() {
    const m = currentMonth + 1; // 1-indexed
    const mk = MONTH_KEYS[currentMonth];
    document.getElementById('calendar-month-label').textContent = MONTHS[currentMonth] + ' — What\'s Happening';

    // Blooming
    const blooming = plants.filter(p => p.phenology.bloom && p.phenology.bloom.months.includes(m));
    const bloomList = document.getElementById('cal-bloom-list');
    bloomList.innerHTML = blooming.length
      ? blooming.map(p => {
          const colors = p.phenology.bloom.colors.map(c => `<span class="color-dot" style="background:${COLOR_MAP[c]||c};width:8px;height:8px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.15)"></span>`).join(' ');
          return `<li><span class="cal-plant-name">${p.commonNames[0]}</span> ${colors}</li>`;
        }).join('')
      : '<li class="cal-empty">Nothing blooming this month</li>';

    // Wildlife
    const wildlifeItems = [];
    plants.forEach(p => {
      p.wildlife.forEach(w => {
        if (w.months.includes(m)) {
          wildlifeItems.push({ plant: p.commonNames[0], species: w.species, activity: ACTIVITY_LABELS[w.activity] || w.activity });
        }
      });
    });
    const wildlifeList = document.getElementById('cal-wildlife-list');
    wildlifeList.innerHTML = wildlifeItems.length
      ? wildlifeItems.slice(0, 10).map(w => `<li><span class="cal-plant-name">${w.species}</span><br><span class="cal-detail">${w.activity} · ${w.plant}</span></li>`).join('')
        + (wildlifeItems.length > 10 ? `<li class="cal-detail">…and ${wildlifeItems.length - 10} more</li>` : '')
      : '<li class="cal-empty">No wildlife activity this month</li>';

    // Maintenance
    const maintItems = plants.filter(p => {
      const level = p.maintenance.wateringSchedule[mk];
      return level && level !== 'none';
    });
    const maintList = document.getElementById('cal-maintenance-list');
    maintList.innerHTML = maintItems.length
      ? maintItems.map(p => {
          const level = p.maintenance.wateringSchedule[mk];
          return `<li><span class="cal-plant-name">${p.commonNames[0]}</span><br><span class="cal-detail">Water: ${level}</span></li>`;
        }).join('')
      : '<li class="cal-empty">No watering needed — let nature do its thing!</li>';

    // Observations
    const obsItems = plants
      .map(p => ({ name: p.commonNames[0], count: p.iNaturalistData.observationsByMonth[mk] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const obsList = document.getElementById('cal-observations-list');
    obsList.innerHTML = obsItems.filter(o => o.count > 0).length
      ? obsItems.filter(o => o.count > 0).map(o => `<li><span class="cal-plant-name">${o.name}</span><br><span class="cal-detail">${o.count} observations</span></li>`).join('')
      : '<li class="cal-empty">Low observation activity this month</li>';
  }

  // ============================================================
  // PHENOLOGY CHART (garden-wide)
  // ============================================================
  function renderPhenologyChart() {
    const container = document.getElementById('phenology-chart');
    const sorted = [...plants].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      return ai !== bi ? ai - bi : a.commonNames[0].localeCompare(b.commonNames[0]);
    });

    let rows = sorted.map(p => {
      const ph = p.phenology;
      const bloomSet = new Set(ph.bloom ? ph.bloom.months : []);
      const berrySet = new Set(ph.berry ? ph.berry.months : []);
      const seedSet = new Set(ph.seed ? ph.seed.months : []);

      const cells = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        let cls = 'phenology-empty';
        if (bloomSet.has(m)) cls = 'phenology-bloom';
        else if (berrySet.has(m)) cls = 'phenology-berry';
        else if (seedSet.has(m)) cls = 'phenology-seed';
        const cur = i === CUR_MONTH ? ' current-month' : '';
        return `<td class="${cur}"><div class="pheno-cell ${cls}"></div></td>`;
      }).join('');

      return `<tr><td>${p.commonNames[0]}</td>${cells}</tr>`;
    }).join('');

    container.innerHTML = `
      <div class="phenology-legend" style="margin-bottom:12px">
        <span class="phenology-legend-item"><span class="legend-swatch" style="background:var(--c-sage-light)"></span>Bloom</span>
        <span class="phenology-legend-item"><span class="legend-swatch" style="background:var(--c-terracotta)"></span>Berry / Fruit</span>
        <span class="phenology-legend-item"><span class="legend-swatch" style="background:var(--c-oak);opacity:.7"></span>Seed</span>
      </div>
      <table>
        <thead><tr><th>Plant</th>${MONTHS.map((m, i) => `<th class="${i === CUR_MONTH ? 'current-month' : ''}">${m}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  // ============================================================
  // TREND CHART (garden-wide) — SVG sparklines
  // ============================================================
  function renderTrendChart() {
    const container = document.getElementById('trend-chart');
    const years = [...new Set(plants.flatMap(p => Object.keys(p.iNaturalistData.observationsByYear)))].sort();
    if (!years.length) { container.innerHTML = ''; return; }

    const sorted = [...plants].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      return ai !== bi ? ai - bi : a.commonNames[0].localeCompare(b.commonNames[0]);
    });

    const cards = sorted.map(p => {
      const byYear = p.iNaturalistData.observationsByYear;
      const values = years.map(y => byYear[y] || 0);
      const max = Math.max(...values, 1);
      const min = Math.min(...values);
      const first = values[0];
      const last = values[values.length - 1];
      const trendDir = last > first ? 'up' : last < first ? 'down' : 'flat';
      const trendLabel = trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→';
      const trendClass = trendDir === 'up' ? 'trend-up' : trendDir === 'down' ? 'trend-down' : 'trend-flat';

      const w = 120, h = 40, pad = 2;
      const stepX = (w - pad * 2) / Math.max(values.length - 1, 1);
      const points = values.map((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (h - pad * 2) - ((v - min) / (max - min || 1)) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      const polyline = points.join(' ');

      // Filled area under the line
      const areaPoints = `${pad},${h - pad} ${polyline} ${(pad + (values.length - 1) * stepX).toFixed(1)},${h - pad}`;

      const dots = values.map((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (h - pad * 2) - ((v - min) / (max - min || 1)) * (h - pad * 2);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="var(--c-sky)" stroke="var(--c-white)" stroke-width="1"/>`;
      }).join('');

      const yearLabels = years.map((y, i) => {
        const x = pad + i * stepX;
        return `<text x="${x.toFixed(1)}" y="${h + 10}" text-anchor="middle" font-size="8" fill="var(--c-text-light)">${y.slice(2)}</text>`;
      }).join('');

      const valueLabels = values.map((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (h - pad * 2) - ((v - min) / (max - min || 1)) * (h - pad * 2);
        return `<text x="${x.toFixed(1)}" y="${Math.max(y - 5, 8).toFixed(1)}" text-anchor="middle" font-size="7.5" font-weight="600" fill="var(--c-text)">${v}</text>`;
      }).join('');

      return `<div class="trend-card">
        <div class="trend-card-header">
          <span class="trend-card-name">${p.commonNames[0]}</span>
          <span class="trend-badge ${trendClass}">${trendLabel} ${last}</span>
        </div>
        <svg class="trend-sparkline" viewBox="0 0 ${w} ${h + 14}" width="${w}" height="${h + 14}" aria-label="Observation trend for ${p.commonNames[0]}">
          <polygon points="${areaPoints}" fill="var(--c-sky)" opacity="0.15"/>
          <polyline points="${polyline}" fill="none" stroke="var(--c-sky)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          ${dots}
          ${valueLabels}
          ${yearLabels}
        </svg>
      </div>`;
    }).join('');

    container.innerHTML = `<div class="trend-grid">${cards}</div>`;
  }

  // Override renderInventory to set up image observer after each render
  const _origRender = renderInventory;
  renderInventory = function () {
    _origRender.apply(this, arguments);
    setupImageObserver();
  };

  // ---- Go ----
  document.addEventListener('DOMContentLoaded', init);
})();
