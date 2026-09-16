// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../api'
import type { User } from '../types'
import { Footer, Header, PageHeading } from './Layout'

vi.mock('../api', () => ({ api: { logout: vi.fn() } }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderHeader(user: User | null) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/private']}>
        <Header user={user} />
        <Routes>
          <Route path="/" element={<div>Public home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('shows administrator navigation, toggles the menu and logs out', async () => {
  vi.mocked(api.logout).mockResolvedValue(undefined)
  renderHeader({
    id: 'admin-id',
    email: 'admin@example.test',
    first_name: 'Test',
    last_name: 'Admin',
    role: 'admin',
  })
  expect(screen.getByRole('link', { name: 'Usuários' })).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
  await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(api.logout).toHaveBeenCalledOnce()
  expect(await screen.findByText('Public home')).toBeTruthy()
})

it('renders anonymous navigation and shared presentational components', () => {
  renderHeader(null)
  expect(screen.getByRole('link', { name: /Entrar/ })).toBeTruthy()
  cleanup()
  render(
    <>
      <PageHeading eyebrow="Test" title="Accessible heading" description="Description" />
      <Footer />
    </>,
  )
  expect(screen.getByRole('heading', { name: 'Accessible heading' })).toBeTruthy()
  expect(screen.getByText(/Projeto acadêmico modernizado/)).toBeTruthy()
})
