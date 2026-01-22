/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_CONTACT_TIMEOUT_MS?: string;
  readonly VITE_CHAT_ENDPOINT?: string;
  readonly VITE_CHAT_TIMEOUT_MS?: string;
  readonly VITE_ENABLE_CHAT?: string;
  readonly VITE_MISTRAL_API_KEY?: string;
  readonly VITE_MISTRAL_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
