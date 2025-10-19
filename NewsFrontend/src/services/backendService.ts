import { getBackendUrl } from '../config'

export type NewsSourcesResponse = {
  status: 'ok' | string
  sources: Record<string, string>
}

const BASE = getBackendUrl().replace(/\/$/, '')

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, options)
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Request failed ${res.status}: ${t}`)
  }
  return res.json() as Promise<T>
}

export async function getNewsSources(): Promise<Record<string, string>> {
  const res = await request<NewsSourcesResponse>('/news-sources')
  if (res.status !== 'ok') throw new Error('Bad response status')
  return res.sources
}

export type ProcessLinkPayload = {
  link: string
  source: string
}

export type ProcessLinkResultData = {
  headline: string
  author: string
  content: string
}

export type ProcessLinkResult = {
  url: string
  source: string
  status: string
  data: ProcessLinkResultData
}

export type ProcessLinkResponse = {
  status: 'processed' | string
  link: string
  source: string
  result: ProcessLinkResult
}

export async function processLink(payload: ProcessLinkPayload): Promise<ProcessLinkResponse> {
  return request<ProcessLinkResponse>('/process-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// Pending URLs types and helpers
export type PendingUrl = {
  _id: string
  url: string
  source: string
  status: string
  data: ProcessLinkResultData
}

export type PendingListResponse = {
  items: PendingUrl[]
  total: number
}

/**
 * Fetch pending urls with optional query params: page, limit, status, source
 * Assumption: backend supports query params page & limit and returns { items, total }
 */
export async function getPendingUrls(params?: {
  page?: number
  limit?: number
  status?: string
  source?: string
}): Promise<PendingListResponse> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.status) qs.set('status', params.status)
  if (params?.source) qs.set('source', params.source)
  const path = `/pending-urls${qs.toString() ? `?${qs.toString()}` : ''}`
  // Assumption: backend returns { items: [...], total: number }
  return request<PendingListResponse>(path)
}

/** Delete a pending url by id */
export async function deletePendingUrl(id: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/pending-urls/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/** Process a pending url by id. Assumption: POST /pending-urls/:id/process triggers processing and returns ProcessLinkResponse */
export async function processPendingUrl(id: string): Promise<ProcessLinkResponse> {
  return request<ProcessLinkResponse>(`/pending-urls/${encodeURIComponent(id)}/process`, {
    method: 'POST',
  })
}

export type ScrappingResponse = { status: 'ok' | string; scrappingEnabled: boolean }

export async function setScrappingEnabled(enabled: boolean): Promise<ScrappingResponse> {
  return request<ScrappingResponse>('/scrapping-enabled', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
}

export async function getScrappingEnabled(): Promise<ScrappingResponse> {
  // assume backend exposes GET /scrapping-enabled returning { status: 'ok', scrappingEnabled: boolean }
  return request<ScrappingResponse>('/scrapping-enabled')
}

export default { getNewsSources, processLink, setScrappingEnabled, getScrappingEnabled }
