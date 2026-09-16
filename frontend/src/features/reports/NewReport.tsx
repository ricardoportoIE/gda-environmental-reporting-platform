import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CircleHelp, MapPin, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { rememberSubmittedReport } from '../../anonymous-access'
import { PageHeading } from '../../shared/Layout'
import { ReportMap, type Coordinates } from '../../shared/ReportMap'
import { errorText } from '../../shared/report-ui'

export function NewReport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const categories = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const [municipalitySearch, setMunicipalitySearch] = useState('')
  const municipalities = useQuery({
    queryKey: ['municipalities', municipalitySearch],
    queryFn: () => api.municipalities(municipalitySearch),
  })
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    municipality: '',
    address: '',
  })
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setError('Não foi possível obter sua localização. Você pode continuar sem ela.'),
    )
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const report = await api.createReport({
        ...form,
        category: Number(form.category),
        municipality: form.municipality || null,
        ...coords,
      })
      await queryClient.invalidateQueries({ queryKey: ['reports'] })
      rememberSubmittedReport(report)
      navigate(`/denuncias/${report.id}`)
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setPending(false)
    }
  }
  return (
    <main className="shell page-content">
      <PageHeading
        eyebrow="NOVA DENÚNCIA"
        title="Conte o que você viu"
        description="Preencha apenas o que souber. Informações claras ajudam na análise do caso."
      />
      <div className="report-layout">
        <form className="panel report-form" onSubmit={submit}>
          <div className="form-section">
            <div className="form-section-head">
              <span>01</span>
              <div>
                <h2>O que aconteceu?</h2>
                <p>Descreva o problema ambiental.</p>
              </div>
            </div>
            <label>
              Título da denúncia
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={180}
                placeholder="Ex.: Descarte irregular de resíduos"
                required
              />
            </label>
            <label>
              Descrição
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={5000}
                rows={6}
                placeholder="Onde aconteceu? O que você observou?"
                required
              />
            </label>
            <label>
              Categoria
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.data?.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {categories.data?.length === 0 && (
              <div className="message">
                Ainda não há categorias cadastradas. Um administrador precisa adicionar categorias
                antes da primeira denúncia.
              </div>
            )}
          </div>
          <div className="form-section">
            <div className="form-section-head">
              <span>02</span>
              <div>
                <h2>Onde ocorreu?</h2>
                <p>A localização é opcional, mas ajuda a equipe.</p>
              </div>
            </div>
            <label>
              Buscar município
              <input
                value={municipalitySearch}
                onChange={(e) => {
                  setMunicipalitySearch(e.target.value)
                  setForm({ ...form, municipality: '' })
                }}
                placeholder="Digite o nome do município"
              />
            </label>
            <label>
              Município
              <select
                value={form.municipality}
                onChange={(e) => setForm({ ...form, municipality: e.target.value })}
              >
                <option value="">Não informado</option>
                {municipalities.data?.map((m) => (
                  <option value={m.ibge_code} key={m.ibge_code}>
                    {m.name}, {m.state}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Endereço ou ponto de referência
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                maxLength={250}
                placeholder="Rua, bairro ou referência"
              />
            </label>
            <button type="button" className="locate-button" onClick={locate}>
              <MapPin size={18} />{' '}
              {coords
                ? `Localização adicionada (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
                : 'Usar minha localização atual'}
            </button>
            <div className="map-field">
              <p>Ou selecione o ponto no mapa. A localização é opcional.</p>
              <ReportMap position={coords} onSelect={setCoords} />
              {coords && (
                <button type="button" className="map-clear" onClick={() => setCoords(null)}>
                  Remover localização
                </button>
              )}
              <small>
                O mapa usa blocos do OpenStreetMap. Ao navegar, a área mostrada é enviada ao
                provedor de mapas.
              </small>
            </div>
          </div>
          {error && (
            <div role="alert" className="message message-error">
              {error}
            </div>
          )}
          <button
            className="button button-primary button-full"
            type="submit"
            disabled={pending || categories.data?.length === 0}
          >
            {pending ? 'Enviando...' : 'Enviar denúncia'} <ArrowRight size={17} />
          </button>
        </form>
        <aside className="help-panel">
          <div className="help-icon">
            <CircleHelp size={26} />
          </div>
          <h3>Como enviar evidências?</h3>
          <p>
            Depois de registrar a denúncia, você poderá anexar imagens ou PDF. Os arquivos ficam
            privados e são acessíveis apenas por você e pela equipe autorizada.
          </p>
          <div className="help-divider" />
          <h3>Prefere manter o anonimato?</h3>
          <p>
            Não é preciso entrar. Ao enviar, você receberá um código privado para consultar o caso.
            Guarde o código: ele será mostrado uma única vez.
          </p>
          <div className="help-divider" />
          <p className="help-small">
            <ShieldCheck size={17} /> O GDA não pede CPF para a demonstração.
          </p>
        </aside>
      </div>
    </main>
  )
}
