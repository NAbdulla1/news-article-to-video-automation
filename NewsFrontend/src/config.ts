export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) ?? 'http://localhost:3000'

export function getBackendUrl() {
  return BACKEND_URL
}
