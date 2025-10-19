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
