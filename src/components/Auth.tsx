import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DEPARTMENTS } from "../utils/permissions";

const Auth: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password, name, department)
        : await signIn(email, password);

      if (error) {
        // Provide more user-friendly error messages
        let userFriendlyMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          userFriendlyMessage = isSignUp 
            ? 'Falha ao criar conta. Verifique se o email é válido e a senha tem pelo menos 6 caracteres.'
            : 'Email ou senha incorretos. Verifique suas credenciais e tente novamente. Se você não tem uma conta, clique em "Cadastre-se".';
        } else if (error.message.includes('Email not confirmed')) {
          userFriendlyMessage = 'Por favor, confirme seu email antes de fazer login.';
        } else if (error.message.includes('Password should be at least')) {
          userFriendlyMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
          userFriendlyMessage = 'Por favor, insira um endereço de email válido.';
        } else if (error.message.includes('User already registered')) {
          userFriendlyMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
        }
        
        setError(userFriendlyMessage);
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-egen-bg dark:bg-egen-dark-bg flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-r from-[#0D2A59]/20 to-[#6A93C7]/20 dark:from-[#0D2A59]/40 dark:to-[#6A93C7]/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gradient-to-r from-[#F3B229]/15 to-[#0D2A59]/15 dark:from-[#F3B229]/10 dark:to-[#0D2A59]/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#6A93C7]/10 to-[#0D2A59]/10 dark:from-[#102140]/40 dark:to-[#0D2A59]/30 rounded-full blur-3xl animate-pulse-soft"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,42,89,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,42,89,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(106,147,199,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(106,147,199,0.05)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      <div className="max-w-md w-full bg-white/80 dark:bg-egen-dark-surface/80 backdrop-blur-2xl rounded-2xl shadow-card dark:shadow-black/30 p-8 animate-scale-in relative z-10 border border-slate-200/50 dark:border-white/5">
        {/* Subtle glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#0D2A59]/10 via-[#F3B229]/10 to-[#6A93C7]/10 dark:from-[#F3B229]/10 dark:via-[#0D2A59]/10 dark:to-[#6A93C7]/10 rounded-2xl blur-xl -z-10"></div>
        
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-28 h-28 rounded-full border-2 border-transparent animate-spin-slow" style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #0D2A59, #F3B229, #6A93C7) border-box', animationDuration: '8s' }}></div>
            
            <div className="relative w-24 h-24 rounded-full bg-white dark:bg-egen-dark-surface backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-card">
              <img
                src="/LOGO.png"
                alt="EGEN Geradores"
                className="w-16 h-16 object-contain hover:scale-110 transition-all duration-500 ease-out"
              />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-1">
            <span className="text-egen-navy dark:text-egen-yellow">
              EGEN Geradores
            </span>
          </h1>
          <p className="text-egen-gray-mid dark:text-white/60 text-sm transition-all duration-300">
            {isSignUp ? 'Criar nova conta' : 'Faça login para continuar'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm animate-shake flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center text-red-500 dark:text-red-300 font-bold text-xs">!</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-egen-blue/30 focus:border-egen-blue transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 bg-white/70 dark:bg-egen-dark-surface/70 backdrop-blur-sm text-slate-800 dark:text-egen-dark-text placeholder:text-slate-400 dark:placeholder:text-white/40"
              placeholder="seu@email.com"
            />
          </div>

          {isSignUp && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-egen-blue/30 focus:border-egen-blue transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 bg-white/70 dark:bg-egen-dark-surface/70 backdrop-blur-sm text-slate-800 dark:text-egen-dark-text placeholder:text-slate-400 dark:placeholder:text-white/40"
                placeholder="Seu nome completo"
              />
            </div>
          )}

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
              Senha
            </label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-11 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-egen-blue/30 focus:border-egen-blue transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 bg-white/70 dark:bg-egen-dark-surface/70 backdrop-blur-sm text-slate-800 dark:text-egen-dark-text placeholder:text-slate-400 dark:placeholder:text-white/40"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                Departamento
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-egen-blue/30 focus:border-egen-blue transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 bg-white/70 dark:bg-egen-dark-surface/70 backdrop-blur-sm text-slate-800 dark:text-egen-dark-text cursor-pointer"
              >
                <option value="" className="text-slate-400 dark:text-gray-500">Selecione um departamento</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center font-semibold overflow-hidden group animate-fade-in-up shadow-lg shadow-egen-navy/20 hover:shadow-xl hover:shadow-egen-navy/30"
            style={{ animationDelay: '0.3s' }}
          >
            {/* Button gradient background */}
            <div className="absolute inset-0 bg-egen-yellow transition-all duration-300 group-hover:brightness-110"></div>
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer"></div>
            
            {/* Button content */}
            <span className="relative z-10 flex items-center text-egen-navy font-bold">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-egen-navy border-t-transparent mr-2"></div>
                  {isSignUp ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                  {isSignUp ? 'Criar Conta' : 'Entrar'}
                </>
              )}
            </span>
          </button>
          
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setName('');
              setError(null);
            }}
            className="text-egen-blue dark:text-egen-blue hover:text-egen-navy dark:hover:text-egen-yellow text-sm font-medium transition-colors hover:underline underline-offset-4"
          >
            {isSignUp 
              ? 'Já tem uma conta? Faça login' 
              : 'Não tem uma conta? Cadastre-se'
            }
          </button>
          {!isSignUp && !isForgotPassword && (
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  setIsForgotPassword(true);
                  setName('');
                  setError(null);
                }}
                className="text-slate-500 dark:text-white/50 hover:text-egen-blue dark:hover:text-egen-yellow text-sm transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
          
          {isForgotPassword && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              const { error } = await resetPassword(email);
              if (error) setError('Erro ao enviar email de recuperação.');
              else alert('Instruções de redefinição enviadas para seu email.');
              setLoading(false);
              setIsForgotPassword(false);
            }}
            className="space-y-4 mt-4 animate-fade-in-up"
          >
            <p className="text-sm text-slate-600 dark:text-gray-400">Digite seu email para redefinir a senha.</p>
            <input
              id="emailres"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 hover:border-slate-300 dark:hover:border-gray-500 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 px-4 rounded-xl transition-all duration-300 font-semibold overflow-hidden group shadow-lg shadow-blue-900/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800"></div>
              <span className="relative z-10 text-white">{loading ? 'Enviando...' : 'Enviar instruções'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 text-sm transition-colors"
            >
              Voltar ao login
            </button>
          </form>
        )}
        </div>

        {isSignUp && (
          <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-xl text-slate-700 dark:text-gray-300 text-xs animate-fade-in-up">
            <strong className="text-blue-800 dark:text-blue-400">Nota:</strong> Após criar sua conta, você poderá acessar o nosso sistema de Compras e Estoque.
          </div>
        )}        
      </div>
    </div>
  );
};

export default Auth;