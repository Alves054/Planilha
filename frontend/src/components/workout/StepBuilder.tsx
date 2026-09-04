import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Timer, Flame, RefreshCw } from 'lucide-react';
import { WorkoutStep } from '../../types/workout';

interface StepBuilderProps {
  steps: WorkoutStep[];
  repeatCount: number;
  onStepsChange: (steps: WorkoutStep[]) => void;
  onRepeatCountChange: (repeatCount: number) => void;
}

export const StepBuilder: React.FC<StepBuilderProps> = ({
  steps,
  repeatCount,
  onStepsChange,
  onRepeatCountChange
}) => {
  const addStep = () => {
    const newStep: WorkoutStep = {
      stepOrder: steps.length + 1,
      stepType: 'RUN',
      durationType: 'TIME',
      durationValue: 60,
      targetType: 'PACE',
      targetMin: '3:20',
      targetMax: '3:25',
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

  return (
    <div className="space-y-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
      
      {/* Header & Repeats Counter */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Estrutura de Treino Avançada (Passos / Tiros)</span>
          </h4>
          <p className="text-xs text-zinc-400">
            Defina etapas como tiro, corrida contínua ou recuperação
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

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg bg-zinc-950 border border-zinc-800 items-center text-xs"
          >
            {/* Step Order & Type */}
            <div className="sm:col-span-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-[10px]">
                {index + 1}
              </span>
              <select
                value={step.stepType}
                onChange={(e) => updateStep(index, 'stepType', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="WARMUP">Aquecimento</option>
                <option value="RUN">Corrida / Tiro</option>
                <option value="RECOVERY">Recuperação</option>
                <option value="COOL_DOWN">Desaquecimento</option>
                <option value="REST">Descanso</option>
              </select>
            </div>

            {/* Duration Type & Value */}
            <div className="sm:col-span-4 flex items-center gap-1.5">
              <select
                value={step.durationType}
                onChange={(e) => updateStep(index, 'durationType', e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 focus:outline-none"
              >
                <option value="TIME">Tempo (s)</option>
                <option value="DISTANCE">Distância (m)</option>
              </select>
              <input
                type="number"
                min="1"
                value={step.durationValue}
                onChange={(e) => updateStep(index, 'durationValue', parseFloat(e.target.value) || 0)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                placeholder="Ex: 60"
              />
              <span className="text-zinc-500 font-mono text-[10px]">
                {step.durationType === 'TIME' ? 'seg' : 'm'}
              </span>
            </div>

            {/* Target Pace (Min - Max) */}
            <div className="sm:col-span-4 flex items-center gap-1">
              <span className="text-zinc-500">Pace:</span>
              <input
                type="text"
                placeholder="Min (3:20)"
                value={step.targetMin || ''}
                onChange={(e) => updateStep(index, 'targetMin', e.target.value)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-zinc-100 font-mono text-center focus:outline-none focus:border-blue-500"
              />
              <span className="text-zinc-500">–</span>
              <input
                type="text"
                placeholder="Max (3:25)"
                value={step.targetMax || ''}
                onChange={(e) => updateStep(index, 'targetMax', e.target.value)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-zinc-100 font-mono text-center focus:outline-none focus:border-blue-500"
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
        ))}
      </div>

      {/* Add Step Button */}
      <button
        type="button"
        onClick={addStep}
        className="w-full py-2 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 bg-zinc-900/40 hover:bg-zinc-900 transition-all"
      >
        <Plus className="w-3.5 h-3.5 text-blue-400" />
        <span>+ Adicionar Etapa ao Bloco</span>
      </button>

    </div>
  );
};
