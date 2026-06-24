/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_BASE: string;
  readonly VITE_EVIDENCE_API_BASE: string;
  readonly VITE_PUBLIC_API_BASE: string;
  readonly VITE_MAP_STYLE_URL: string;
  readonly VITE_MAP_ATTRIBUTION: string;
  readonly VITE_INGESTION_API_BASE?: string;
  readonly VITE_DOCS_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
