import type { Role, Status } from '../types'

export const statusLabels: Record<Status, string> = {
  analysis: 'Em análise',
  queued: 'Na fila',
  in_progress: 'Em atendimento',
  completed: 'Concluída',
  rejected: 'Negada',
}
export const nextStatus: Partial<Record<Status, Status[]>> = {
  analysis: ['queued', 'rejected'],
  queued: ['in_progress', 'rejected'],
  in_progress: ['completed', 'rejected'],
}
export const date = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
export const isStaff = (role?: Role) => role === 'operator' || role === 'admin'

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.'
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status-${status}`}>{statusLabels[status]}</span>
}
