import React from 'react';
import { Calendar, Gauge, Dumbbell, CheckCircle2, Clock, Moon, Sparkles, TrendingUp } from 'lucide-react';
import { Week, WeekMetrics } from '../../types/workout';

interface SummaryCardsProps {
  week: Week | null;
  metrics: WeekMetrics | null;
  onNewWeek: () => void;
  isCoach?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ week, metrics, onNewWeek, isCoach = true }) => {
  if (!week || !metrics) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const getDisplayTitle = () => {
    if (!week) return 'Semana de Treinamento';
    let t = week.title || 'Semana de Treinamento';
    const studentName = week.user?.name;
    if (studentName) {
      if (t.includes('Paulo Henrique') && studentName !== 'Paulo Henrique') {
        t = t.replace(/Paulo Henrique/g, studentName);
      } else if (!t.toLowerCase().includes(studentName.toLowerCase())) {
        if (/\([^)]+\)$/.test(t)) {
          t = t.replace(/\([^)]+\)$/, `(${studentName})`);
        } else {
          t = `${t} (${studentName})`;
        }
      }
    }
    return t;
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Top Banner with Week Title & Date Range */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel-elevated border-gray-800 shadow-xl relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[2px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center text-cyan-400">
              <Calendar className="w-7 h-7" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {getDisplayTitle()}
              </h1>
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {week.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 font-mono">
              <span className="text-gray-300 font-semibold">{formatDate(week.startDate)}</span>
              <span className="text-cyan-400">→</span>
              <span className="text-gray-300 font-semibold">{formatDate(week.endDate)}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">Microciclo Vigente</span>
            </p>
          </div>
        </div>

        {isCoach && (
          <button
            onClick={onNewWeek}
            className="self-start md:self-auto px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer shadow-md"
          >
            + Nova Semana
          </button>
        )}
      </div>

      {/* Grid of Metric Cards (SisRUN Glassmorphic Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Volume */}
        <div className="p-4 rounded-2xl glass-panel border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volume Total</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight font-mono">
              ≈ {metrics.totalCalculatedKm} <span className="text-sm font-normal text-cyan-400">km</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Planejado: <span className="text-gray-200 font-semibold">{week.originalPdfVolume || `${week.plannedVolumeKm} km`}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Sessões de Treino */}
        <div className="p-4 rounded-2xl glass-panel border-gray-800 hover:border-blue-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sessões</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight font-mono">
              {metrics.totalWorkoutsCount} <span className="text-sm font-normal text-gray-400">treinos</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {metrics.totalRestDays} dia(s) de descanso
            </div>
          </div>
        </div>

        {/* Card 3: Sincronizados Garmin */}
        <div className="p-4 rounded-2xl glass-panel border-gray-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Garmin Sync</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
              {metrics.synchronizedCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Enviados para o relógio
            </div>
          </div>
        </div>

        {/* Card 4: Pendentes */}
        <div className="p-4 rounded-2xl glass-panel border-gray-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pendentes</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 tracking-tight font-mono">
              {metrics.pendingCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Aguardando envio
            </div>
          </div>
        </div>

        {/* Card 5: Descanso */}
        <div className="p-4 rounded-2xl glass-panel border-gray-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Descanso</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-300 tracking-tight font-mono">
              {metrics.totalRestDays} <span className="text-sm font-normal text-purple-400/80">dias</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Recuperação ativa
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
