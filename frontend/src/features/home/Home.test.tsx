// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import type { User } from '../../types'
import { Home } from './Home'

afterEach(cleanup)

it('directs anonymous visitors to sign in when tracking a report', () => {
  render(
    <MemoryRouter>
      <Home user={null} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'Acompanhar denúncia' }).getAttribute('href')).toBe(
    '/entrar',
  )
  expect(screen.getAllByRole('link', { name: /denúncia|Registrar agora/ }).length).toBeGreaterThan(
    1,
  )
})

it('directs an authenticated visitor to their reports', () => {
  const user: User = {
    id: 'citizen-id',
    email: 'citizen@example.test',
    first_name: 'Synthetic',
    last_name: 'Citizen',
    role: 'citizen',
  }
  render(
    <MemoryRouter>
      <Home user={user} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'Acompanhar denúncia' }).getAttribute('href')).toBe(
    '/denuncias',
  )
})
