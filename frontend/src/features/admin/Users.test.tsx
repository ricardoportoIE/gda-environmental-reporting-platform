// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../api'
import type { User } from '../../types'
import { Users } from './Users'

vi.mock('../../api', () => ({ api: { users: vi.fn(), updateUser: vi.fn() } }))

const managedUser: User = {
  id: 'managed-user-id',
  email: 'managed@example.test',
  first_name: 'Managed',
  last_name: 'User',
  role: 'citizen',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderPage() {
  vi.mocked(api.users).mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [managedUser],
  })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('updates a managed user role and refreshes the list', async () => {
  vi.mocked(api.updateUser).mockResolvedValue({ ...managedUser, role: 'operator' })
  renderPage()
  const role = await screen.findByLabelText(`Papel de ${managedUser.email}`)
  await userEvent.selectOptions(role, 'operator')
  expect(api.updateUser).toHaveBeenCalledWith(managedUser.id, { role: 'operator' })
  await waitFor(() => expect(api.users).toHaveBeenCalledTimes(2))
})

it('shows a role update failure', async () => {
  vi.mocked(api.updateUser).mockRejectedValue(new Error('Synthetic role failure'))
  renderPage()
  await userEvent.selectOptions(
    await screen.findByLabelText(`Papel de ${managedUser.email}`),
    'admin',
  )
  expect(await screen.findByText('Synthetic role failure')).toBeTruthy()
})
