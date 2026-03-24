import { Routes, Route } from 'react-router-dom'
import { ROUTES } from './routePaths'
import PublicLayout from '../layouts/PublicLayout'

import Home from '../pages/public/Home'
import Login from '../pages/auth/Login'
import Cadastro from '../pages/auth/Cadastro'
import Dashboard from '../pages/cliente/Dashboard'
import ConstrutorFichaTecnica from '../pages/public/ConstrutorFichaTecnica'

export default function RoutesApp() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.CADASTRO} element={<Cadastro />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.CRIAR_FICHA} element={<ConstrutorFichaTecnica />} />
      </Route>
    </Routes>
  )
}