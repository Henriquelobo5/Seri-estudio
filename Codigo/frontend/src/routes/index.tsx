import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routePaths'
import PublicLayout from '../layouts/PublicLayout'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import RequireAuthRoute from './RequireAuthRoute'

import Home from '../pages/public/Home'
import Login from '../pages/auth/Login'
import Cadastro from '../pages/auth/Cadastro'
import Dashboard from '../pages/cliente/Dashboard'
import ConstrutorFichaTecnica from '../pages/public/ConstrutorFichaTecnica'
import DetalhesProduto from '../pages/public/DetalhesProduto'
import DetalhesPedido from '../pages/public/DetalhesPedido'
import Confirmacao from '../pages/public/Confirmacao'
import MeusPedidos from '../pages/public/MeusPedidos'
import Catalogo from '../pages/public/Catalogo'

export default function RoutesApp() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
      </Route>

      {/* Rotas apenas para usuários não autenticados */}
      <Route element={<PublicOnlyRoute />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.CADASTRO} element={<Cadastro />} />
      </Route>

      {/* Rotas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.CRIAR_FICHA} element={<ConstrutorFichaTecnica />} />
          <Route path={ROUTES.DETALHES_PRODUTO} element={<DetalhesProduto />} />
          <Route path={ROUTES.DETALHES_PEDIDO} element={<DetalhesPedido />} />
          <Route path={ROUTES.CONFIRMACAO} element={<Confirmacao />} />
          <Route path={ROUTES.CATALOGO} element={<Catalogo />} />
        </Route>
      </Route>

      <Route element={<RequireAuthRoute />}>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.MEUS_PEDIDOS} element={<MeusPedidos />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}
