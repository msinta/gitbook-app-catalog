interface PageTag {
  tag: { kind: string; tag: string };
  primary?: boolean;
}
interface PageVariables {
  version?: string;
  price?: string;
  publisher?: string;
  requiredProduct?: string;
  supportedVersions?: string;
}
export interface GitBookPage {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  path?: string;
  variables?: PageVariables;
  tags?: PageTag[];
  pages?: GitBookPage[];
  urls?: { app: string };
}
export interface SpaceData {
  urls?: { published?: string };
}
export interface PagesData {
  pages?: GitBookPage[];
}

export interface App {
  name: string;
  description: string;
  version: string;
  publisher: string;
  requiredProduct: string;
  supportedVersions: string[];
  category: string;
  status: string;
  verified: boolean;
  price: number;
  icon: string | null;
  pageUrl: string;
  editorUrl: string;
}
