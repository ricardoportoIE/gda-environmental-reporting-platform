// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api'
import { AuthPage } from './AuthPage'

vi.mock('../../api', () => ({ api: { login: vi.fn(), register: vi.fn() } }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPage(mode: 'login' | 'register') {
  const client = new QueryClient()
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[mode === 'login' ? '/entrar' : '/cadastro']}>
        <Routes>
          <Route path="/entrar" element={<AuthPage mode="login" />} />
          <Route path="/cadastro" element={<AuthPage mode="register" />} />
          <Route path="/denuncias" element={<h1>Dashboard loaded</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return client
}

it('logs in and stores the returned user in the session query', async () => {
  const user = { id: 'synthetic-user', email: 'reader@example.test', role: 'citizen' }
  vi.mocked(api.login).mockResolvedValue(user as Awaited<ReturnType<typeof api.login>>)
  const client = renderPage('login')

  await userEvent.type(screen.getByLabelText('E-mail'), 'reader@example.test')
  await userEvent.type(screen.getByLabelText('Senha'), 'synthetic-password')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

  expect(api.login).toHaveBeenCalledWith('reader@example.test', 'synthetic-password')
  expect(await screen.findByText('Dashboard loaded')).toBeTruthy()
  expect(client.getQueryData(['me'])).toEqual(user)
})

it('registers only the public form fields', async () => {
  vi.mocked(api.register).mockResolvedValue({
    id: 'synthetic-user',
    email: 'new@example.test',
    first_name: 'Alex',
    last_name: 'Test',
    role: 'citizen',
  })
  renderPage('register')

  await userEvent.type(screen.getByLabelText('Nome'), 'Alex')
  await userEvent.type(screen.getByLabelText('Sobrenome'), 'Test')
  await userEvent.type(screen.getByLabelText('E-mail'), 'new@example.test')
  await userEvent.type(screen.getByLabelText('Senha'), 'synthetic-password')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

  expect(api.register).toHaveBeenCalledWith({
    email: 'new@example.test',
    password: 'synthetic-password',
    first_name: 'Alex',
    last_name: 'Test',
  })
  expect(await screen.findByText('Dashboard loaded')).toBeTruthy()
})

it('shows an authentication error without navigating', async () => {
  vi.mocked(api.login).mockRejectedValue(new Error('Synthetic login failure'))
  renderPage('login')

  await userEvent.type(screen.getByLabelText('E-mail'), 'reader@example.test')
  await userEvent.type(screen.getByLabelText('Senha'), 'incorrect-test-value')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Synthetic login failure')
  expect(screen.queryByText('Dashboard loaded')).toBeNull()
})
