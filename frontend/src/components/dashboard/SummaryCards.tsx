import React from 'react';
import { Calendar, Gauge, Dumbbell, CheckCircle2, Clock, Moon } from 'lucide-react';
import { Week, WeekMetrics } from '../../types/workout';

interface SummaryCardsProps {
  week: Week | null;
  metrics: WeekMetrics | null;
  onNewWeek: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ week, metrics, onNewWeek }) => {
  if (!week || !metrics) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Top Banner with Week Title & Date Range */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-blue-950/40 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {week.title || 'Semana de Treinamento'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {week.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-mono">
              <span>{formatDate(week.startDate)}</span>
              <span>→</span>
              <span>{formatDate(week.endDate)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onNewWeek}
          className="self-start md:self-auto px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
        >
          + Nova Semana
        </button>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Card 1: Volume Planejado & Calculado */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Volume Total</span>
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ≈ {metrics.totalCalculatedKm} <span className="text-sm font-normal text-zinc-400">km</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Planejado: <span className="text-zinc-300 font-medium">{week.originalPdfVolume || `${week.plannedVolumeKm} km`}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total de Treinos */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sessões</span>
            <Dumbbell className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {metrics.totalWorkoutsCount}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {metrics.totalRestDays} dia(s) de descanso
            </div>
          </div>
        </div>

        {/* Card 3: Sincronizados */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sincronizados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              {metrics.synchronizedCount}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              No Garmin Connect
            </div>
          </div>
        </div>

        {/* Card 4: Pendentes */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
              {metrics.pendingCount}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Aguardando envio
            </div>
          </div>
        </div>

        {/* Card 5: Dias Treinados */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Descanso</span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-300 tracking-tight">
              {metrics.totalRestDays} <span className="text-sm font-normal text-zinc-400">dias</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Recuperação ativa
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
