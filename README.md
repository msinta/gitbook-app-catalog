# App Catalog — GitBook Integration

A custom GitBook block that renders a searchable, filterable app catalog inside any GitBook space. Each card is backed by a real GitBook page, so editors can add, update, or remove apps without touching any code.

**Live demo:** https://mohamedseproject.gitbook.io/mohamedseproject-docs

**Content repo:** https://github.com/msinta/mo-app-catalog-content

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

> Note: Changes to the fetch handler (iframe HTML) require `gitbook publish` to reflect on the published site. They won't hot-reload with `gitbook dev`.

## Features

### Core
- Card grid showing each app with name, description, publisher, version, price, category, and status
- Real-time search by app name or description
- Category and price range filters
- Works as a custom block inside any GitBook space

### Stretch goals completed
- **Live data from GitBook** — cards are powered by real GitBook pages. Title, description, icon, tags, and variables all feed into the card. Add a new page and it shows up in the catalog automatically.

- **App detail view** — each card has a View Details button that navigates to the app's page. It detects whether you're in the editor or on the published site and uses the right URL, so the link always takes you to the right place regardless of context.

- **UI polish** — skeleton loader while data fetches so there's never a blank block, empty state with a clear message when no results match, result count showing "Showing X of Y apps" when filters are active, uniform card heights so the grid always looks consistent.

### Extra features beyond the brief
- **Internal admin guide** — a hidden page inside the space walks editors through how to add a new app, including duplicating an existing page, updating the content, setting variables, and assigning tags. It lives in a separate hidden group so it never shows up for readers on the published site.
- **Dark mode** — automatically matches the reader's system preference
- **Dynamic category filter** — the category dropdown is built from the tags that exist in the space, so new categories appear automatically without any code changes
- **Verified badge** — apps with the verified tag show a gold badge on their card
- **Page icons as avatars** — uses the GitBook page icon as the card avatar, with a colored letter fallback
- **Git Sync content workflow** — the space is connected to a dedicated content repo so editors can manage app metadata through frontmatter instead of the UI

## How it works

The goal was to make the catalog feel like a native part of the docs — fast, responsive, and seamless for the reader with no visible seams between the integration and the rest of the page.

When the block renders, it fetches all pages in the space via the GitBook API and builds each app card from the page's own metadata. The card data maps like this:

| Source | Fields |
|---|---|
| Page title + description | Card name and subtitle |
| Page icon | Avatar |
| Page tags | Category, Stable/Beta status, Verified badge |
| Page variables | version, price, publisher, requiredProduct, supportedVersions |

That data gets passed to a self-contained HTML page served via a fetch handler and rendered inside a webframe block. All the search, filtering, and layout happens client-side inside that iframe. The iframe also sends its height back to GitBook via postMessage so the block always resizes to fit the content.

## Decisions and trade-offs

1. **Webframe over ContentKit components** — ContentKit's layout and styling capabilities are pretty limited for a use case like this. Getting client-side filtering to work smoothly without server round trips on every keystroke wasn't really possible natively, and the responsive grid layout hit similar walls. A webframe with a self-contained HTML page gives a better end-user experience and is completely opaque to the reader anyway.

2. **Dynamic URLs for editor vs published site** — Using a webframe means we lose GitBook's built-in link handling. To work around this we check `window.location.ancestorOrigins` to detect whether the reader is inside the GitBook editor or on the published site, then use the appropriate URL for the View Details button. It means the block works correctly in both contexts without any extra configuration.

3. **Page variables and tags as the data source** — All metadata lives directly on GitBook pages. Tags handle category, status, and verified. Variables handle the numeric and text fields. No external database needed and editors stay fully in control.

4. **Separate content and integration repos** — The integration code and the space content live in separate repos. Cleaner to maintain and closer to how a real deployment would be set up.

## What I'd build next

1. **In-space app submission form** — Right now adding a new app means creating a page, setting variables, assigning tags, and committing frontmatter. That's too much for a non-technical editor. A ContentKit form embedded in the space would let editors fill in the fields and hit submit, with the integration handling page creation, variables, and tags automatically via the API. No GitHub, no frontmatter, no code.

2. **Resilient fallback with cached data** — If the API call fails at render time the block shows nothing. A better approach would be to cache the last successful response in GitBook's installation config and serve that as a fallback, so the catalog always has something to show even during an outage.

3. **Sorting options** — Let readers sort by price, name, or newest.

## Project structure

```
src/
├── index.tsx   — Block component, fetch handler, API data fetching
├── html.ts     — Iframe HTML, CSS, and client-side JS
gitbook-manifest.yaml
README.md
```
