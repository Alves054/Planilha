import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Sparkles, 
  Calendar, 
  Layers, 
  Smartphone, 
  Award, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  Compass,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const words = ['INTUITIVA', 'COMPLETA', 'INOVADORA', 'PROFISSIONAL'];
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWordIdx((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[2px] shadow-lg shadow-blue-500/25">
              <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tighter text-white">PACE CLUB</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-400 border border-blue-500/30">
                  TRAINING
                </span>
              </div>
              <p className="text-[10px] font-medium text-gray-400 -mt-1 tracking-wider uppercase">
                Assessoria & Prescrição Esportiva
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
            <a href="#funcionalidades" className="hover:text-blue-400 transition-colors">Funcionalidades</a>
            <a href="#ciclos" className="hover:text-blue-400 transition-colors">Ciclos & Planilhas</a>
            <a href="#garmin" className="hover:text-blue-400 transition-colors">Garmin Connect</a>
            <a href="#numeros" className="hover:text-blue-400 transition-colors">Resultados</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <span>Acessar Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/15 to-purple-600/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute -top-24 right-10 w-96 h-96 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 animate-pulse-slow">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>A melhor experiência para Assessoria Esportiva</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto mb-6">
            Uma plataforma de treinos{' '}
            <span className="block mt-2">
              completamente{' '}
              <span className="gradient-text transition-all duration-500">
                {words[currentWordIdx]}
              </span>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            Prescrição com zonas de ritmo personalizadas, sincronização Garmin Connect, 
            leitura de treinos via PDF, comprovantes com fotos e relatórios de performance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto gradient-btn px-8 py-4 rounded-2xl font-black text-base text-white shadow-xl shadow-blue-600/35 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>ENTRAR NA PLATAFORMA</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#funcionalidades"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-gray-300 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Ver Recursos</span>
            </a>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-5 rounded-2xl text-center border-gray-800">
              <span className="block text-3xl font-black text-cyan-400 font-mono">100%</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1 block">Online & Nuvem</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center border-gray-800">
              <span className="block text-3xl font-black text-blue-400 font-mono">Garmin</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1 block">Sincronização Direta</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center border-gray-800">
              <span className="block text-3xl font-black text-emerald-400 font-mono">Zonas</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1 block">Ritmos Calculados</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center border-gray-800">
              <span className="block text-3xl font-black text-purple-400 font-mono">PDF AI</span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1 block">Importação Automática</span>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section (SisRUN style) */}
      <section id="funcionalidades" className="py-24 bg-[#0d1322] border-t border-gray-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Recursos de Alta Performance
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 tracking-tight">
              Tudo o que seu aluno precisa para evoluir na corrida
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-3">
              Construído para treinadores exigentes e atletas que buscam recordes pessoais com metodologia estruturada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-panel p-8 rounded-3xl border-gray-800/80 hover:border-blue-500/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Planilha Semanal & Ciclos</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Prescreva semanas com tiros intervalados, rodagens, ritmos progressivos e longões com feedback imediato de volume e intensidade.
              </p>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Distribuição por dias da semana</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Estrutura de aquecimento, tiros e desaquecimento</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-8 rounded-3xl border-gray-800/80 hover:border-cyan-500/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Ciclos de Treino (5K a 42K)</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Crie modelos de ciclos pré-montados de 4, 8 ou 12 semanas e aplique na planilha de qualquer aluno com 1 clique.
              </p>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Modelos de 30 dias até maratona completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Remoção e substituição ágil</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-8 rounded-3xl border-gray-800/80 hover:border-emerald-500/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Garmin Sync & Comprovantes</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Envio direto de treinos estruturados para o relógio Garmin e upload de comprovantes em foto e métricas realizadas.
              </p>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Exportação com alerta sonoro/vibração</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Galeria de fotos do treino do aluno</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 bg-gradient-to-b from-[#0d1322] to-[#0b0f19] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
            Pronto para transformar seus treinos?
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Faça login para prescrever treinos, acompanhar o progresso dos atletas e sincronizar suas planilhas.
          </p>
          <button
            onClick={onGoToLogin}
            className="gradient-btn px-10 py-4 rounded-2xl font-black text-base text-white shadow-2xl shadow-blue-600/40 inline-flex items-center gap-3 cursor-pointer"
          >
            <span>ENTRAR NO SISTEMA</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-10 bg-[#080c14] text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="font-extrabold text-white text-sm">PACE TRAINING PLATFORM</span>
            <span className="text-gray-500">| Assessoria Esportiva & Garmin Sync</span>
          </div>
          <div>
            <p>© 2026 Pace Club. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
