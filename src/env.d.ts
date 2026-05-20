/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DECRYPT_SECRET_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_API_TOKEN: string
  readonly VITE_JWT_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
