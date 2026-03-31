import React, { useState, useMemo } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, Sun, Moon, Loader2, Check, X, Mail, Lock, AlertCircle } from 'lucide-react';
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
   Shimmer Footer Component
   ================================================ */

const ShimmerFooter: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden z-30">
    {/* Base gradient layer with smooth transition */}
    <div
      className={`absolute inset-0 transition-all duration-500 ${
        isDark
          ? 'bg-gradient-to-r from-[#07152D] via-[#0D2A59] to-[#07152D]'
          : 'bg-gradient-to-r from-[#F5F7FA] via-[#0D2A59]/10 to-[#F5F7FA]'
      }`}
    />
    
    {/* Animated shimmer layer - uses CSS animation for smooth theme transitions */}
    <div
      className="absolute inset-0 animate-shimmer-slide"
      style={{
        background: `linear-gradient(
          90deg,
          transparent 0%,
          transparent 20%,
          rgba(243, 178, 41, 0.5) 30%,
          rgba(106, 147, 199, 0.6) 50%,
          rgba(243, 178, 41, 0.5) 70%,
          transparent 80%,
          transparent 100%
        )`,
        backgroundSize: '200% 100%',
      }}
    />
    
    {/* Secondary subtle shimmer for depth */}
    <div
      className="absolute inset-0 opacity-50 animate-shimmer-slide-slow"
      style={{
        background: `linear-gradient(
          90deg,
          transparent 0%,
          rgba(13, 42, 89, 0.25) 25%,
          rgba(122, 193, 95, 0.25) 50%,
          rgba(13, 42, 89, 0.25) 75%,
          transparent 100%
        )`,
        backgroundSize: '300% 100%',
      }}
    />
    
    {/* Glow effect on top with smooth transition */}
    <div
      className={`absolute inset-x-0 -top-2 h-3 blur-sm transition-all duration-500 ${
        isDark
          ? 'bg-gradient-to-r from-transparent via-[#F3B229]/20 to-transparent'
          : 'bg-gradient-to-r from-transparent via-[#F3B229]/30 to-transparent'
      }`}
    />
  </div>
);

/* ================================================
   Email Validation
   ================================================ */

const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) return { isValid: false, message: '' };
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Formato de email inválido' };
  }
  
  // Check for common typos
  const commonDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  // Check for obvious typos in common domains
  const typoPatterns: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmil.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmial.com': 'hotmail.com',
    'outloo.com': 'outlook.com',
    'outlok.com': 'outlook.com',
  };
  
  if (typoPatterns[domain]) {
    return { isValid: false, message: `Você quis dizer @${typoPatterns[domain]}?` };
  }
  
  return { isValid: true, message: 'Email válido' };
};

interface EmailValidationBadgeProps {
  email: string;
  isDark: boolean;
  touched: boolean;
}

