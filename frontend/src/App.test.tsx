// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from './api'
import type { User } from './types'
import App from './App'

vi.mock('./api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./api')>()
  return { ...original, api: { me: vi.fn() } }
})
vi.mock('./shared/Layout', () => ({
  Header: () => <header>Header</header>,
  Footer: () => <footer>Footer</footer>,
}))
vi.mock('./features/home/Home', () => ({ Home: () => <main>Home page</main> }))
vi.mock('./features/auth/AuthPage', () => ({
  AuthPage: ({ mode }: { mode: string }) => <main>Auth page: {mode}</main>,
}))
vi.mock('./features/reports/Reports', () => ({ Reports: () => <main>Reports page</main> }))
vi.mock('./features/reports/NewReport', () => ({ NewReport: () => <main>New report page</main> }))
vi.mock('./features/reports/ReportDetail', () => ({
  ReportDetail: () => <main>Report detail page</main>,
}))
vi.mock('./features/admin/Users', () => ({ Users: () => <main>Users page</main> }))

const citizen: User = {
  id: 'citizen-id',
  email: 'citizen@example.test',
  first_name: 'Synthetic',
  last_name: 'Citizen',
  role: 'citizen',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderApp(path: string) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('redirects an anonymous visitor from a protected route', async () => {
  vi.mocked(api.me).mockRejectedValue(new (await import('./api')).ApiError(401, 'Anonymous'))
  renderApp('/denuncias')
  expect(await screen.findByText('Auth page: login')).toBeTruthy()
})

it('redirects a citizen away from administrator routes', async () => {
  vi.mocked(api.me).mockResolvedValue(citizen)
  renderApp('/usuarios')
  expect(await screen.findByText('Home page')).toBeTruthy()
})

it('allows an administrator to open user management', async () => {
  vi.mocked(api.me).mockResolvedValue({ ...citizen, role: 'admin' })
  renderApp('/usuarios')
  expect(await screen.findByText('Users page')).toBeTruthy()
})
