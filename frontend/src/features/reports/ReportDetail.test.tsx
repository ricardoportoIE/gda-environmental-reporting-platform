// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api'
import type { Report, User } from '../../types'
import { ReportDetail } from './ReportDetail'

vi.mock('../../api', () => ({
  api: {
    report: vi.fn(),
    nearby: vi.fn(),
    transition: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
  },
}))

const report: Report = {
  id: 'synthetic-report-id',
  title: 'Synthetic issue',
  description: 'Test-only environmental report',
  category: { id: 1, name: 'Synthetic category' },
  municipality: null,
  address: '',
  latitude: 51.5,
  longitude: -0.1,
  reporter: 'synthetic-citizen-id',
  status: 'analysis',
  priority: 'medium',
  assigned_to: null,
  created_at: '2026-09-16T00:00:00Z',
  updated_at: '2026-09-16T00:00:00Z',
  attachments: [],
  transitions: [],
}

const citizen: User = {
  id: 'synthetic-citizen-id',
  email: 'citizen@example.test',
  first_name: 'Test',
  last_name: 'Citizen',
  role: 'citizen',
}
const operator: User = { ...citizen, id: 'synthetic-operator-id', role: 'operator' }

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPage(user: User | null) {
  vi.mocked(api.report).mockResolvedValue(report)
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/denuncias/synthetic-report-id']}>
        <Routes>
          <Route path="/denuncias/:id" element={<ReportDetail user={user} />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('does not query nearby private reports for a citizen', async () => {
  renderPage(citizen)
  expect(await screen.findByText('Synthetic issue')).toBeTruthy()
  expect(api.nearby).not.toHaveBeenCalled()
  expect(screen.queryByText('Relatos próximos')).toBeNull()
  expect(screen.queryByText('Atualizar status')).toBeNull()
})

it('shows spatially nearby cases and lets an operator record an allowed transition', async () => {
  vi.mocked(api.nearby).mockResolvedValue([
    {
      id: 'close-report-id',
      title: 'Nearby synthetic report',
      status: 'analysis',
      category: 'Synthetic category',
      latitude: 51.51,
      longitude: -0.1,
      distance_km: 1.11,
    },
  ])
  vi.mocked(api.transition).mockResolvedValue({ ...report, status: 'queued' })
  renderPage(operator)
  expect(await screen.findByText('Nearby synthetic report')).toBeTruthy()
  expect(api.nearby).toHaveBeenCalledWith(51.5, -0.1, 10, 'synthetic-report-id')

  await userEvent.type(screen.getByLabelText('Justificativa'), 'Synthetic review')
  await userEvent.click(screen.getByRole('button', { name: 'Na fila' }))
  expect(api.transition).toHaveBeenCalledWith('synthetic-report-id', 'queued', 'Synthetic review')
})

it('requires the one-time code to view an anonymous report', async () => {
  renderPage(null)
  expect(api.report).not.toHaveBeenCalled()
  await userEvent.type(screen.getByLabelText('Código de acesso'), 'synthetic-private-code')
  await userEvent.click(screen.getByRole('button', { name: 'Consultar' }))
  expect(await screen.findByText('Synthetic issue')).toBeTruthy()
  expect(api.report).toHaveBeenCalledWith('synthetic-report-id', 'synthetic-private-code')
})
