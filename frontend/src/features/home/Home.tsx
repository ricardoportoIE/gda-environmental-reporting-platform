import { ArrowRight, Check, ChevronRight, FilePlus2, Leaf, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { User } from '../../types'

export function Home({ user }: { user: User | null }) {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> CIDADANIA AMBIENTAL
            </div>
            <h1>
              Um ambiente melhor começa com <em>a sua voz.</em>
            </h1>
            <p>
              Registre uma denúncia ambiental com segurança e acompanhe cada etapa da análise. Um
              canal simples para transformar observações em ação.
            </p>
            <div className="hero-actions">
              <Link to="/nova-denuncia" className="button button-primary">
                Fazer uma denúncia <ArrowRight size={18} />
              </Link>
              <Link to={user ? '/denuncias' : '/entrar'} className="button button-outline">
                Acompanhar denúncia
              </Link>
            </div>
            <div className="hero-note">
              <ShieldCheck size={18} /> Você pode denunciar sem criar uma conta.
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit art-orbit-one" />
            <div className="art-orbit art-orbit-two" />
            <div className="art-circle">
              <Leaf size={130} strokeWidth={1.1} />
            </div>
            <div className="art-card art-card-top">
              <span className="art-card-icon">
                <MapPin size={19} />
              </span>
              <span>
                <strong>Localização</strong>
                <small>Identifique a área afetada</small>
              </span>
            </div>
            <div className="art-card art-card-bottom">
              <span className="art-card-icon art-card-icon-warm">
                <Check size={19} />
              </span>
              <span>
                <strong>Acompanhamento</strong>
                <small>Veja o andamento do caso</small>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="process shell">
        <div className="section-heading">
          <span className="eyebrow">COMO FUNCIONA</span>
          <h2>Da observação à ação</h2>
          <p>Três passos para fazer sua denúncia chegar às pessoas certas.</p>
        </div>
        <div className="steps">
          <div className="step">
            <span className="step-number">01</span>
            <FilePlus2 size={28} />
            <h3>Conte o que aconteceu</h3>
            <p>Descreva o problema, indique o local e, se quiser, envie até quatro evidências.</p>
          </div>
          <div className="step">
            <span className="step-number">02</span>
            <ShieldCheck size={28} />
            <h3>Receba um protocolo</h3>
            <p>
              Você acompanha a denúncia pela sua conta ou por um código privado, caso prefira o
              anonimato.
            </p>
          </div>
          <div className="step">
            <span className="step-number">03</span>
            <ChevronRight size={28} />
            <h3>Acompanhe o processo</h3>
            <p>Operadores analisam o caso e registram cada mudança de status no histórico.</p>
          </div>
        </div>
      </section>
      <section className="callout">
        <div className="shell callout-inner">
          <div>
            <span className="eyebrow">SUA PARTICIPAÇÃO IMPORTA</span>
            <h2>Viu algo que merece atenção?</h2>
            <p>Seu relato pode ajudar a proteger o lugar onde você vive.</p>
          </div>
          <Link to="/nova-denuncia" className="button button-light">
            Registrar agora <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}
