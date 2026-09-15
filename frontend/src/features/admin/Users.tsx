import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api'
import { PageHeading } from '../../shared/Layout'
import { errorText } from '../../shared/report-ui'
import type { Role, User } from '../../types'

export function Users() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['users'], queryFn: api.users })
  const [error, setError] = useState('')
  const update = async (user: User, role: Role) => {
    try {
      await api.updateUser(user.id, { role })
      await client.invalidateQueries({ queryKey: ['users'] })
    } catch (caught) {
      setError(errorText(caught))
    }
  }
  return (
    <main className="shell page-content">
      <PageHeading
        eyebrow="ADMINISTRAÇÃO"
        title="Usuários"
        description="Papéis são alterados apenas por administradores."
      />
      {error && <div className="message message-error">{error}</div>}
      {query.error && <div className="message message-error">{errorText(query.error)}</div>}
      <div className="panel user-list">
        {query.data?.results.map((user) => (
          <div className="user-row" key={user.id}>
            <div>
              <strong>
                {user.first_name} {user.last_name}
              </strong>
              <span>{user.email}</span>
            </div>
            <select
              aria-label={`Papel de ${user.email}`}
              value={user.role}
              onChange={(e) => update(user, e.target.value as Role)}
            >
              <option value="citizen">Cidadão</option>
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        ))}
      </div>
    </main>
  )
}
