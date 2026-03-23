import {
  createComponent,
  createIntegration,
  FetchEventCallback,
} from "@gitbook/runtime";
import { buildHtml } from "./html";

const flattenPages = (pages: any[]): any[] => {
  const result = [];
  const queue = [...pages];
  while (queue.length > 0) {
    const page = queue.shift();
    result.push(page);
    if (page.pages?.length > 0) queue.push(...page.pages);
  }
  return result;
};

const pageToApp = (page: any, publishedBase: string) => {
  const vars = page.variables ?? {};
  const tagSlugs: string[] = (page.tags ?? []).map((t: any) => t.tag.tag);
  const categoryTag = tagSlugs.find(
    (t) => !["stable", "beta", "verified"].includes(t),
  );
  const category = categoryTag ?? "Other";
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const status = tagSlugs.includes("beta") ? "Beta" : "Stable";
  const verified = tagSlugs.includes("verified");
  const price = parseInt(vars.price ?? "0", 10);
  const supportedVersions = vars.supportedVersions
    ? vars.supportedVersions.split(",").map((v: string) => v.trim())
    : [];
  const pageUrl =
    publishedBase && page.path
      ? `${publishedBase}${page.path}`
      : (page.urls?.app ?? "");

  return {
    name: page.title ?? "Untitled",
    description: page.description ?? "",
    version: vars.version ?? "",
    publisher: vars.publisher ?? "",
    requiredProduct: vars.requiredProduct ?? "",
    supportedVersions,
    category: categoryLabel,
    status,
    verified,
    price,
    icon: page.icon ?? null,
    pageUrl,
    editorUrl: page.urls?.app ?? "",
  };
};

const handleFetch: FetchEventCallback = async (request) => {
  const url = new URL(request.url);

  if (!url.pathname.endsWith("/iframe.html")) {
    return new Response("Not found", { status: 404 });
  }

  let apps: any[] = [];

  const dataParam = url.searchParams.get("data");
  if (dataParam) {
    try {
      const parsed = JSON.parse(decodeURIComponent(dataParam));
      if (parsed.length > 0) apps = parsed;
    } catch {}
  }

  return new Response(buildHtml(apps), {
    headers: {
      "Content-Type": "text/html",
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy": "frame-ancestors *",
    },
  });
};

const appCatalogueBlock = createComponent({
  componentId: "mo-app-catalogue",
  render: async (element, context) => {
    const base =
      context.environment.installation?.urls.publicEndpoint ??
      context.environment.integration.urls.publicEndpoint;

    const spaceId = context.environment.spaceInstallation?.space;
    const { apiEndpoint, apiTokens } = context.environment;
    const authHeaders = { Authorization: `Bearer ${apiTokens.installation}` };

    let apps: any[] = [];

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

        const spaceData = (await spaceRes.json()) as {
          urls?: { published?: string };
        };
        const pagesData = (await pagesRes.json()) as { pages?: any[] };

        const publishedBase = spaceData.urls?.published ?? "";
        const allPages = flattenPages(pagesData.pages ?? []);

        apps = allPages
          .filter(
            (page: any) =>
              page.variables && Object.keys(page.variables).length > 0,
          )
          .map((page: any) => pageToApp(page, publishedBase));
      } catch {}
    }

    const iframeUrl = `${base}/iframe.html?data=${encodeURIComponent(JSON.stringify(apps))}`;

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
