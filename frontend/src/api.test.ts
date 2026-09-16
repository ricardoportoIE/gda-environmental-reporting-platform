import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, request } from './api'

afterEach(() => vi.unstubAllGlobals())

describe('authenticated API requests', () => {
  it('sends the session cookie and CSRF token on writes', async () => {
    vi.stubGlobal('document', { cookie: 'csrftoken=test-csrf' })
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })
    vi.stubGlobal('fetch', fetch)

    await request<void>('/auth/logout/', { method: 'POST' })

    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/auth/logout/')
    expect(options.credentials).toBe('include')
    expect(options.headers.get('X-CSRFToken')).toBe('test-csrf')
  })

  it('fetches a CSRF cookie before the first write', async () => {
    let cookie = ''
    vi.stubGlobal('document', {
      get cookie() {
        return cookie
      },
    })
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/auth/csrf/') {
        cookie = 'csrftoken=fresh-csrf'
        return { ok: true, status: 200 }
      }
      return { ok: true, status: 204 }
    })
    vi.stubGlobal('fetch', fetch)

    await request<void>('/auth/logout/', { method: 'POST' })

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[0][1].credentials).toBe('include')
    expect(fetch.mock.calls[1][1].headers.get('X-CSRFToken')).toBe('fresh-csrf')
  })

  it('sends an anonymous access code only when provided', async () => {
    vi.stubGlobal('document', { cookie: '' })
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'synthetic-id' }),
    })
    vi.stubGlobal('fetch', fetch)

    await request('/reports/synthetic-id/', {}, 'private-synthetic-code')

    expect(fetch.mock.calls[0][1].headers.get('X-Report-Access-Token')).toBe(
      'private-synthetic-code',
    )
    expect(fetch.mock.calls[0][1].headers.get('X-CSRFToken')).toBeNull()
  })

  it('surfaces a field validation error with its HTTP status', async () => {
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ radius_km: ['Must be at most 50.'] }),
      }),
    )

    await expect(api.nearby(51.5, -0.1, 51)).rejects.toMatchObject({
      status: 400,
      message: 'radius_km: Must be at most 50.',
    } satisfies Partial<ApiError>)
  })

  it('encodes a nearby query and excludes its source report', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] })
    vi.stubGlobal('fetch', fetch)

    await api.nearby(51.5, -0.1, 10, 'synthetic-id')

    expect(fetch.mock.calls[0][0]).toBe(
      '/api/reports/nearby/?latitude=51.5&longitude=-0.1&radius_km=10&exclude_id=synthetic-id',
    )
    expect(fetch.mock.calls[0][1].credentials).toBe('include')
  })
})
