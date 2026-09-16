import type { Category, Municipality, NearbyReport, Paginated, Report, Status, User } from './types'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

function csrfCookie(): string {
  return (
    document.cookie
      .split('; ')
      .find((item) => item.startsWith('csrftoken='))
      ?.split('=')[1] || ''
  )
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  anonymousToken?: string,
): Promise<T> {
  const method = init.method?.toUpperCase() || 'GET'
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !csrfCookie()) {
    await fetch(`${apiBase}/auth/csrf/`, { credentials: 'include' })
  }
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method))
    headers.set('X-CSRFToken', decodeURIComponent(csrfCookie()))
  if (anonymousToken) headers.set('X-Report-Access-Token', anonymousToken)
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: 'include' })
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}))
    let detail = 'Não foi possível concluir a solicitação.'
    if (typeof body === 'object' && body !== null) {
      if ('detail' in body) detail = String(body.detail)
      else {
        const first = Object.entries(body)[0]
        if (first) {
          const [field, issue] = first
          detail = `${field}: ${Array.isArray(issue) ? issue.join(' ') : String(issue)}`
        }
      }
    }
    throw new ApiError(response.status, detail)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  me: () => request<User>('/auth/me/'),
  login: (email: string, password: string) =>
    request<User>('/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    request<User>('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<void>('/auth/logout/', { method: 'POST' }),
  categories: () => request<Category[]>('/categories/'),
  municipalities: (query: string) =>
    request<Municipality[]>(`/municipalities/?q=${encodeURIComponent(query)}`),
  reports: (page = 1, status?: Status) =>
    request<Paginated<Report>>(`/reports/?page=${page}${status ? `&status=${status}` : ''}`),
  report: (id: string, token?: string) => request<Report>(`/reports/${id}/`, {}, token),
  nearby: (latitude: number, longitude: number, radiusKm: number, excludeId?: string) => {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radius_km: String(radiusKm),
    })
    if (excludeId) params.set('exclude_id', excludeId)
    return request<NearbyReport[]>(`/reports/nearby/?${params}`)
  },
  createReport: (data: Record<string, unknown>) =>
    request<Report>('/reports/', { method: 'POST', body: JSON.stringify(data) }),
  transition: (id: string, status: Status, reason: string) =>
    request<Report>(`/reports/${id}/transition/`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    }),
  upload: (id: string, file: File, token?: string) => {
    const form = new FormData()
    form.append('file', file)
    return request<unknown>(`/reports/${id}/attachments/`, { method: 'POST', body: form }, token)
  },
  download: async (id: string, attachmentId: string, token?: string) => {
    const headers = token ? { 'X-Report-Access-Token': token } : undefined
    const response = await fetch(`${apiBase}/reports/${id}/attachments/${attachmentId}/`, {
      credentials: 'include',
      headers,
    })
    if (!response.ok) throw new ApiError(response.status, 'Acesso ao anexo negado.')
    return response.blob()
  },
  users: () => request<Paginated<User>>('/auth/users/'),
  updateUser: (id: string, data: Partial<Pick<User, 'role' | 'is_active'>>) =>
    request<User>(`/auth/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
}
