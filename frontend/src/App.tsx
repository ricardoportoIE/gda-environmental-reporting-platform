import { useQuery } from '@tanstack/react-query'
import { Leaf } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { ApiError, api } from './api'
import { Footer, Header } from './shared/Layout'
import { isStaff } from './shared/report-ui'
import type { User } from './types'

const Users = lazy(() => import('./features/admin/Users').then(({ Users }) => ({ default: Users })))
const AuthPage = lazy(() =>
  import('./features/auth/AuthPage').then(({ AuthPage }) => ({ default: AuthPage })),
)
const Home = lazy(() => import('./features/home/Home').then(({ Home }) => ({ default: Home })))
const NewReport = lazy(() =>
  import('./features/reports/NewReport').then(({ NewReport }) => ({ default: NewReport })),
)
const ReportDetail = lazy(() =>
  import('./features/reports/ReportDetail').then(({ ReportDetail }) => ({ default: ReportDetail })),
)
const Reports = lazy(() =>
  import('./features/reports/Reports').then(({ Reports }) => ({ default: Reports })),
)

function Protected({
  user,
  children,
  staff,
  admin,
}: {
  user: User | null
  children: ReactNode
  staff?: boolean
  admin?: boolean
}) {
  if (!user) return <Navigate to="/entrar" replace />
  if ((staff && !isStaff(user.role)) || (admin && user.role !== 'admin'))
    return <Navigate to="/" replace />
  return children
}

export default function App() {
  const session = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.me()
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null
        throw error
      }
    },
    retry: false,
  })
  if (session.isLoading)
    return (
      <div className="app-loading">
        <Leaf size={32} /> Carregando GDA...
      </div>
    )
  const user = session.data || null
  return (
    <div className="app">
      <Header user={user} />
      <Suspense
        fallback={
          <main className="app-loading" role="status">
            <Leaf size={32} /> Carregando página...
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route
            path="/entrar"
            element={user ? <Navigate to="/denuncias" /> : <AuthPage mode="login" />}
          />
          <Route
            path="/cadastro"
            element={user ? <Navigate to="/denuncias" /> : <AuthPage mode="register" />}
          />
          <Route path="/nova-denuncia" element={<NewReport />} />
          <Route
            path="/denuncias"
            element={
              <Protected user={user}>
                <Reports user={user!} />
              </Protected>
            }
          />
          <Route path="/denuncias/:id" element={<ReportDetail user={user} />} />
          <Route
            path="/usuarios"
            element={
              <Protected user={user} admin>
                <Users />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  )
}
