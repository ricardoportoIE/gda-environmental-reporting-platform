// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api'
import type { Paginated, Report, User } from '../../types'
import { Reports } from './Reports'

vi.mock('../../api', () => ({ api: { reports: vi.fn() } }))

const citizen: User = {
  id: 'citizen-id',
  email: 'citizen@example.test',
  first_name: 'Synthetic',
  last_name: 'Citizen',
  role: 'citizen',
}
const report: Report = {
  id: 'report-id',
  title: 'Synthetic river report',
  description: 'Test only',
  category: { id: 1, name: 'Water' },
  municipality: { ibge_code: '0000000', name: 'Test Town', state: 'TT' },
  address: '',
  latitude: null,
  longitude: null,
  reporter: citizen.id,
  status: 'analysis',
  priority: 'medium',
  assigned_to: null,
  created_at: '2026-09-16T00:00:00Z',
  updated_at: '2026-09-16T00:00:00Z',
  attachments: [],
  transitions: [],
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPage(data?: Paginated<Report>, user: User = citizen) {
  if (data) vi.mocked(api.reports).mockResolvedValue(data)
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <Reports user={user} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('lists reports and applies status and page controls', async () => {
  renderPage({ count: 21, next: '/api/reports/?page=2', previous: null, results: [report] })
  expect(await screen.findByRole('heading', { name: report.title })).toBeTruthy()
  expect(screen.getByText(/Test Town/)).toBeTruthy()

  await userEvent.selectOptions(screen.getByLabelText('Filtrar por status'), 'queued')
  await waitFor(() => expect(api.reports).toHaveBeenCalledWith(1, 'queued'))
  await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  await waitFor(() => expect(api.reports).toHaveBeenCalledWith(2, 'queued'))
  await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  await waitFor(() => expect(api.reports).toHaveBeenLastCalledWith(1, 'queued'))
})

it('renders the empty state for a citizen and the operational heading for staff', async () => {
  renderPage({ count: 0, next: null, previous: null, results: [] })
  expect(await screen.findByRole('heading', { name: 'Nenhuma denúncia por aqui' })).toBeTruthy()
  cleanup()

  renderPage(
    { count: 0, next: null, previous: null, results: [] },
    { ...citizen, role: 'operator' },
  )
  expect(await screen.findByRole('heading', { name: 'Denúncias' })).toBeTruthy()
})

it('shows API failures without exposing implementation details', async () => {
  vi.mocked(api.reports).mockRejectedValue(new Error('Synthetic list failure'))
  renderPage()
  expect(await screen.findByText('Synthetic list failure')).toBeTruthy()
})
