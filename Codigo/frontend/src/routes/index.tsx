import { Routes, Route } from 'react-router-dom'
import { ROUTES } from './routePaths'
import PublicLayout from '../layouts/PublicLayout'

import Home from '../pages/public/Home'
import Login from '../pages/auth/Login'
import Cadastro from '../pages/auth/Cadastro'

export default function RoutesApp() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.CADASTRO} element={<Cadastro />} />
      </Route>
    </Routes>
  )
}