/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CELEBRATIONS_BADGE_ADDRESS: string;
  readonly VITE_GREETING_CARD_ADDRESS: string;
  readonly VITE_CELEBRATIONS_DELEGATE_ADDRESS: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_INDEXER_URL: string;
  readonly VITE_IPFS_PROXY_URL: string;
  readonly VITE_PINATA_GATEWAY_URL: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
