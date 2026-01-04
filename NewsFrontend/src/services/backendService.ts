import apiClient from './apiClient'

export type NewsSourcesResponse = {
  status: 'ok' | string
  sources: Record<string, string>
}

export async function getNewsSources(): Promise<Record<string, string>> {
  const response = await apiClient.get<NewsSourcesResponse>('/news-sources')
  if (response.data.status !== 'ok') throw new Error('Bad response status')
  return response.data.sources
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
  result: ProcessLinkResultData
}

export async function processLink(payload: ProcessLinkPayload): Promise<ProcessLinkResponse> {
  const response = await apiClient.post<ProcessLinkResponse>('/process-link', payload)
  return response.data
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
 */
export async function getPendingUrls(params?: {
  page?: number
  limit?: number
  status?: string
  source?: string
}): Promise<PendingListResponse> {
  const response = await apiClient.get<PendingListResponse>('/pending-urls', { params })
  return response.data
}

/** Delete a pending url by id */
export async function deletePendingUrl(id: string): Promise<{ status: string }> {
  const response = await apiClient.delete<{ status: string }>(`/pending-urls/${encodeURIComponent(id)}`)
  return response.data
}

/** Process a pending url by id */
export async function processPendingUrl(id: string): Promise<ProcessLinkResponse> {
  const response = await apiClient.post<ProcessLinkResponse>(`/pending-urls/${encodeURIComponent(id)}/process`)
  return response.data
}

export type ScrappingResponse = { status: 'ok' | string; scrappingEnabled: boolean }

export async function setScrappingEnabled(enabled: boolean): Promise<ScrappingResponse> {
  const response = await apiClient.post<ScrappingResponse>('/scrapping-enabled', { enabled })
  return response.data
}

export async function getScrappingEnabled(): Promise<ScrappingResponse> {
  const response = await apiClient.get<ScrappingResponse>('/scrapping-enabled')
  return response.data
}

export default { getNewsSources, processLink, setScrappingEnabled, getScrappingEnabled }
