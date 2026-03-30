import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, Sun, Moon, Loader2 } from 'lucide-react';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { DEPARTMENTS } from '../utils/permissions';

/* ================================================
   Animation variants
   ================================================ */

const brandingPanel = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

const logo = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.5, duration: 0.6, ease: 'easeOut' as const },
  },
} as const;

const brandText = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.75 + i * 0.15, duration: 0.5, ease: 'easeOut' as const },
  }),
};

/** Stagger container for form children */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
} as const;

/** Slide form in/out when switching login ↔ signup ↔ forgot */
const formSlide = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn' as const },
  }),
};

const shakeVariants = {
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.5 },
  },
};

/* ================================================
   Floating-label input
   ================================================ */

interface FloatingInputProps {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  required?: boolean;
  minLength?: number;
  isDark: boolean;
  children?: React.ReactNode; // right-side adornment
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  type = 'text',
  value,
  onChange,
  label,
  required,
  minLength,
  isDark,
  children,
}) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  const accentColor = isDark ? '#F3B229' : '#6A93C7';

  return (
    <motion.div className="relative" variants={fadeSlideUp}>
      <motion.label
        htmlFor={id}
        className="absolute left-3.5 pointer-events-none origin-left font-medium"
        animate={{
          top: active ? 4 : 14,
          fontSize: active ? '11px' : '14px',
          color: focused ? accentColor : isDark ? 'rgba(245,247,250,0.5)' : '#6B6B6B',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {label}
      </motion.label>
      <motion.input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        minLength={minLength}
        className={`
          w-full pt-5 pb-2 px-3.5 rounded-lg border outline-none text-sm font-medium transition-colors duration-200
          ${isDark
            ? 'bg-white/5 text-[#F5F7FA] border-white/10 hover:border-white/20'
            : 'bg-white text-[#2B2B2B] border-slate-200 hover:border-slate-300'
          }
          ${children ? 'pr-11' : ''}
        `}
        style={{
          borderColor: focused ? accentColor : undefined,
          boxShadow: focused ? `0 0 0 2.5px ${accentColor}25` : 'none',
        }}
      />
      {children}
    </motion.div>
  );
};

/* ================================================
   Floating-label select
   ================================================ */

interface FloatingSelectProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  required?: boolean;
  isDark: boolean;
  options: { value: string; label: string }[];
}

const FloatingSelect: React.FC<FloatingSelectProps> = ({
  id,
  value,
  onChange,
  label,
  required,
  isDark,
  options,
}) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  const accentColor = isDark ? '#F3B229' : '#6A93C7';

  return (
    <motion.div className="relative" variants={fadeSlideUp}>
      <motion.label
        htmlFor={id}
        className="absolute left-3.5 pointer-events-none origin-left font-medium z-10"
        animate={{
          top: active ? 4 : 14,
          fontSize: active ? '11px' : '14px',
          color: focused ? accentColor : isDark ? 'rgba(245,247,250,0.5)' : '#6B6B6B',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {label}
      </motion.label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className={`
          w-full pt-5 pb-2 px-3.5 rounded-lg border outline-none text-sm font-medium transition-colors duration-200 cursor-pointer appearance-none
          ${isDark
            ? 'bg-white/5 text-[#F5F7FA] border-white/10 hover:border-white/20'
            : 'bg-white text-[#2B2B2B] border-slate-200 hover:border-slate-300'
          }
        `}
        style={{
          borderColor: focused ? accentColor : undefined,
          boxShadow: focused ? `0 0 0 2.5px ${accentColor}25` : 'none',
        }}
      >
        <option value="" disabled hidden />
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </motion.div>
  );
};

/* ================================================
   Primary animated button
   ================================================ */

interface PrimaryButtonProps {
  loading: boolean;
  label: string;
  loadingLabel: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  loading,
  label,
  loadingLabel,
  icon,
  disabled,
}) => (
  <motion.button
    type="submit"
    disabled={disabled || loading}
    variants={fadeSlideUp}
    whileHover={!loading ? { scale: 1.03, boxShadow: '0 8px 30px rgba(243,178,41,0.35)' } : {}}
    whileTap={!loading ? { scale: 0.96 } : {}}
    className="relative w-full py-3.5 rounded-lg bg-[#F3B229] text-[#0D2A59] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#F3B229]/20 overflow-hidden"
  >
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.span
          key="loading"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingLabel}
        </motion.span>
      ) : (
        <motion.span
          key="idle"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2"
        >
          {icon}
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);

/* ================================================
   Main Auth component
   ================================================ */

