import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { errorText } from '../../shared/report-ui'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const user =
        mode === 'login' ? await api.login(form.email, form.password) : await api.register(form)
      client.setQueryData(['me'], user)
      navigate('/denuncias')
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="auth-wrap shell">
      <div className="auth-aside">
        <span className="eyebrow">CANAL SEGURO</span>
        <h1>Juntos, cuidamos do que importa.</h1>
        <p>
          Uma conta permite acompanhar suas denúncias em um só lugar. Também é possível relatar um
          caso anonimamente.
        </p>
        <Link to="/nova-denuncia">
          Continuar sem conta <ArrowRight size={17} />
        </Link>
      </div>
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
        <p>
          {mode === 'login'
            ? 'Entre para acompanhar suas denúncias.'
            : 'Comece com seus dados básicos.'}
        </p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="form-row">
              <label>
                Nome
                <input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </label>
              <label>
                Sobrenome
                <input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </label>
            </div>
          )}
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={mode === 'register' ? 8 : undefined}
            />
          </label>
          {error && (
            <div role="alert" className="message message-error">
              {error}
            </div>
          )}
          <button className="button button-primary button-full" disabled={pending}>
            {pending ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}{' '}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
            </>
          ) : (
            <>
              Já tem conta? <Link to="/entrar">Entre aqui</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
