import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routePaths'
import PublicLayout from '../layouts/PublicLayout'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import RequireAuthRoute from './RequireAuthRoute'
import RequireAdminRoute from './RequireAdminRoute'

import Home from '../pages/public/Home'
import Login from '../pages/auth/Login'
import Cadastro from '../pages/auth/Cadastro'
import Dashboard from '../pages/cliente/Dashboard'
import AdminKanban from '../pages/admin/AdminKanban'
import AdminFichas from '../pages/admin/AdminFichas'
import AdminClientes from '../pages/admin/AdminClientes'
import AdminCustos from '../pages/admin/AdminCustos'
import AdminEstoque from '../pages/admin/AdminEstoque'
import AdminPedidos from '../pages/admin/AdminPedidos'
import AdminFinanceiroDashboard from '../pages/admin/AdminFinanceiroDashboard'
import MeuPerfil from '../pages/cliente/MeuPerfil'
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
        <Route path={ROUTES.CATALOGO} element={<Catalogo />} />
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
        </Route>
      </Route>

      <Route element={<RequireAuthRoute />}>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.MEUS_PEDIDOS} element={<MeusPedidos />} />
          <Route path={ROUTES.MEU_PERFIL} element={<MeuPerfil />} />
        </Route>
      </Route>

      <Route element={<RequireAdminRoute />}>
        <Route path={ROUTES.ADMIN_PEDIDOS} element={<AdminPedidos />} />
        <Route path={ROUTES.ADMIN_FICHAS} element={<AdminFichas />} />
        <Route path={ROUTES.ADMIN_CLIENTES} element={<AdminClientes />} />
        <Route path={ROUTES.ADMIN_KANBAN} element={<AdminKanban />} />
        <Route path={ROUTES.ADMIN_CUSTOS} element={<AdminCustos />} />
        <Route path={ROUTES.ADMIN_ESTOQUE} element={<AdminEstoque />} />
        <Route path={ROUTES.ADMIN_FINANCEIRO_DASHBOARD} element={<AdminFinanceiroDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}
