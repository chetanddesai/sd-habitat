# SD Habitat

A static website showcasing a native habitat garden in Poway, CA — built for GitHub Pages.

The site serves as a living reference for the garden's **plant inventory**, **maintenance calendar**, **bloom/berry/seed phenology**, and the **wildlife** each plant supports throughout the year. All content is data-driven (JSON-backed) so that adding or editing plants requires no code changes.

## Features

- **Plant Inventory** — 16 California native plants organized by category (trees, shrubs, groundcover) with images, descriptions, keystone species indicators, planting requirements, and links to Calscape and iNaturalist
- **Maintenance Schedule** — month-by-month watering, pruning, and care tasks for each plant
- **Bloom, Berry & Seed Calendar** — color-coded phenology timelines showing what's flowering, fruiting, and seeding across the garden
- **Wildlife Schedule** — which birds, butterflies, bees, and other wildlife to expect each month and what they're doing
- **Garden Calendar** — a garden-wide "what's happening this month" dashboard combining bloom, wildlife, maintenance, and iNaturalist citizen-science observation data
- **iNaturalist Integration** — monthly observation histograms and year-over-year trends sourced from citizen-science data for the Poway area

## Tech Stack

- Static HTML, CSS, and vanilla JavaScript — hosted on GitHub Pages
- Plant and wildlife data stored in JSON (`data/plants.json`)
- Images hotlinked from iNaturalist (Creative Commons licensed)
- Helper script to refresh iNaturalist observation counts (`scripts/update-observations.js`)

## Documentation

- [Product Requirements Document](docs/PRD.md)
