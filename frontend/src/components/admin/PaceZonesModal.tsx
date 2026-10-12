import React, { useState, useEffect } from 'react';
import { X, Activity, Save, Sparkles, Check, Info } from 'lucide-react';
import { updatePaceZonesApi } from '../../services/api';

interface PaceZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
  initialZones: {
    paceLeve?: string;
    paceModerado?: string;
    paceControlado?: string;
    paceTiros?: string;
  };
  onSaved: (updatedZones: {
    paceLeve: string;
    paceModerado: string;
    paceControlado: string;
    paceTiros: string;
  }) => void;
}

const PRESETS = [
  {
    name: 'Padrão Pace Club',
    leve: '5:10–5:40/km',
    moderado: '4:40–5:10/km',
    controlado: '3:50–4:10/km',
    tiros: '3:00–3:30/km'
  },
  {
    name: 'Iniciante / Rodagem Leve',
    leve: '6:00–6:40/km',
    moderado: '5:30–6:00/km',
    controlado: '5:00–5:30/km',
    tiros: '4:20–4:50/km'
  },
  {
    name: 'Intermediário (Sub 45min)',
    leve: '5:20–5:50/km',
    moderado: '4:45–5:15/km',
    controlado: '4:10–4:30/km',
    tiros: '3:20–3:45/km'
  },
  {
    name: 'Avançado (Sub 38min)',
    leve: '4:30–5:00/km',
    moderado: '4:00–4:30/km',
    controlado: '3:35–3:55/km',
    tiros: '2:50–3:15/km'
  }
];

export const PaceZonesModal: React.FC<PaceZonesModalProps> = ({
  isOpen,
  onClose,
  athleteId,
  athleteName,
  initialZones,
  onSaved
}) => {
  const [paceLeve, setPaceLeve] = useState(initialZones.paceLeve || '5:10–5:40/km');
  const [paceModerado, setPaceModerado] = useState(initialZones.paceModerado || '4:40–5:10/km');
  const [paceControlado, setPaceControlado] = useState(initialZones.paceControlado || '3:50–4:10/km');
  const [paceTiros, setPaceTiros] = useState(initialZones.paceTiros || '3:00–3:30/km');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaceLeve(initialZones.paceLeve || '5:10–5:40/km');
      setPaceModerado(initialZones.paceModerado || '4:40–5:10/km');
      setPaceControlado(initialZones.paceControlado || '3:50–4:10/km');
      setPaceTiros(initialZones.paceTiros || '3:00–3:30/km');
      setError(null);
    }
  }, [isOpen, initialZones]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setPaceLeve(preset.leve);
    setPaceModerado(preset.moderado);
    setPaceControlado(preset.controlado);
    setPaceTiros(preset.tiros);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteId) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        paceLeve: paceLeve.trim(),
        paceModerado: paceModerado.trim(),
        paceControlado: paceControlado.trim(),
        paceTiros: paceTiros.trim()
      };

      await updatePaceZonesApi(athleteId, payload);
      onSaved(payload);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar zonas:', err);
      setError(err.response?.data?.error || 'Erro ao salvar zonas de ritmo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-blue-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Zonas de Ritmo / Pace
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configurando referências para <span className="text-blue-300 font-semibold">{athleteName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Presets Rápidos */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Modelos Pré-definidos (Clique para preencher)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 rounded-xl text-left bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/40 transition-all text-xs group"
                >
                  <div className="font-semibold text-zinc-200 group-hover:text-blue-300 line-clamp-1">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Tiros: {p.tiros}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields das 4 Zonas */}
          <div className="space-y-3.5 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-850">
            {/* Leve */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Pace Leve / Rodagem
                </label>
                <span className="text-[10px] text-zinc-500">Ex: 5:10–5:40/km</span>
              </div>
              <input
                type="text"
                required
                value={paceLeve}
                onChange={(e) => setPaceLeve(e.target.value)}
                placeholder="5:10–5:40/km"
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none transition-colors"
              />
            </div>

            {/* Moderado */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                  Pace Moderado
                </label>
                <span className="text-[10px] text-zinc-500">Ex: 4:40–5:10/km</span>
              </div>
              <input
                type="text"
                required
                value={paceModerado}
                onChange={(e) => setPaceModerado(e.target.value)}
                placeholder="4:40–5:10/km"
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-teal-500 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none transition-colors"
              />
            </div>

            {/* Controlado */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Pace Controlado / Limiar
                </label>
                <span className="text-[10px] text-zinc-500">Ex: 3:50–4:10/km</span>
              </div>
              <input
                type="text"
                required
                value={paceControlado}
                onChange={(e) => setPaceControlado(e.target.value)}
                placeholder="3:50–4:10/km"
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none transition-colors"
              />
            </div>

            {/* Tiros */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  Pace Tiros (200m / 400m / 1000m)
                </label>
                <span className="text-[10px] text-zinc-500">Ex: 3:00–3:30/km</span>
              </div>
              <input
                type="text"
                required
                value={paceTiros}
                onChange={(e) => setPaceTiros(e.target.value)}
                placeholder="3:00–3:30/km"
                className="w-full bg-zinc-900 border border-zinc-750 focus:border-rose-500 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Essas zonas ficam salvas no perfil deste aluno e serão sugeridas automaticamente ao adicionar treinos e tiros na planilha!</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Zonas do Aluno'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