const Auth: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [themeRotation, setThemeRotation] = useState(0);

  // Track direction for form slide: +1 = forward (login→signup), -1 = backward
  const [slideDir, setSlideDir] = useState(1);
  // Key for AnimatePresence to detect form change
  const formKey = isForgotPassword ? 'forgot' : isSignUp ? 'signup' : 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = isSignUp
        ? await signUp(email, password, name, department)
        : await signIn(email, password);

      if (error) {
        let msg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          msg = isSignUp
            ? 'Falha ao criar conta. Verifique se o email é válido e a senha tem pelo menos 6 caracteres.'
            : 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
        } else if (error.message.includes('Email not confirmed')) {
          msg = 'Por favor, confirme seu email antes de fazer login.';
        } else if (error.message.includes('Password should be at least')) {
          msg = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
          msg = 'Por favor, insira um endereço de email válido.';
        } else if (error.message.includes('User already registered')) {
          msg = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
        }
        setError(msg);
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const { error } = await resetPassword(email);
    if (error) {
      setError('Erro ao enviar email de recuperação.');
    } else {
      setSuccessMsg('Instruções de redefinição enviadas para seu email.');
    }
    setLoading(false);
  };

  const switchMode = (toSignUp: boolean) => {
    setSlideDir(toSignUp ? 1 : -1);
    setIsSignUp(toSignUp);
    setIsForgotPassword(false);
    setName('');
    setDepartment('');
    setError(null);
    setSuccessMsg(null);
  };

  const goForgotPassword = () => {
    setSlideDir(1);
    setIsForgotPassword(true);
    setError(null);
    setSuccessMsg(null);
  };

  const leaveForgotPassword = () => {
    setSlideDir(-1);
    setIsForgotPassword(false);
    setError(null);
    setSuccessMsg(null);
  };

  const handleToggleTheme = () => {
    setThemeRotation((r) => r + 360);
    toggleTheme();
  };

  const deptOptions = DEPARTMENTS.map((d) => ({ value: d, label: d }));

  /* ---- Render ---- */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* ============================================= */}
      {/* LEFT — Branding Panel                         */}
      {/* ============================================= */}
      <motion.div
        className={`relative hidden lg:flex lg:w-[55%] flex-col items-center justify-center overflow-hidden select-none transition-colors duration-300 ${
          isDark ? 'bg-[#040E1F]' : 'bg-[#0D2A59]'
        }`}
        variants={brandingPanel}
        initial="hidden"
        animate="visible"
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:48px_48px]" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-[#F3B229]/10 blur-[120px]"
          animate={{
            x: ['-10%', '5%', '-10%'],
            y: ['-8%', '6%', '-8%'],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '-15%', left: '-10%' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-[#6A93C7]/10 blur-[140px]"
          animate={{
            x: ['5%', '-8%', '5%'],
            y: ['4%', '-6%', '4%'],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '-18%', right: '-12%' }}
        />

        {/* Energy pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/[0.03]"
            style={{ width: 300 + i * 140, height: 300 + i * 140 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{
              duration: 5 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center gap-8 px-12">
          <motion.img
            src="/LOGO-DM.png"
            alt="EGEN Geradores"
            className="w-48 h-48 object-contain drop-shadow-2xl"
            draggable={false}
            variants={logo}
            initial="hidden"
            animate="visible"
          />
          <div className="text-center space-y-3">
            <motion.h1
              className="text-white text-4xl font-bold tracking-tight"
              variants={brandText}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              EGEN Geradores
            </motion.h1>
            <motion.p
              className="text-white/60 text-lg font-medium tracking-wide"
              variants={brandText}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              Sua energia sob controle.
            </motion.p>
          </div>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F3B229]/60 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
        />
      </motion.div>

      {/* ============================================= */}
      {/* RIGHT — Form Panel                            */}
      {/* ============================================= */}
      <div
        className={`relative flex-1 flex flex-col transition-colors duration-300 ${
          isDark ? 'bg-[#07152D]' : 'bg-[#F5F7FA]'
        }`}
      >
        {/* Theme Toggle with spin */}
        <div className="absolute top-5 right-5 z-20">
          <motion.button
            type="button"
            onClick={handleToggleTheme}
            className={`p-2.5 rounded-xl transition-colors duration-300 ${
              isDark ? 'hover:bg-white/5 text-[#F3B229]' : 'hover:bg-slate-100 text-[#0D2A59]'
            }`}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: themeRotation }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.span
                    key="sun"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-5 h-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile branding strip */}
        <div className="lg:hidden flex items-center justify-center gap-3 py-8 bg-[#0D2A59]">
          <img src="/LOGO-DM.png" alt="EGEN" className="w-12 h-12 object-contain" draggable={false} />
          <span className="text-white text-xl font-bold tracking-tight">EGEN Geradores</span>
        </div>

        {/* Centered form wrapper */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait" custom={slideDir}>
              <motion.div
                key={formKey}
                custom={slideDir}
                variants={formSlide}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-7"
              >
                {/* Header */}
                <motion.div variants={stagger} initial="hidden" animate="visible">
                  <motion.h2
                    variants={fadeSlideUp}
                    className={`text-2xl font-bold tracking-tight ${
                      isDark ? 'text-[#F5F7FA]' : 'text-[#2B2B2B]'
                    }`}
                  >
                    {isForgotPassword
                      ? 'Recuperar senha'
                      : isSignUp
                      ? 'Criar conta'
                      : 'Bem-vindo de volta'}
                  </motion.h2>
                  <motion.p
                    variants={fadeSlideUp}
                    className={`mt-1.5 text-sm ${
                      isDark ? 'text-white/50' : 'text-[#6B6B6B]'
                    }`}
                  >
                    {isForgotPassword
                      ? 'Informe seu email para receber instruções.'
                      : isSignUp
                      ? 'Preencha os dados para criar sua conta.'
                      : 'Faça login para acessar o sistema.'}
                  </motion.p>
                </motion.div>

                {/* Error message with shake */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate="shake"
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                      variants={shakeVariants}
                      onAnimationComplete={() => {
                        /* shake fires once, then stays visible */
                      }}
                      className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
                      style={{ opacity: 1 }}
                    >
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold">
                        !
                      </span>
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success message */}
                <AnimatePresence>
                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="p-3.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                    >
                      {successMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ---- Forgot Password Form ---- */}
                {isForgotPassword ? (
                  <motion.form
                    onSubmit={handleForgotPassword}
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="space-y-5"
                  >
                    <FloatingInput
                      id="email-reset"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      label="Email"
                      required
                      isDark={isDark}
                    />

                    <PrimaryButton
                      loading={loading}
                      label="Enviar instruções"
                      loadingLabel="Enviando..."
                      icon={null}
                    />

                    <motion.button
                      type="button"
                      variants={fadeSlideUp}
                      onClick={leaveForgotPassword}
                      className="w-full text-center text-sm font-medium text-[#6A93C7] hover:underline underline-offset-4 transition-colors"
                    >
                      Voltar ao login
                    </motion.button>
                  </motion.form>
                ) : (
                  /* ---- Login / Sign-up Form ---- */
                  <motion.form
                    onSubmit={handleSubmit}
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="space-y-5"
                  >
                    <FloatingInput
                      id="email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      label="Email"
                      required
                      isDark={isDark}
                    />

                    <AnimatePresence>
                      {isSignUp && (
                        <motion.div
                          key="name-field"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <FloatingInput
                            id="name"
                            value={name}
                            onChange={setName}
                            label="Nome Completo"
                            required
                            isDark={isDark}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <FloatingInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={setPassword}
                      label="Senha"
                      required
                      minLength={6}
                      isDark={isDark}
                    >
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                          isDark
                            ? 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </FloatingInput>

                    <AnimatePresence>
                      {isSignUp && (
                        <motion.div
                          key="dept-field"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <FloatingSelect
                            id="department"
                            value={department}
                            onChange={setDepartment}
                            label="Departamento"
                            required
                            isDark={isDark}
                            options={deptOptions}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isSignUp && (
                      <motion.div variants={fadeSlideUp} className="flex justify-end">
                        <button
                          type="button"
                          onClick={goForgotPassword}
                          className="text-sm font-medium text-[#6A93C7] hover:underline underline-offset-4 transition-colors"
                        >
                          Esqueci minha senha
                        </button>
                      </motion.div>
                    )}

                    <PrimaryButton
                      loading={loading}
                      label={isSignUp ? 'Criar Conta' : 'Entrar'}
                      loadingLabel={isSignUp ? 'Criando conta...' : 'Entrando...'}
                      icon={isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    />
                  </motion.form>
                )}

                {/* Toggle login / sign-up */}
                {!isForgotPassword && (
                  <motion.p
                    variants={fadeSlideUp}
                    initial="hidden"
                    animate="visible"
                    className={`text-center text-sm ${
                      isDark ? 'text-white/40' : 'text-[#6B6B6B]'
                    }`}
                  >
                    {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(!isSignUp)}
                      className="font-semibold text-[#6A93C7] hover:underline underline-offset-4 transition-colors"
                    >
                      {isSignUp ? 'Faça login' : 'Cadastre-se'}
                    </button>
                  </motion.p>
                )}

                {/* Sign-up info note */}
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-lg text-xs leading-relaxed border ${
                        isDark
                          ? 'bg-[#6A93C7]/10 border-[#6A93C7]/20 text-[#6A93C7]'
                          : 'bg-[#6A93C7]/5 border-[#6A93C7]/15 text-[#0D2A59]'
                      }`}
                    >
                      <strong>Nota:</strong> Após criar sua conta, você poderá acessar o sistema de
                      Compras e Estoque.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;