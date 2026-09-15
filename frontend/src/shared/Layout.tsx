import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Leaf, LogOut, Menu, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { User } from '../types'
import { isStaff } from './report-ui'

export function Header({ user }: { user: User | null }) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const logout = async () => {
    await api.logout()
    client.setQueryData(['me'], null)
    navigate('/')
  }
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand" aria-label="GDA, página inicial">
          <span className="brand-icon">
            <Leaf size={23} strokeWidth={2.4} />
          </span>
          <span>
            GDA<span className="brand-dot">.</span>
          </span>
        </Link>
        <button
          className="mobile-menu"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          className={menuOpen ? 'navigation navigation-open' : 'navigation'}
          aria-label="Principal"
          onClick={() => setMenuOpen(false)}
        >
          <Link to="/">Início</Link>
          <Link to="/nova-denuncia">Nova denúncia</Link>
          {user && (
            <Link to="/denuncias">{isStaff(user.role) ? 'Painel' : 'Minhas denúncias'}</Link>
          )}
          {user?.role === 'admin' && <Link to="/usuarios">Usuários</Link>}
          {user ? (
            <button className="nav-logout" onClick={logout}>
              <LogOut size={16} /> Sair
            </button>
          ) : (
            <Link to="/entrar" className="nav-login">
              Entrar <ArrowRight size={16} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <span>
          <Leaf size={17} /> GDA · Gerenciador de Denúncias Ambientais
        </span>
        <span>Projeto acadêmico modernizado · Dados de demonstração</span>
      </div>
    </footer>
  )
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}
