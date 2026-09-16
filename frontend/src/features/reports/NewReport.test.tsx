// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api'
import { submittedReport } from '../../anonymous-access'
import type { Report } from '../../types'
import { NewReport } from './NewReport'

vi.mock('../../api', () => ({
  api: { categories: vi.fn(), municipalities: vi.fn(), createReport: vi.fn() },
}))
vi.mock('../../shared/ReportMap', () => ({
  ReportMap: ({
    onSelect,
  }: {
    onSelect: (point: { latitude: number; longitude: number }) => void
  }) => (
    <button type="button" onClick={() => onSelect({ latitude: 51.5, longitude: -0.1 })}>
      Select synthetic point
    </button>
  ),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function Result() {
  const { id } = useParams()
  return <div>Report opened: {submittedReport(id)?.token}</div>
}

function renderPage() {
  vi.mocked(api.categories).mockResolvedValue([{ id: 1, name: 'Synthetic category' }])
  vi.mocked(api.municipalities).mockResolvedValue([])
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/nova-denuncia']}>
        <Routes>
          <Route path="/nova-denuncia" element={<NewReport />} />
          <Route path="/denuncias/:id" element={<Result />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText('Título da denúncia'), 'Synthetic issue')
  await userEvent.type(screen.getByLabelText('Descrição'), 'Synthetic report description')
  await screen.findByRole('option', { name: 'Synthetic category' })
  await userEvent.selectOptions(screen.getByLabelText('Categoria'), '1')
}

it('submits a selected map point and opens the report with its one-time code', async () => {
  vi.mocked(api.createReport).mockResolvedValue({
    id: 'synthetic-report-id',
    access_token: 'synthetic-one-time-code',
  } as Report)
  renderPage()
  await fillRequiredFields()
  await userEvent.click(screen.getByRole('button', { name: 'Select synthetic point' }))
  await userEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

  expect(api.createReport).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Synthetic issue',
      description: 'Synthetic report description',
      category: 1,
      latitude: 51.5,
      longitude: -0.1,
    }),
  )
  expect(await screen.findByText('Report opened: synthetic-one-time-code')).toBeTruthy()
})

it('allows a report without coordinates and displays submission errors', async () => {
  vi.mocked(api.createReport).mockRejectedValue(new Error('Synthetic submission failure'))
  renderPage()
  await fillRequiredFields()
  await userEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

  const submitted = vi.mocked(api.createReport).mock.calls[0][0]
  expect(submitted).not.toHaveProperty('latitude')
  expect(submitted).not.toHaveProperty('longitude')
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Synthetic submission failure',
  )
})
