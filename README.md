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
git clone https://github.com/msinta/gitbook-app-catalogue
cd gitbook-app-catalogue
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
- **UI polish** — skeleton loader while data fetches so there's never a blank block, empty state with a clear message when no results match, result count showing "Showing X of Y apps" when filters are active, uniform card heights so the grid always looks consistent regardless of how much text each card has, and a responsive layout that adapts to the available width.

### Extra features beyond the brief
- **Internal admin guide** — a hidden page inside the space walks editors through how to add a new app, including duplicating an existing page, updating the content, setting variables, and assigning tags. It lives in a separate hidden group so it never shows up for readers on the published site.
- **Dark mode** — automatically matches the reader's system preference
- **Dynamic category filter** — the category dropdown is built from the tags that exist in the space, so new categories appear automatically without any code changes
- **Verified badge** — apps with the verified tag show a gold badge on their card
- **Page icons as avatars** — uses the GitBook page icon as the card avatar, with a colored letter fallback
- **Git Sync content workflow** — the space is connected to a dedicated content repo so editors can manage app metadata through frontmatter instead of the UI

## How it works

ContentKit doesn't support dynamic array rendering or client-side filtering, so the catalog UI is a self-contained HTML page served via a fetch handler and loaded inside a `webframe` block.

At render time the block calls the GitBook API, pulls all pages in the space, and maps each page's metadata into a card:

| Source | Fields |
|---|---|
| Page title + description | Card name and subtitle |
| Page icon | Avatar |
| Page tags | Category, Stable/Beta status, Verified badge |
| Page variables | version, price, publisher, requiredProduct, supportedVersions |

The iframe sends its content height back via `@webframe.resize` postMessage actions so the block always fits its content without scrollbars.

## Decisions and trade-offs

**Webframe over ContentKit components**
ContentKit is great for structured UI like buttons, inputs, and static layouts, but it doesn't support rendering a dynamic list of items from an array or any kind of client-side interactivity like search and filtering. Every re-render goes through the server, which makes real-time filtering impossible. A webframe lets you serve a fully self-contained HTML page instead, which is how we get a responsive card grid, live search, and instant filter updates without a round trip on every keystroke.

**Dynamic URLs for editor vs published site**
Because the UI lives inside a webframe rather than ContentKit, we don't get GitBook's built-in link handling. So we detect the context manually by checking `window.location.ancestorOrigins` to see if the parent frame is `app.gitbook.com`. If it is, the View Details button uses the editor URL so you land on the right page inside the GitBook app. If it's the published site, it uses the public URL instead. Small thing but it means the block works correctly in both contexts without any extra configuration.

**Page variables and tags as the data source**
All metadata lives directly on GitBook pages. Tags handle category, status, and verified. Variables handle the numeric and text fields. No external database needed and editors stay fully in control.


**Separate content and integration repos**
The integration code and the space content live in separate repos. Cleaner to maintain and closer to how a real deployment would be set up.

## What I'd build next

**In-space app submission form**
Right now adding a new app means creating a page, setting variables, assigning tags, and committing frontmatter. That's too much for a non-technical editor. A ContentKit form embedded in the space would let editors fill in the fields and hit submit, with the integration handling page creation, variables, and tags automatically via the API. No GitHub, no frontmatter, no code.

**Resilient fallback with cached data**
If the API call fails at render time the block shows nothing. A better approach would be to cache the last successful response in GitBook's installation config and serve that as a fallback, so the catalog always has something to show even during an outage.

**Sorting options**
Let readers sort by price, name, or newest.

## Project structure

```
src/
├── index.tsx   — Block component, fetch handler, API data fetching
├── html.ts     — Iframe HTML, CSS, and client-side JS
gitbook-manifest.yaml
README.md
```
