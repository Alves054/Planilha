import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Timer, Flame, RefreshCw, Zap, Wind, RotateCcw } from 'lucide-react';
import { WorkoutStep, PaceZones } from '../../types/workout';

interface StepBuilderProps {
  steps: WorkoutStep[];
  repeatCount: number;
  onStepsChange: (steps: WorkoutStep[]) => void;
  onRepeatCountChange: (repeatCount: number) => void;
  paceZones?: PaceZones;
}

const parsePace = (paceStr?: string): { min: string; max: string } => {
  if (!paceStr) return { min: '', max: '' };
  const cleaned = paceStr.replace(/\/km/i, '').trim();
  const parts = cleaned.split(/[–\-]/);
  if (parts.length >= 2) {
    return { min: parts[0].trim(), max: parts[1].trim() };
  }
  return { min: cleaned, max: cleaned };
};

export const StepBuilder: React.FC<StepBuilderProps> = ({
  steps,
  repeatCount,
  onStepsChange,
  onRepeatCountChange,
  paceZones
}) => {
  const tiroPace = parsePace(paceZones?.paceTiros || '3:00–3:30/km');
  const levePace = parsePace(paceZones?.paceLeve || '5:10–5:40/km');
  const modPace = parsePace(paceZones?.paceModerado || '4:40–5:10/km');
  const contPace = parsePace(paceZones?.paceControlado || '3:50–4:10/km');

  const addStep = (
    stepType: 'WARMUP' | 'RUN' | 'RECOVERY' | 'COOL_DOWN' | 'REST' = 'RUN',
    durationType: 'TIME' | 'DISTANCE' = 'DISTANCE',
    durationValue: number = 400,
    targetMin?: string,
    targetMax?: string
  ) => {
    const newStep: WorkoutStep = {
      stepOrder: steps.length + 1,
      stepType,
      durationType,
      durationValue,
      targetType: 'PACE',
      targetMin: targetMin !== undefined ? targetMin : tiroPace.min,
      targetMax: targetMax !== undefined ? targetMax : tiroPace.max,
      notes: ''
    };
    onStepsChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    const reordered = updated.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    onStepsChange(reordered);
  };

  const updateStep = (index: number, field: keyof WorkoutStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    onStepsChange(updated);
  };

  const setStepPace = (index: number, min: string, max: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], targetMin: min, targetMax: max };
    onStepsChange(updated);
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
      
      {/* Header & Repeats Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Estrutura de Treino Avançada (Passos / Tiros)</span>
          </h4>
          <p className="text-xs text-zinc-400">
            Defina etapas como aquecimento, tiros com pace do aluno, recuperação e soltura
          </p>
        </div>

        {/* Repeat Block Selector */}
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
          <RefreshCw className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">Repetições:</span>
          <input
            type="number"
            min="1"
            max="50"
            value={repeatCount}
            onChange={(e) => onRepeatCountChange(parseInt(e.target.value, 10) || 1)}
            className="w-12 bg-zinc-900 border border-purple-500/30 rounded px-2 py-0.5 text-xs text-center text-white font-bold focus:outline-none focus:border-purple-400"
          />
          <span className="text-xs text-purple-400">×</span>
        </div>
      </div>

      {/* Botões de Adição Rápida de Tiros & Etapas */}
      <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-850">
        <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1.5">
          Atalhos Rápidos de Tiros / Etapas:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => addStep('WARMUP', 'TIME', 600, levePace.min, levePace.max)}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            + Aquec. 10m
          </button>
          <button
            type="button"
            onClick={() => addStep('RUN', 'DISTANCE', 400, tiroPace.min, tiroPace.max)}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/35 hover:bg-rose-500/30 transition-colors flex items-center gap-1"
          >
            <Flame className="w-3 h-3" />
            + Tiro 400m
          </button>
          <button
            type="button"
            onClick={() => addStep('RUN', 'DISTANCE', 200, tiroPace.min, tiroPace.max)}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/35 hover:bg-rose-500/30 transition-colors flex items-center gap-1"
          >
            <Flame className="w-3 h-3" />
            + Tiro 200m
          </button>
          <button
            type="button"
            onClick={() => addStep('RUN', 'DISTANCE', 1000, tiroPace.min, tiroPace.max)}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/35 hover:bg-rose-500/30 transition-colors flex items-center gap-1"
          >
            <Flame className="w-3 h-3" />
            + Tiro 1.000m
          </button>
          <button
            type="button"
            onClick={() => addStep('RECOVERY', 'DISTANCE', 200, '', '')}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/25 hover:bg-teal-500/25 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            + Recup 200m
          </button>
          <button
            type="button"
            onClick={() => addStep('RECOVERY', 'TIME', 60, '', '')}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/25 hover:bg-teal-500/25 transition-colors flex items-center gap-1"
          >
            <Timer className="w-3 h-3" />
            + Recup 60s
          </button>
          <button
            type="button"
            onClick={() => addStep('COOL_DOWN', 'TIME', 600, '', '')}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
          >
            <Wind className="w-3 h-3" />
            + Soltura 10m
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              {/* Step Order & Type */}
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {index + 1}
                </span>
                <select
                  value={step.stepType}
                  onChange={(e) => updateStep(index, 'stepType', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500 text-xs"
                >
                  <option value="WARMUP">Aquecimento</option>
                  <option value="RUN">Corrida / Tiro</option>
                  <option value="RECOVERY">Recuperação</option>
                  <option value="COOL_DOWN">Desaquecimento / Soltura</option>
                  <option value="REST">Descanso</option>
                </select>
              </div>

              {/* Duration Type & Value */}
              <div className="sm:col-span-4 flex items-center gap-1.5">
                <select
                  value={step.durationType}
                  onChange={(e) => updateStep(index, 'durationType', e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 focus:outline-none text-xs"
                >
                  <option value="DISTANCE">Distância (m)</option>
                  <option value="TIME">Tempo (s)</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={step.durationValue}
                  onChange={(e) => updateStep(index, 'durationValue', parseFloat(e.target.value) || 0)}
                  className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 font-mono focus:outline-none focus:border-blue-500 text-xs"
                  placeholder="Ex: 400"
                />
                <span className="text-zinc-500 font-mono text-[10px]">
                  {step.durationType === 'TIME' ? 'seg' : 'm'}
                </span>
              </div>

              {/* Target Pace (Min - Max) */}
              <div className="sm:col-span-4 flex items-center gap-1">
                <span className="text-zinc-500 text-[11px]">Pace:</span>
                <input
                  type="text"
                  placeholder="3:00"
                  value={step.targetMin || ''}
                  onChange={(e) => updateStep(index, 'targetMin', e.target.value)}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1 py-1.5 text-zinc-100 font-mono text-center focus:outline-none focus:border-blue-500 text-xs"
                />
                <span className="text-zinc-500">–</span>
                <input
                  type="text"
                  placeholder="3:30"
                  value={step.targetMax || ''}
                  onChange={(e) => updateStep(index, 'targetMax', e.target.value)}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1 py-1.5 text-zinc-100 font-mono text-center focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              {/* Remove Step Button */}
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                  title="Remover Etapa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Pace Zones pills for this step */}
            <div className="flex items-center gap-1 text-[10px] pt-1 border-t border-zinc-900">
              <span className="text-zinc-500 font-medium">Aplicar Zona:</span>
              <button
                type="button"
                onClick={() => setStepPace(index, tiroPace.min, tiroPace.max)}
                className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20 font-mono"
                title={`Tiros: ${paceZones?.paceTiros || '3:00–3:30'}`}
              >
                Tiros ({tiroPace.min}-{tiroPace.max})
              </button>
              <button
                type="button"
                onClick={() => setStepPace(index, contPace.min, contPace.max)}
                className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20 font-mono"
                title={`Controlado: ${paceZones?.paceControlado || '3:50–4:10'}`}
              >
                Controlado
              </button>
              <button
                type="button"
                onClick={() => setStepPace(index, modPace.min, modPace.max)}
                className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 border border-teal-500/20 font-mono"
                title={`Moderado: ${paceZones?.paceModerado || '4:40–5:10'}`}
              >
                Moderado
              </button>
              <button
                type="button"
                onClick={() => setStepPace(index, levePace.min, levePace.max)}
                className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/20 font-mono"
                title={`Leve: ${paceZones?.paceLeve || '5:10–5:40'}`}
              >
                Leve
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Step Button */}
      <button
        type="button"
        onClick={() => addStep('RUN', 'DISTANCE', 400, tiroPace.min, tiroPace.max)}
        className="w-full py-2.5 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 bg-zinc-900/40 hover:bg-zinc-900 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4 text-blue-400" />
        <span>+ Adicionar Etapa Personalizada</span>
      </button>

    </div>
  );
};

