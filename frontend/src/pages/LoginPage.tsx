import React, { useState } from 'react';
import { 
  LogIn, 
  Lock, 
  Mail, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Calendar,
  Layers,
  Smartphone
} from 'lucide-react';
import { UserProfile } from '../types/workout';
import { loginApi } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, digite seu e-mail e senha.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await loginApi(email.trim(), password);
      localStorage.setItem('pace_token', res.token);
      localStorage.setItem('pace_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-gray-100 flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Background Glows & Effects */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/15 via-cyan-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">PACE CLUB</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-400 border border-blue-500/30">
                TRAINING
              </span>
            </div>
          </div>
        </div>

        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer bg-gray-900/60 hover:bg-gray-800/80 px-3.5 py-2 rounded-xl border border-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Início</span>
          </button>
        )}
      </header>

      {/* Main Split Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 relative z-10">
        
        {/* Left Side: Brand & Highlights (SisRUN style) */}
        <div className="w-full lg:w-1/2 space-y-8 hidden md:block">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Acesso Exclusivo à Assessoria</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Prescrição esportiva <br />
            <span className="gradient-text">precisa e inteligente</span>
          </h2>

          <p className="text-gray-400 text-base leading-relaxed">
            Acompanhe suas planilhas, ritmos de pace calculados automaticamente, 
            sincronize com seu relógio Garmin e envie seus comprovantes de treino em um só lugar.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-900/40 border border-gray-800/60">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Planilhas Personalizadas</h4>
                <p className="text-xs text-gray-400">Tiros, rodagens, ritmos e treinos específicos por zona.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-900/40 border border-gray-800/60">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Ciclos Completos</h4>
                <p className="text-xs text-gray-400">Periodização estruturada em 4 a 12 semanas para suas provas.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-900/40 border border-gray-800/60">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Garmin Sync & Comprovantes</h4>
                <p className="text-xs text-gray-400">Envio para o relógio e galeria de fotos de cada treino.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="glass-panel-elevated p-8 sm:p-10 rounded-3xl relative overflow-hidden border-gray-800">
            
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Acesse sua conta
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Entre com seu e-mail e senha cadastrados
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-white placeholder-gray-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-950/80 border border-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-white placeholder-gray-500 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 px-4 rounded-xl gradient-btn font-black text-sm text-white shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-800/80 text-center">
              <span className="text-xs text-gray-500">
                Pace Training • Plataforma para Treinadores e Atletas
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-gray-600 relative z-10 border-t border-gray-900">
        <p>PACE TRAINING & PACE CLUB © 2026 — Plataforma de Prescrição & Gestão</p>
      </footer>
    </div>
  );
};
