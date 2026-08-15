/// <reference types="vite/client" />
/// <reference types="google.maps" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  /** Google calls this on key/billing/activation failures. */
  gm_authFailure?: () => void
}
