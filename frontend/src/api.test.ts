import { afterEach, describe, expect, it, vi } from 'vitest'
import { request } from './api'

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
})
