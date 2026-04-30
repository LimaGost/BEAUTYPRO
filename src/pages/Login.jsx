import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, User, Lock, Mail, Phone, CreditCard } from 'lucide-react';

// ── Masks ─────────────────────────────────────────────────────────────────────

function maskCPF(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({ icon: Icon, label, error, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.25)' }} />
        {children}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
}

// Base input style — fundo escuro para harmonizar com o tema preto
const inp = [
  'w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium',
  'text-white',
  'transition-all duration-150',
  'focus:outline-none',
  // cor de fundo escura (não branca)
].join(' ');

const inpStyle = {
  background: '#1C1C1E',
  border: '1px solid rgba(255,255,255,0.10)',
};

const inpFocusStyle = { border: '1px solid rgba(201,168,97,0.6)', boxShadow: '0 0 0 3px rgba(201,168,97,0.12)' };

// ── DarkInput ────────────────────────────────────────────────────────────────

function DarkInput({ className = '', style = {}, valid, ...props }) {
  const [focused, setFocused] = useState(false);

  const borderColor = valid === true
    ? 'rgba(34,197,94,0.55)'
    : valid === false
    ? 'rgba(239,68,68,0.55)'
    : focused
    ? 'rgba(201,168,97,0.6)'
    : 'rgba(255,255,255,0.10)';

  const shadow = focused
    ? valid === true  ? '0 0 0 3px rgba(34,197,94,0.12)'
    : valid === false ? '0 0 0 3px rgba(239,68,68,0.12)'
    : '0 0 0 3px rgba(201,168,97,0.12)'
    : 'none';

  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
      className={`${inp} ${className}`}
      style={{ background: '#1C1C1E', border: `1px solid ${borderColor}`, boxShadow: shadow, ...style }}
    />
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function Section({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A861' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.30)' }}>
          {label}
        </span>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A861' }} />
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');

  // Login
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [name,            setName]            = useState('');
  const [cpf,             setCpf]             = useState('');
  const [regEmail,        setRegEmail]        = useState('');
  const [phone,           setPhone]           = useState('');
  const [regPassword,     setRegPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  const switchMode = (m) => { setMode(m); setError(''); };

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === regPassword;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== regPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!name.trim())             return setError('Informe seu nome completo.');
      if (!regEmail)                return setError('Informe seu e-mail.');
      if (regPassword.length < 6)   return setError('A senha deve ter pelo menos 6 caracteres.');
      if (regPassword !== confirmPassword) return setError('As senhas não coincidem.');
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          name:     name.trim(),
          email:    regEmail,
          phone:    phone.replace(/\D/g, ''),
          cpf:      cpf.replace(/\D/g, ''),
          password: regPassword,
        });
      }
    } catch (err) {
      try   { setError(JSON.parse(err.message).error || err.message); }
      catch { setError(err.message || 'Erro ao processar. Tente novamente.'); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#080808',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-start px-6 pt-12 pb-10 overflow-y-auto">

        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #C9A861 0%, #E5D4A8 100%)',
              boxShadow: '0 8px 32px rgba(201,168,97,0.25)',
            }}
          >
            <span className="text-3xl font-black text-black">B</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Beauty<span style={{ color: '#C9A861' }}>Pro</span>
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {mode === 'login' ? 'Bem-vinda de volta' : 'Crie sua conta gratuitamente'}
          </p>
        </motion.div>

        {/* ── Mode toggle ── */}
        <div
          className="flex p-1 mb-7 w-full max-w-sm rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { key: 'login',    label: 'Entrar' },
            { key: 'register', label: 'Criar conta' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={
                mode === key
                  ? { background: '#fff', color: '#000', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3.5">

          {/* Login fields */}
          {mode === 'login' && (
            <motion.div
              key="login-fields"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3.5"
            >
              <Field icon={Mail} label="E-mail">
                <DarkInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  inputMode="email"
                  style={{ color: email ? '#fff' : undefined }}
                />
              </Field>

              <Field icon={Lock} label="Senha">
                <DarkInput
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </Field>
            </motion.div>
          )}

          {/* Register fields */}
          {mode === 'register' && (
            <AnimatePresence mode="wait">
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                {/* — Dados Pessoais — */}
                <Section label="Dados Pessoais" />

                <Field icon={User} label="Nome Completo *">
                  <DarkInput
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    autoComplete="name"
                  />
                </Field>

                <Field icon={CreditCard} label="CPF *">
                  <DarkInput
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                  />
                </Field>

                <Field icon={Mail} label="E-mail *">
                  <DarkInput
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </Field>

                <Field icon={Phone} label="Telefone *">
                  <DarkInput
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    required
                    autoComplete="tel"
                  />
                </Field>

                {/* — Segurança — */}
                <Section label="Segurança" />

                <Field icon={Lock} label="Senha *">
                  <DarkInput
                    type={showPass ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>

                <Field icon={Lock} label="Confirmar Senha *">
                  <DarkInput
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    autoComplete="new-password"
                    className="pr-12"
                    valid={passwordsMatch ? true : passwordsMismatch ? false : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>

                {/* Password match feedback */}
                <AnimatePresence>
                  {confirmPassword.length > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs pl-1 font-medium"
                      style={{ color: passwordsMatch ? '#4ade80' : '#f87171' }}
                    >
                      {passwordsMatch ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl px-4 py-3 text-sm text-center font-medium"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.20)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-base text-black transition-opacity disabled:opacity-60 mt-1"
            style={{
              background: 'linear-gradient(135deg, #C9A861 0%, #E5D4A8 100%)',
              boxShadow: '0 4px 20px rgba(201,168,97,0.30)',
            }}
          >
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              : mode === 'login' ? 'Entrar' : 'Criar conta'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
