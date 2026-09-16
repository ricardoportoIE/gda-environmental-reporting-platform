import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api'
import { submittedReport } from '../../anonymous-access'
import { PageHeading } from '../../shared/Layout'
import {
  StatusBadge,
  date,
  errorText,
  isStaff,
  nextStatus,
  statusLabels,
} from '../../shared/report-ui'
import type { Status, User } from '../../types'

export function ReportDetail({ user }: { user: User | null }) {
  const { id } = useParams()
  const [initial] = useState(() => submittedReport(id))
  const [token, setToken] = useState(initial?.token || '')
  const [tokenInput, setTokenInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [reason, setReason] = useState('')
  const client = useQueryClient()
  const key = ['report', id, token]
  const query = useQuery({
    queryKey: key,
    queryFn: () => api.report(id!, token || undefined),
    enabled: !!id && (!!user || !!token),
    initialData: initial?.report,
  })
  const report = query.data
  const nearby = useQuery({
    queryKey: ['nearby', report?.id, report?.latitude, report?.longitude],
    queryFn: () => api.nearby(report!.latitude!, report!.longitude!, 10, report!.id),
    enabled: isStaff(user?.role) && report?.latitude != null && report?.longitude != null,
  })
  const update = async (status: Status) => {
    if (!id) return
    setPending(true)
    setError('')
    try {
      await api.transition(id, status, reason)
      await client.invalidateQueries({ queryKey: ['report', id] })
      await client.invalidateQueries({ queryKey: ['reports'] })
      setReason('')
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setPending(false)
    }
  }
  const upload = async () => {
    if (!file || !id) return
    setPending(true)
    setError('')
    try {
      await api.upload(id, file, token || undefined)
      await client.invalidateQueries({ queryKey: ['report', id] })
      setFile(null)
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setPending(false)
    }
  }
  const download = async (attachmentId: string, name: string) => {
    if (!id) return
    try {
      const blob = await api.download(id, attachmentId, token || undefined)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = name
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (caught) {
      setError(errorText(caught))
    }
  }
  if (!user && !token)
    return (
      <main className="shell page-content">
        <PageHeading
          eyebrow="ACOMPANHAR"
          title="Consulte sua denúncia"
          description="Informe o código privado recebido ao registrar o relato."
        />
        <div className="panel token-entry">
          <label>
            Código de acesso
            <input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} />
          </label>
          <button className="button button-primary" onClick={() => setToken(tokenInput.trim())}>
            Consultar
          </button>
        </div>
      </main>
    )
  if (query.isLoading)
    return (
      <main className="shell page-content">
        <div className="empty-state">Carregando denúncia...</div>
      </main>
    )
  if (query.error || !report)
    return (
      <main className="shell page-content">
        <div className="message message-error">{errorText(query.error)}</div>
      </main>
    )
  return (
    <main className="shell page-content">
      <div className="detail-back">
        <Link to={user ? '/denuncias' : '/'}>
          ← {user ? 'Voltar às denúncias' : 'Voltar ao início'}
        </Link>
      </div>
      <PageHeading
        eyebrow={`PROTOCOLO ${report.id.slice(0, 8).toUpperCase()}`}
        title={report.title}
        action={<StatusBadge status={report.status} />}
      />
      {token && (
        <div className="message message-token">
          <ShieldCheck size={20} />
          <div>
            <strong>Guarde seu código privado</strong>
            <p>Ele é exibido apenas agora e permite acompanhar o caso. Não o compartilhe.</p>
            <code>{token}</code>
          </div>
          <button onClick={() => navigator.clipboard.writeText(`${report.id}\n${token}`)}>
            Copiar protocolo e código
          </button>
        </div>
      )}
      <div className="detail-grid">
        <div>
          <section className="panel detail-panel">
            <h2>Relato</h2>
            <p className="report-description">{report.description}</p>
            <div className="detail-facts">
              <div>
                <span>Categoria</span>
                <strong>{report.category.name}</strong>
              </div>
              <div>
                <span>Município</span>
                <strong>
                  {report.municipality
                    ? `${report.municipality.name}, ${report.municipality.state}`
                    : 'Não informado'}
                </strong>
              </div>
              <div>
                <span>Local</span>
                <strong>{report.address || 'Não informado'}</strong>
              </div>
              <div>
                <span>Registrada em</span>
                <strong>{date(report.created_at)}</strong>
              </div>
            </div>
          </section>
          <section className="panel detail-panel">
            <h2>Evidências</h2>
            <p className="muted">Arquivos privados vinculados a esta denúncia.</p>
            {report.attachments.map((a) => (
              <button
                className="attachment-row"
                key={a.id}
                onClick={() => download(a.id, a.original_name)}
              >
                <UploadCloud size={19} />
                <span>{a.original_name}</span>
                <small>{(a.size / 1024).toFixed(0)} KB</small>
              </button>
            ))}
            {report.status === 'analysis' && report.attachments.length < 4 && (
              <div className="upload-box">
                <label htmlFor="evidence">Adicionar evidência (PNG, JPEG ou PDF, até 5 MB)</label>
                <input
                  id="evidence"
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  className="button button-outline"
                  disabled={!file || pending}
                  onClick={upload}
                >
                  Enviar arquivo
                </button>
              </div>
            )}
          </section>
        </div>
        <aside>
          {isStaff(user?.role) && report.latitude != null && report.longitude != null && (
            <section className="panel detail-panel">
              <h2>Relatos próximos</h2>
              <p className="muted">Consulta espacial em até 10 km deste ponto.</p>
              {nearby.isLoading && <p className="muted">Procurando relatos...</p>}
              {nearby.error && <p className="message message-error">{errorText(nearby.error)}</p>}
              {nearby.data?.length === 0 && <p className="muted">Nenhum relato próximo.</p>}
              <div className="nearby-list">
                {nearby.data?.map((item) => (
                  <Link key={item.id} to={`/denuncias/${item.id}`}>
                    <strong>{item.title}</strong>
                    <span>
                      {item.distance_km.toFixed(2)} km · {item.category}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section className="panel detail-panel">
            <h2>Andamento</h2>
            <div className="timeline">
              {report.transitions.map((t, index) => (
                <div className="timeline-item" key={`${t.created_at}-${index}`}>
                  <span className="timeline-dot" />
                  <strong>{statusLabels[t.to_status]}</strong>
                  <small>{date(t.created_at)}</small>
                  {t.reason && <p>{t.reason}</p>}
                </div>
              ))}
            </div>
          </section>
          {isStaff(user?.role) && nextStatus[report.status] && (
            <section className="panel detail-panel">
              <h2>Atualizar status</h2>
              <label>
                Justificativa
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  placeholder="Opcional"
                />
              </label>
              <div className="status-actions">
                {nextStatus[report.status]?.map((s) => (
                  <button
                    className="button button-outline"
                    key={s}
                    disabled={pending}
                    onClick={() => update(s)}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
      {error && (
        <div role="alert" className="message message-error">
          {error}
        </div>
      )}
    </main>
  )
}
