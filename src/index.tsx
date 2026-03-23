import {
  createComponent,
  createIntegration,
  FetchEventCallback,
} from "@gitbook/runtime";
import { buildHtml } from "./html";
import { App, GitBookPage, SpaceData, PagesData } from "./types";

// Recursively flattens nested GitBook pages into a single array

const flattenPages = (pages: GitBookPage[]): GitBookPage[] =>
  pages.flatMap((p) => [p, ...flattenPages(p.pages ?? [])]);

// Converts a GitBook page into an app card object using its tags and variables
const pageToApp = (page: GitBookPage, publishedBase: string): App => {
  const vars = page.variables ?? {};
  const tags = (page.tags ?? []).map((t) => t.tag.tag);
  const category =
    tags.find((t) => !["stable", "beta", "verified"].includes(t)) ?? "Other";
  return {
    name: page.title ?? "Untitled",
    description: page.description ?? "",
    version: vars.version ?? "",
    publisher: vars.publisher ?? "",
    requiredProduct: vars.requiredProduct ?? "",
    supportedVersions: vars.supportedVersions
      ? vars.supportedVersions.split(",").map((v) => v.trim())
      : [],
    category: category.charAt(0).toUpperCase() + category.slice(1),
    status: tags.includes("beta") ? "Beta" : "Stable",
    verified: tags.includes("verified"),
    price: parseInt(vars.price ?? "0", 10),
    icon: page.icon ?? null,
    pageUrl:
      publishedBase && page.path
        ? `${publishedBase}${page.path}`
        : (page.urls?.app ?? ""),
    editorUrl: page.urls?.app ?? "",
  };
};

// Serves the iframe HTML when the webframe requests it, with app data passed via URL param
const handleFetch: FetchEventCallback = async (request) => {
  const url = new URL(request.url);
  if (!url.pathname.endsWith("/iframe.html"))
    return new Response("Not found", { status: 404 });

  let apps: App[] = [];
  const dataParam = url.searchParams.get("data");
  if (dataParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(dataParam));
      if (parsed.length > 0) apps = parsed;
    } catch (err) {
      console.error("Failed to parse app data from URL param:", err);
    }
  }

  return new Response(buildHtml(apps), {
    headers: {
      "Content-Type": "text/html",
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy": "frame-ancestors *",
    },
  });
};

// The main block component — fetches all pages in the space, maps them to app cards, and renders the webframe
const appCatalogueBlock = createComponent({
  componentId: "mo-app-catalogue",
  render: async (element, context) => {
    const base =
      context.environment.installation?.urls.publicEndpoint ??
      context.environment.integration.urls.publicEndpoint;
    const spaceId = context.environment.spaceInstallation?.space;
    const { apiEndpoint, apiTokens } = context.environment;
    const authHeaders = { Authorization: `Bearer ${apiTokens.installation}` };

    let apps: App[] = [];

    if (spaceId) {
      try {
        const [spaceRes, pagesRes] = await Promise.all([
          fetch(`${apiEndpoint}/v1/spaces/${spaceId}`, {
            headers: authHeaders,
          }),
          fetch(`${apiEndpoint}/v1/spaces/${spaceId}/content/pages`, {
            headers: authHeaders,
          }),
        ]);
        const spaceData = (await spaceRes.json()) as SpaceData;
        const pagesData = (await pagesRes.json()) as PagesData;
        const publishedBase = spaceData.urls?.published ?? "";
        apps = flattenPages(pagesData.pages ?? [])
          .filter(
            (page) => page.variables && Object.keys(page.variables).length > 0,
          )
          .map((page) => pageToApp(page, publishedBase));
      } catch (err) {
        console.error("Failed to fetch space data from GitBook API:", err);
      }
    }

    const iframeUrl = `${base}/iframe.html?v=3&data=${encodeURIComponent(JSON.stringify(apps))}`;
    return (
      <block>
        <webframe source={{ url: iframeUrl }} aspectRatio={16 / 9} />
      </block>
    );
  },
});

export default createIntegration({
  fetch: handleFetch,
  components: [appCatalogueBlock],
});
