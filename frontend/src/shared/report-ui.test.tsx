// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { StatusBadge, errorText, isStaff, nextStatus } from './report-ui'

afterEach(cleanup)

it('keeps operational actions available only to staff roles', () => {
  expect(isStaff('citizen')).toBe(false)
  expect(isStaff('operator')).toBe(true)
  expect(isStaff('admin')).toBe(true)
  expect(isStaff()).toBe(false)
})

it('does not suggest a transition from a terminal status', () => {
  expect(nextStatus.analysis).toEqual(['queued', 'rejected'])
  expect(nextStatus.completed).toBeUndefined()
  expect(nextStatus.rejected).toBeUndefined()
})

it('renders a visible status label and handles unknown errors', () => {
  render(<StatusBadge status="in_progress" />)
  expect(screen.getByText('Em atendimento').className).toContain('status-in_progress')
  expect(errorText('unstructured response')).toBe('Ocorreu um erro. Tente novamente.')
})
