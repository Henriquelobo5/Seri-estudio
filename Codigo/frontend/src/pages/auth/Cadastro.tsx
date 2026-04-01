import { ChangeEvent, FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'
import { loginRequest, registerRequest } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageTransition from '../../components/PageTransition'

const onlyDigits = (value: string) => value.replace(/\D/g, '')

const formatCpfCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

const formatWhatsapp = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

export default function Cadastro() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [endereco, setEndereco] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (nome.trim().length < 3) {
      setError('Informe um nome válido com pelo menos 3 caracteres.')
      return
    }

    const emailValido = /\S+@\S+\.\S+/.test(email)
    if (!emailValido) {
      setError('Informe um e-mail válido.')
      return
    }

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    try {
      setLoading(true)

      await registerRequest({
        nome,
        email,
        senha,
        tipoUsuario: 'CLIENTE',
        cpfCnpj: onlyDigits(cpfCnpj),
        whatsapp: onlyDigits(whatsapp),
        endereco,
      })

      const token = await loginRequest(email, senha)
      setAuth(token, { email, name: nome })
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar usuário.')
    } finally {
      setLoading(false)
    }
  }

  const onInput =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
    }

  const onCpfCnpjInput = (event: ChangeEvent<HTMLInputElement>) => {
    setCpfCnpj(formatCpfCnpj(event.target.value))
  }

  const onWhatsappInput = (event: ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsapp(event.target.value))
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F0EBE3] flex items-center justify-center px-4 py-10 animate-fadeIn">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-sm p-8 border border-[#EEE8DF] transition-all duration-300 animate-slideUp">
          <Link to={ROUTES.LOGIN} className="text-[#2A5E40] text-2xl font-bold mb-8 inline-block hover:opacity-80 transition-opacity animate-fadeIn-delay-100">
            Seri.
          </Link>

          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2 animate-fadeIn-delay-200">Criar conta</h1>
          <p className="text-[#888] text-sm mb-6 animate-fadeIn-delay-200">Preencha os dados para cadastrar.</p>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
            <div className="md:col-span-2 animate-fadeIn-delay-300">
              <label className="block text-sm text-[#444] mb-1.5">Nome</label>
              <input
                required
                value={nome}
                onChange={onInput(setNome)}
                disabled={loading}
                className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm disabled:opacity-50 transition-opacity"
              />
            </div>

            <div className="md:col-span-2 animate-fadeIn-delay-300">
              <label className="block text-sm text-[#444] mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={onInput(setEmail)}
                disabled={loading}
                className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm disabled:opacity-50 transition-opacity"
              />
            </div>

            <div className="md:col-span-2 animate-fadeIn-delay-300">
              <label className="block text-sm text-[#444] mb-1.5">Senha</label>
              <input
                type="password"
              required
              value={senha}
              onChange={onInput(setSenha)}
              disabled={loading}
              className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm disabled:opacity-50 transition-opacity"
            />
          </div>

          <div className="animate-fadeIn-delay-300">
            <label className="block text-sm text-[#444] mb-1.5">CPF/CNPJ</label>
            <input
              value={cpfCnpj}
              onChange={onCpfCnpjInput}
              inputMode="numeric"
              disabled={loading}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm disabled:opacity-50 transition-opacity"
            />
          </div>

          <div className="animate-fadeIn-delay-300">
            <label className="block text-sm text-[#444] mb-1.5">WhatsApp</label>
            <input
              value={whatsapp}
              onChange={onWhatsappInput}
              inputMode="numeric"
              disabled={loading}
              placeholder="(00) 00000-0000"
              className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm disabled:opacity-50 transition-opacity"
            />
          </div>

          <div className="md:col-span-2 animate-fadeIn-delay-300">
            <label className="block text-sm text-[#444] mb-1.5">Endereço</label>
            <input
              value={endereco}
              onChange={onInput(setEndereco)}
              disabled={loading}
              className="w-full border border-[#D5CCC0] bg-white rounded-lg px-4 py-3 text-sm disabled:opacity-50 transition-opacity"
            />
          </div>

          {error && <p className="md:col-span-2 text-sm text-red-600 animate-slideDown">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full bg-[#2A5E40] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#1D4A2F] transition-all duration-200 disabled:opacity-70 flex items-center justify-center animate-fadeIn-delay-400"
          >
            {loading ? <LoadingSpinner /> : 'Cadastrar e entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-[#888] mt-6 animate-fadeIn-delay-400">
          Já tem conta?{' '}
          <Link to={ROUTES.LOGIN} className="text-[#2A5E40] font-medium hover:underline transition-colors">
            Entrar
          </Link>
        </p>
        </div>
      </div>
    </PageTransition>
  )
}