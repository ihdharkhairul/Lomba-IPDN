/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  readonly VITE_MAP_PROVIDER?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_AI_STRICT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
