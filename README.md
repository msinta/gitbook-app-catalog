# App Catalogue — GitBook Integration

A custom GitBook block that renders a searchable, filterable app catalogue inside any GitBook space. Each app card is powered by a real GitBook page — editors manage content directly in GitBook with no code changes required to add, update, or remove apps.

**Live demo:** https://mohamedseproject.gitbook.io/mohamedseproject-docs

---

## Running locally

### Prerequisites
- Node.js 18+
- GitBook CLI: `npm install -g @gitbook/cli`
- A GitBook account with a personal access token

### Setup

```bash
git clone https://github.com/msinta/gitbook-app-catalog
cd gitbook-app-catalog
npm install
gitbook dev
```

> Note: Changes to the fetch handler (iframe HTML) require `gitbook publish` to reflect on the published site — they won't hot-reload with `gitbook dev`.

---

## Features

### Core
- Card grid layout showing each app with name, description, publisher, version, price, category, and status
- Real-time search filtering by app name or description
- Category and price range filter controls
- Working integration scaffold that loads as a custom block in any GitBook space

### Stretch goals completed
- **Live data from GitBook space** — app cards are fully powered by real GitBook pages. Page title, description, icon, tags, and variables all drive the card content. Editors add new apps by creating a page — no code changes needed.
- **App detail view** — each card has a View Details button that navigates to the app's GitBook page. It detects whether the reader is on the published site or inside the editor and uses the appropriate URL.
- **UI polish** — skeleton loader while data fetches, empty state when no results match, responsive grid layout, and clear filter UX with a result count when filters are active.

### Additional features beyond the brief
- **Dark mode** — full dark mode support via CSS custom properties, automatically matches the reader's system preference
- **Verified badge** — apps tagged as verified display a gold badge on their card
- **Page icons as avatars** — uses the GitBook page icon as the card avatar, with a colored letter fallback
- **Git Sync content workflow** — the GitBook space is connected to a dedicated content repo, allowing editors to manage app metadata via frontmatter commits rather than manual UI updates

---

## How it works

ContentKit — GitBook's component system — doesn't support dynamic array rendering or client-side interactivity, so the catalogue UI is a self-contained HTML page served via a fetch handler and rendered inside a `webframe` block.

At render time, the block fetches all pages in the space via the GitBook API and maps each page's metadata into an app card:

| Source | Fields |
|---|---|
| Page title + description | Card name and subtitle |
| Page icon | Avatar |
| Page tags | Category, `Stable`/`Beta` status, `Verified` badge |
| Page variables | `version`, `price`, `publisher`, `requiredProduct`, `supportedVersions` |

The iframe communicates its content height back to GitBook via `@webframe.resize` postMessage actions so the block always fits its content without scrollbars.

---

## Decisions and trade-offs

**Webframe over ContentKit components**
ContentKit can't handle dynamic arrays or client-side filtering. A webframe is GitBook's documented escape hatch for layout-heavy use cases and gives full control over the UI.

**Page variables and tags as the data source**
All structured metadata lives directly on GitBook pages. Tags drive category, status, and verified state. Variables hold numeric and text fields. This keeps the integration stateless and editors fully in control — no external database or CMS needed.

**Separate content and integration repos**
The integration code and the GitBook space content live in separate repos. This keeps the codebase clean and reflects how a real deployment would be structured.
Link here https://github.com/msinta/mo-app-catalog-content
---

## What I'd build next

**In-space app submission form**
The biggest friction point in the current implementation is adding a new app — it requires creating a page, manually setting variables, assigning tags, and committing frontmatter. For a non-technical editor this is too much. The most impactful next step would be a ContentKit-powered form embedded directly in the space that lets editors fill in fields (name, description, price, category etc.) and submit — with the integration automatically creating the page, setting the variables, and assigning the correct tags via the GitBook API behind the scenes. No GitHub, no frontmatter, no code.

**Resilient fallback with cached data**
Currently if the GitBook API call fails at render time, the block renders empty. A better approach would be to persist the last successful dataset using GitBook's installation configuration, so the block always has something to render even during an outage or cold start. This gives editors and readers a consistent experience regardless of API availability.

**Sorting options**
Allow readers to sort cards by price, name, or newest added.


## Project structure

```
src/
├── index.tsx   — Block component, fetch handler, GitBook API data fetching
├── html.ts     — Iframe HTML, CSS, and client-side JS
gitbook-manifest.yaml
README.md
```
