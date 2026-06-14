/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_AUTH_SERVICE_URL?: string;
  readonly VITE_PAYMENT_SERVICE_URL?: string;
  readonly VITE_WALLET_SERVICE_URL?: string;
  readonly VITE_NOTIFICATION_SERVICE_URL?: string;
  readonly VITE_EVENT_BUS_URL?: string;
  readonly VITE_INTENT_SERVICE_URL?: string;
  readonly VITE_INTERNAL_SERVICE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