const EmailValidationBadge: React.FC<EmailValidationBadgeProps> = ({ email, isDark, touched }) => {
  const validation = validateEmail(email);
  
  if (!touched || !email) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="mt-2 flex items-center gap-2"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          validation.isValid
            ? 'bg-[#7AC15F]/20 text-[#7AC15F]'
            : 'bg-[#E5484D]/20 text-[#E5484D]'
        }`}
      >
        {validation.isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      </motion.div>
      <span
        className={`text-xs font-medium ${
          validation.isValid
            ? 'text-[#7AC15F]'
            : 'text-[#E5484D]'
        }`}
      >
        {validation.message}
      </span>
    </motion.div>
  );
};

/* ================================================
   Password Strength Validation
   ================================================ */

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'Mínimo 6 caracteres', test: (p) => p.length >= 6 },
  { label: 'Letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Número', test: (p) => /\d/.test(p) },
  { label: 'Caractere especial (!@#$...)', test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(p) },
];

const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: '', color: '' };
  
  const passedRequirements = passwordRequirements.filter(req => req.test(password)).length;
  const percentage = (passedRequirements / passwordRequirements.length) * 100;
  
  if (percentage <= 20) return { score: percentage, label: 'Muito fraca', color: '#E5484D' };
  if (percentage <= 40) return { score: percentage, label: 'Fraca', color: '#F3B229' };
  if (percentage <= 60) return { score: percentage, label: 'Média', color: '#F3B229' };
  if (percentage <= 80) return { score: percentage, label: 'Boa', color: '#6A93C7' };
  return { score: percentage, label: 'Excelente', color: '#7AC15F' };
};

interface PasswordStrengthIndicatorProps {
  password: string;
  isDark: boolean;
  touched: boolean;
  showRequirements: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  isDark,
  touched,
  showRequirements,
}) => {
  const strength = calculatePasswordStrength(password);
  
  if (!touched || !password) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 space-y-3"
    >
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              Força da senha
            </span>
          </div>
          <motion.span
            key={strength.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-semibold"
            style={{ color: strength.color }}
          >
            {strength.label}
          </motion.span>
        </div>
        
        {/* Progress bar */}
        <div
          className={`h-1.5 rounded-full overflow-hidden ${
            isDark ? 'bg-white/10' : 'bg-slate-200'
          }`}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${strength.score}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ backgroundColor: strength.color }}
          />
        </div>
      </div>
      
      {/* Requirements checklist */}
      {showRequirements && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-3 rounded-lg border ${
            isDark
              ? 'bg-white/5 border-white/10'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {passwordRequirements.map((req, index) => {
              const passed = req.test(password);
              return (
                <motion.div
                  key={req.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    initial={false}
                    animate={{
                      scale: passed ? [1, 1.2, 1] : 1,
                      backgroundColor: passed
                        ? 'rgba(122, 193, 95, 0.2)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <AnimatePresence mode="wait">
                      {passed ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-2.5 h-2.5 text-[#7AC15F]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDark ? 'bg-white/30' : 'bg-slate-300'
                          }`}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span
                    className={`text-xs transition-colors duration-200 ${
                      passed
                        ? 'text-[#7AC15F] font-medium'
                        : isDark
                        ? 'text-white/40'
                        : 'text-slate-400'
                    }`}
                  >
                    {req.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
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
  onBlur?: () => void;
  onFocus?: () => void;
  hasError?: boolean;
  hasSuccess?: boolean;
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
  onBlur,
  onFocus,
  hasError,
  hasSuccess,
}) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  
  // Determine accent color based on validation state
  let accentColor = isDark ? '#F3B229' : '#6A93C7';
  if (hasError && !focused) accentColor = '#E5484D';
  if (hasSuccess && !focused) accentColor = '#7AC15F';

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

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
        onFocus={handleFocus}
        onBlur={handleBlur}
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
          borderColor: focused ? accentColor : (hasError ? '#E5484D' : (hasSuccess ? '#7AC15F' : undefined)),
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
  
  // Validation states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Computed validation states
  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const isFormValid = useMemo(() => {
    if (isSignUp) {
      return emailValidation.isValid && 
             password.length >= 6 && 
             name.trim().length > 0 && 
             department.length > 0;
    }
    return email.length > 0 && password.length > 0;
  }, [isSignUp, emailValidation.isValid, password, name, department, email]);

  // Track direction for form slide: +1 = forward (login→signup), -1 = backward
  const [slideDir, setSlideDir] = useState(1);
  // Key for AnimatePresence to detect form change
  const formKey = isForgotPassword ? 'forgot' : isSignUp ? 'signup' : 'login';

  /**
   * Traduz mensagens de erro do Supabase Auth para português
   */
  const translateAuthError = (errorMessage: string, isSignUpContext: boolean): string => {
    const msg = errorMessage.toLowerCase();
    
    // Credenciais inválidas
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return isSignUpContext
        ? 'Falha ao criar conta. Verifique se o email é válido e a senha tem pelo menos 6 caracteres.'
        : 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    }
    
    // Email não confirmado
    if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
      return 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada e spam.';
    }
    
    // Senha muito curta
    if (msg.includes('password should be at least') || msg.includes('password is too short')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    
    // Senha muito fraca
    if (msg.includes('weak password') || msg.includes('password is too weak')) {
      return 'A senha é muito fraca. Use letras maiúsculas, minúsculas, números e símbolos.';
    }
    
    // Email inválido
    if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
      return 'Por favor, insira um endereço de email válido.';
    }
    
    // Usuário já cadastrado
    if (msg.includes('user already registered') || msg.includes('email already registered') || msg.includes('already exists')) {
      return 'Este email já está cadastrado. Tente fazer login ou use outro email.';
    }
    
    // Rate limiting / muitas tentativas
    if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('request rate limit')) {
      return 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.';
    }
    
    // Conta desabilitada ou banida
    if (msg.includes('user is banned') || msg.includes('account disabled') || msg.includes('user disabled')) {
      return 'Esta conta foi desabilitada. Entre em contato com o administrador.';
    }
    
    // Signup desabilitado
    if (msg.includes('signups not allowed') || msg.includes('signup is disabled')) {
      return 'Novos cadastros estão temporariamente desabilitados. Tente novamente mais tarde.';
    }
    
    // Token expirado ou inválido
    if (msg.includes('token expired') || msg.includes('invalid token') || msg.includes('otp has expired')) {
      return 'O link expirou. Por favor, solicite um novo.';
    }
    
    // Erro de rede / conexão
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection') || msg.includes('timeout')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    // Email não encontrado (para reset de senha)
    if (msg.includes('user not found') || msg.includes('no user found')) {
      return 'Nenhuma conta encontrada com este email.';
    }
    
    // Credenciais antigas / sessão expirada
    if (msg.includes('refresh_token') || msg.includes('session') || msg.includes('jwt expired')) {
      return 'Sua sessão expirou. Por favor, faça login novamente.';
    }
    
    // Campos obrigatórios
    if (msg.includes('provide') && (msg.includes('email') || msg.includes('password'))) {
      return 'Por favor, preencha todos os campos obrigatórios.';
    }

    // Confirmação de email necessária (pode não ser um erro, mas uma confirmação)
    if (msg.includes('confirmation') || msg.includes('verify your email')) {
      return 'Verifique seu email para confirmar o cadastro.';
    }
    
    // Erro genérico - mantém a mensagem original se não reconhecida
    return `Erro: ${errorMessage}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Validação básica no frontend
    if (!email.trim()) {
      setError('Por favor, insira seu email.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Por favor, insira sua senha.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (isSignUp && !name.trim()) {
      setError('Por favor, insira seu nome completo.');
      setLoading(false);
      return;
    }

    if (isSignUp && !department) {
      setError('Por favor, selecione seu departamento.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password, name, department);
        
        if (error) {
          setError(translateAuthError(error.message, true));
          return;
        }
        
        // Cadastro bem-sucedido - verificar se precisa confirmar email
        if (data?.user && !data.session) {
          // Usuário criado, mas sem sessão = precisa confirmar email
          setSuccessMsg('Conta criada com sucesso! Verifique seu email para confirmar o cadastro. Não esqueça de checar a pasta de spam.');
          setEmail('');
          setPassword('');
          setName('');
          setDepartment('');
        } else if (data?.user && data.session) {
          // Cadastro instantâneo sem necessidade de confirmação (quando desabilitado no Supabase)
          // Sucesso - o usuário será redirecionado automaticamente pelo useAuth
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          setError(translateAuthError(error.message, false));
        }
        // Sucesso - o usuário será redirecionado automaticamente pelo useAuth
      }
    } catch (err) {
      // Erro inesperado (ex: exceção JavaScript)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(translateAuthError(errorMessage, isSignUp));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Validação básica
    if (!email.trim()) {
      setError('Por favor, insira seu email.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(translateAuthError(error.message, false));
      } else {
        setSuccessMsg('Instruções de redefinição de senha foram enviadas para seu email. Verifique também a pasta de spam.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(translateAuthError(errorMessage, false));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (toSignUp: boolean) => {
    setSlideDir(toSignUp ? 1 : -1);
    setIsSignUp(toSignUp);
    setIsForgotPassword(false);
    setName('');
    setDepartment('');
    setError(null);
    setSuccessMsg(null);
    // Reset validation states
    setEmailTouched(false);
    setPasswordTouched(false);
    setPasswordFocused(false);
  };

  const goForgotPassword = () => {
    setSlideDir(1);
    setIsForgotPassword(true);
    setError(null);
    setSuccessMsg(null);
    setEmailTouched(false);
    setPasswordTouched(false);
    setPasswordFocused(false);
  };

  const leaveForgotPassword = () => {
    setSlideDir(-1);
    setIsForgotPassword(false);
    setError(null);
    setSuccessMsg(null);
    setEmailTouched(false);
    setPasswordTouched(false);
    setPasswordFocused(false);
  };

  const handleToggleTheme = () => {
    setThemeRotation((r) => r + 360);
    toggleTheme();
  };

  const deptOptions = DEPARTMENTS.map((d) => ({ value: d, label: d }));

  /* ---- Render ---- */
  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">
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

        <div className="relative z-10 flex flex-col items-center gap-6 px-12">
          <motion.img
            src="/LOGO-LOGIN.png"
            alt="EGEN Geradores"
            className="w-72 h-auto object-contain drop-shadow-2xl"
            draggable={false}
            variants={logo}
            initial="hidden"
            animate="visible"
          />
          <motion.p
            className="text-white/60 text-lg font-medium tracking-wide text-center"
            variants={brandText}
            custom={0}
            initial="hidden"
            animate="visible"
          >
            Energia onde e quando precisar.
          </motion.p>
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
        <div className="lg:hidden flex items-center justify-center py-6 bg-[#0D2A59]">
          <img src="/LOGO-LOGIN.png" alt="EGEN Geradores" className="h-16 w-auto object-contain" draggable={false} />
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
                    {/* Email field with validation */}
                    <div>
                      <FloatingInput
                        id="email"
                        type="email"
                        value={email}
                        onChange={(v) => {
                          setEmail(v);
                          if (!emailTouched) setEmailTouched(true);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        label="Email"
                        required
                        isDark={isDark}
                        hasError={isSignUp && emailTouched && email.length > 0 && !emailValidation.isValid}
                        hasSuccess={isSignUp && emailTouched && email.length > 0 && emailValidation.isValid}
                      />
                      {/* Email validation badge - only on signup */}
                      <AnimatePresence>
                        {isSignUp && (
                          <EmailValidationBadge
                            email={email}
                            isDark={isDark}
                            touched={emailTouched}
                          />
                        )}
                      </AnimatePresence>
                    </div>

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

                    {/* Password field with strength indicator */}
                    <div>
                      <FloatingInput
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(v) => {
                          setPassword(v);
                          if (!passwordTouched) setPasswordTouched(true);
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => {
                          setPasswordTouched(true);
                          setPasswordFocused(false);
                        }}
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
                      
                      {/* Password strength indicator - only on signup */}
                      <AnimatePresence>
                        {isSignUp && (
                          <PasswordStrengthIndicator
                            password={password}
                            isDark={isDark}
                            touched={passwordTouched}
                            showRequirements={passwordFocused || (passwordTouched && password.length > 0 && password.length < 6)}
                          />
                        )}
                      </AnimatePresence>
                    </div>

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
                      disabled={isSignUp && !isFormValid}
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
                      <strong>Nota:</strong> Após criar sua conta, você receberá um email de confirmação.
                      Clique no link enviado para ativar sua conta e acessar o sistema.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Shimmer Footer Animation */}
      <ShimmerFooter isDark={isDark} />
    </div>
  );
};

export default Auth;