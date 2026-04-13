# SD Habitat — Native Garden Guide

**[View the Guide](https://chetanddesai.github.io/sd-habitat)**

A GitHub Pages site providing a living reference for a native habitat garden in Poway, CA — plant inventory, bloom calendars, wildlife schedules, and maintenance guides for 17 California native plants in the coastal sage scrub ecosystem.

## Features

- **Plant Inventory** — 17 California native plants organized by category (trees, shrubs, groundcover) with images, descriptions, keystone species indicators, planting requirements, and links to Calscape and iNaturalist
- **Maintenance Schedule** — month-by-month watering frequency (1×/month, 2×/month) and pruning tasks with short actionable descriptions for each plant
- **Bloom, Berry & Seed Calendar** — phenology timelines showing actual botanical colors (flower, fruit, and seed) across the garden, with the current month highlighted
- **Wildlife Schedule** — specific named species (birds, butterflies, moths, lizards) to look for each month and what they're doing on each plant
- **Garden Calendar** — a "what's happening this month" dashboard with wildlife classified as Common / Uncommon / Rare using live iNaturalist observation data, plus a two-column maintenance view (watering frequencies and pruning tasks)
- **Observation Trends** — SVG sparkline cards showing year-over-year iNaturalist citizen-science sighting trends for each plant in the Poway area

## Tech Stack

- Static HTML, CSS, and vanilla JavaScript — no frameworks, no build step
- Hosted on [GitHub Pages](https://pages.github.com/)
- Plant and wildlife data stored in JSON (`data/plants.json`)
- Images fetched at runtime from the [iNaturalist](https://www.inaturalist.org/) taxa API (Creative Commons licensed) and cached in localStorage
- All iNaturalist observation data (plant and wildlife) fetched at runtime from the histogram API, cached in localStorage with a 7-day TTL
- Footer "Refresh Data" button to force-clear caches and re-fetch

## Local Development

Serve the repo root with any static file server:

```bash
npx http-server . -p 8090 -c-1
```

Then open [http://localhost:8090](http://localhost:8090). The `-c-1` flag disables caching so edits are reflected immediately.

## Documentation

- [Product Requirements Document](docs/PRD.md)

## License

This project is licensed under [CC BY-NC-SA 4.0](LICENSE.md). Plant and wildlife images are sourced from iNaturalist under their respective Creative Commons licenses.
