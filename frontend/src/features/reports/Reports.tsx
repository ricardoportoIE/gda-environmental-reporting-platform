import { useQuery } from '@tanstack/react-query'
import { ChevronRight, FilePlus2, Leaf } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { PageHeading } from '../../shared/Layout'
import { StatusBadge, date, errorText, isStaff, statusLabels } from '../../shared/report-ui'
import type { Status, User } from '../../types'

export function Reports({ user }: { user: User }) {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<Status | ''>('')
  const query = useQuery({
    queryKey: ['reports', page, filter],
    queryFn: () => api.reports(page, filter || undefined),
  })
  return (
    <main className="shell page-content">
      <PageHeading
        eyebrow={isStaff(user.role) ? 'PAINEL OPERACIONAL' : 'MINHA ÁREA'}
        title={isStaff(user.role) ? 'Denúncias' : 'Minhas denúncias'}
        description={
          isStaff(user.role)
            ? 'Acompanhe os relatos e o andamento da análise.'
            : 'Acompanhe os relatos que você registrou.'
        }
        action={
          <Link to="/nova-denuncia" className="button button-primary">
            <FilePlus2 size={17} /> Nova denúncia
          </Link>
        }
      />
      <div className="list-toolbar">
        <span>{query.data?.count ?? 0} denúncias</span>
        <select
          aria-label="Filtrar por status"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as Status | '')
            setPage(1)
          }}
        >
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {query.isLoading && <div className="empty-state">Carregando denúncias...</div>}
      {query.error && <div className="message message-error">{errorText(query.error)}</div>}
      {query.data?.results.length === 0 && (
        <div className="empty-state">
          <FilePlus2 size={34} />
          <h2>Nenhuma denúncia por aqui</h2>
          <p>Quando um relato for registrado, ele aparecerá nesta lista.</p>
          <Link to="/nova-denuncia" className="button button-primary">
            Criar denúncia
          </Link>
        </div>
      )}
      <div className="report-list">
        {query.data?.results.map((report) => (
          <Link to={`/denuncias/${report.id}`} className="report-row" key={report.id}>
            <div className="report-row-icon">
              <Leaf size={20} />
            </div>
            <div className="report-row-main">
              <h3>{report.title}</h3>
              <p>
                {report.category.name} ·{' '}
                {report.municipality
                  ? `${report.municipality.name}, ${report.municipality.state}`
                  : 'Local não informado'}{' '}
                · {date(report.created_at)}
              </p>
            </div>
            <StatusBadge status={report.status} />
            <ChevronRight className="row-chevron" size={19} />
          </Link>
        ))}
      </div>
      {query.data && query.data.count > 20 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <span>Página {page}</span>
          <button disabled={!query.data.next} onClick={() => setPage(page + 1)}>
            Próxima
          </button>
        </div>
      )}
    </main>
  )
}
