import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Search, Phone, Mail, FileText,
  Calendar, Trash2, Edit3, CheckCircle2, AlertCircle,
  ChevronRight, ArrowRight, X, Shield, Plus, Loader2,
  Camera, Flame, Trophy, TrendingUp, Sparkles, Activity,
  Clock, Heart, ExternalLink, Image as ImageIcon, RefreshCw, Eye,
  Copy, Target, BookOpen, Layers
} from 'lucide-react';
import { AthleteItem, WorkoutResultItem, TrainingCycleItem, CycleWeek } from '../../types/workout';
import {
  listAthletesApi,
  createAthleteApi,
  updateAthleteApi,
  deleteAthleteApi,
  getWorkoutResultsApi,
  resetWorkoutResultApi,
  listCyclesApi,
  duplicateCycleApi,
  deleteCycleApi
} from '../../services/api';
import { ApplyCycleModal } from './ApplyCycleModal';
import { CycleBuilderModal } from './CycleBuilderModal';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAthleteForTraining: (athlete: AthleteItem) => void;
  selectedAthleteId?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  onSelectAthleteForTraining,
  selectedAthleteId
}) => {
  const [activeTab, setActiveTab] = useState<'athletes' | 'cycles' | 'results'>('athletes');
  const [athletes, setAthletes] = useState<AthleteItem[]>([]);
  const [results, setResults] = useState<WorkoutResultItem[]>([]);
  const [cycles, setCycles] = useState<TrainingCycleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAthleteId, setFilterAthleteId] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modais de Ciclo de Treino
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyCycleId, setApplyCycleId] = useState<string | undefined>(undefined);
  const [applyAthleteId, setApplyAthleteId] = useState<string | undefined>(undefined);
  const [isCycleBuilderOpen, setIsCycleBuilderOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<TrainingCycleItem | null>(null);

  // Modal de Criar/Editar Aluno
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPaceLeve, setFormPaceLeve] = useState('5:10–5:40/km');
  const [formPaceModerado, setFormPaceModerado] = useState('4:40–5:10/km');
  const [formPaceControlado, setFormPaceControlado] = useState('3:50–4:10/km');
  const [formPaceTiros, setFormPaceTiros] = useState('3:00–3:30/km');
  const [saving, setSaving] = useState(false);

  // Modal de Zoom da Foto do Comprovante
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; athlete: string } | null>(null);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listAthletesApi();
      setAthletes(res.athletes || []);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar lista de alunos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (athleteId?: string) => {
    try {
      setLoadingResults(true);
      const targetId = athleteId && athleteId !== 'ALL' ? athleteId : undefined;
      const res = await getWorkoutResultsApi(targetId);
      setResults(res.results || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  const fetchCycles = async () => {
    try {
      setLoadingCycles(true);
      const res = await listCyclesApi();
      setCycles(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCycles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAthletes();
      fetchResults(filterAthleteId);
      fetchCycles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'results') {
      fetchResults(filterAthleteId);
    } else if (isOpen && activeTab === 'cycles') {
      fetchCycles();
    }
  }, [activeTab, filterAthleteId]);

  const handleOpenApplyCycle = (cycleId?: string, athleteId?: string) => {
    setApplyCycleId(cycleId);
    setApplyAthleteId(athleteId);
    setIsApplyModalOpen(true);
  };

  const handleDuplicateCycle = async (id: string) => {
    try {
      await duplicateCycleApi(id);
      await fetchCycles();
      setSuccessToast('Ciclo duplicado com sucesso!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao duplicar ciclo.');
    }
  };

  const handleDeleteCycle = async (id: string, cycleName: string) => {
    if (confirm(`Tem certeza que deseja excluir o ciclo "${cycleName}" da sua biblioteca?`)) {
      try {
        await deleteCycleApi(id);
        await fetchCycles();
        setSuccessToast(`Ciclo "${cycleName}" removido.`);
        setTimeout(() => setSuccessToast(null), 4000);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao excluir ciclo.');
      }
    }
  };

  const handleCycleActionSuccess = (msg: string) => {
    setSuccessToast(msg);
    fetchCycles();
    fetchAthletes();
    setTimeout(() => setSuccessToast(null), 5000);
  };

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormNotes('');
    setFormPaceLeve('5:10–5:40/km');
    setFormPaceModerado('4:40–5:10/km');
    setFormPaceControlado('3:50–4:10/km');
    setFormPaceTiros('3:00–3:30/km');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (athlete: AthleteItem) => {
    setEditingId(athlete.id);
    setFormName(athlete.name);
    setFormEmail(athlete.email);
    setFormPassword('');
    setFormPhone(athlete.phone || '');
    setFormNotes(athlete.notes || '');
    setFormPaceLeve(athlete.paceLeve || '5:10–5:40/km');
    setFormPaceModerado(athlete.paceModerado || '4:40–5:10/km');
    setFormPaceControlado(athlete.paceControlado || '3:50–4:10/km');
    setFormPaceTiros(athlete.paceTiros || '3:00–3:30/km');
    setIsFormOpen(true);
  };

  const handleSaveAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Nome e e-mail são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateAthleteApi(editingId, {
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim() || undefined,
          phone: formPhone.trim() || undefined,
          notes: formNotes.trim() || undefined,
          paceLeve: formPaceLeve.trim() || undefined,
          paceModerado: formPaceModerado.trim() || undefined,
          paceControlado: formPaceControlado.trim() || undefined,
          paceTiros: formPaceTiros.trim() || undefined
        });
      } else {
        await createAthleteApi({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim() || '123456',
          phone: formPhone.trim() || undefined,
          notes: formNotes.trim() || undefined,
          paceLeve: formPaceLeve.trim() || undefined,
          paceModerado: formPaceModerado.trim() || undefined,
          paceControlado: formPaceControlado.trim() || undefined,
          paceTiros: formPaceTiros.trim() || undefined
        });
      }

      setIsFormOpen(false);
      await fetchAthletes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o aluno "${name}" e todos os seus treinos?`)) {
      try {
        await deleteAthleteApi(id);
        await fetchAthletes();
        if (activeTab === 'results') fetchResults(filterAthleteId);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao remover aluno.');
      }
    }
  };

  const handleResetResult = async (workoutId: string) => {
    if (confirm('Deseja desmarcar este treino e remover o resultado registrado?')) {
      try {
        await resetWorkoutResultApi(workoutId);
        await fetchResults(filterAthleteId);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erro ao reverter resultado.');
      }
    }
  };

  // Métricas calculadas para os cards
  const totalVolumePrescribed = athletes.reduce((acc, a) => acc + (a.latestWeek?.plannedVolumeKm || 0), 0);
  const totalResultsCount = results.length;
  const totalWithPhotos = results.filter(r => Boolean(r.proofImageUrl)).length;

  const filteredAthletes = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 flex flex-col overflow-hidden">
        
        {/* Header Superior com Identidade Visual Pace Club */}
        <div className="p-5 sm:px-8 border-b border-zinc-800/80 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Painel do Treinador
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30 uppercase tracking-wider">
                  Admin Pro
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Central de alunos, prescrições e acompanhamento de resultados com comprovantes
              </p>
            </div>
          </div>

          {/* Abas e Botão Novo Aluno / Novo Ciclo */}
          <div className="flex items-center gap-2.5">
            <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <button
                onClick={() => setActiveTab('athletes')}
                className={`py-1.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'athletes'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Alunos ({athletes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('cycles')}
                className={`py-1.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'cycles'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-orange-500/30 font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'cycles' ? 'text-black' : 'text-amber-400'}`} />
                <span>Ciclos & Periodização</span>
                {cycles.length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === 'cycles' ? 'bg-black/20 text-black font-black' : 'bg-amber-500/30 text-amber-200'
                  }`}>
                    {cycles.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className={`py-1.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'results'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resultados & Comprovantes</span>
                {totalResultsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200">
                    {totalResultsCount}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'cycles' ? (
              <button
                onClick={() => {
                  setEditingCycle(null);
                  setIsCycleBuilderOpen(true);
                }}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Novo Ciclo (30d)</span>
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Aluno</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Métricas Rápidas em Cards de Destaque */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:px-8 border-b border-zinc-800/60 bg-zinc-950/40">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Atletas Ativos</p>
              <p className="text-lg font-black text-white">{athletes.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Volume Prescrito</p>
              <p className="text-lg font-black text-white">{totalVolumePrescribed.toFixed(0)} <span className="text-xs text-zinc-400 font-normal">km/sem</span></p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Treinos Entregues</p>
              <p className="text-lg font-black text-emerald-400">{totalResultsCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Fotos/Comprovantes</p>
              <p className="text-lg font-black text-purple-400">{totalWithPhotos}</p>
            </div>
          </div>
        </div>

        {/* CONTEÚDO DA ABA: ALUNOS & PLANILHAS */}
        {activeTab === 'athletes' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de Busca */}
            <div className="p-4 sm:px-8 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar aluno por nome ou e-mail..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>

              <div className="text-xs text-zinc-400 font-medium">
                Exibindo: <span className="text-white font-bold">{filteredAthletes.length}</span> de {athletes.length} alunos
              </div>
            </div>

            {/* Grid de Cards dos Alunos */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {loading ? (
                <div className="h-full flex items-center justify-center flex-col gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <p className="text-xs">Carregando lista de alunos...</p>
                </div>
              ) : filteredAthletes.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col gap-3 text-center p-6">
                  <Users className="w-12 h-12 text-zinc-700" />
                  <p className="text-sm font-bold text-zinc-300">Nenhum aluno encontrado</p>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Clique em "Novo Aluno" para criar o login do atleta e começar a montar as planilhas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAthletes.map((athlete) => {
                    const isSelected = selectedAthleteId === athlete.id;
                    return (
                      <div
                        key={athlete.id}
                        className={`group relative p-5 rounded-3xl bg-zinc-900/70 border transition-all flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                            : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div>
                          {/* Topo do Card */}
                          <div className="flex items-start justify-between gap-2 mb-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-md">
                                {athlete.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors">
                                  {athlete.name}
                                </h3>
                                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                  {athlete.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEdit(athlete)}
                                title="Editar Dados"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(athlete.id, athlete.name)}
                                title="Excluir Aluno"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Telefone / WhatsApp */}
                          {athlete.phone && (
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2 font-mono bg-zinc-950/40 px-2.5 py-1 rounded-lg w-fit border border-zinc-800/60">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{athlete.phone}</span>
                            </div>
                          )}

                          {/* Notas / Objetivo */}
                          {athlete.notes && (
                            <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 mb-3 line-clamp-2">
                              "{athlete.notes}"
                            </p>
                          )}

                          {/* Planilha Atual Prescrita */}
                          <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 mb-3">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                Planilha Vigente
                              </span>
                              {athlete.latestWeek && (
                                <span className="text-indigo-400 font-black text-xs">
                                  {athlete.latestWeek.plannedVolumeKm} km
                                </span>
                              )}
                            </div>
                            {athlete.latestWeek ? (
                              <div className="text-xs text-zinc-200 font-bold truncate">
                                {athlete.latestWeek.title
                                  ? (athlete.latestWeek.title.includes('Paulo Henrique') && athlete.name !== 'Paulo Henrique'
                                      ? athlete.latestWeek.title.replace(/Paulo Henrique/g, athlete.name)
                                      : (!athlete.latestWeek.title.toLowerCase().includes(athlete.name.toLowerCase()) && /\([^)]+\)$/.test(athlete.latestWeek.title)
                                          ? athlete.latestWeek.title.replace(/\([^)]+\)$/, `(${athlete.name})`)
                                          : athlete.latestWeek.title))
                                  : `Semana de Treinos (${athlete.name})`}
                              </div>
                            ) : (
                              <div className="text-xs text-zinc-500 italic">
                                Nenhuma planilha cadastrada ainda
                              </div>
                            )}
                          </div>

                          {/* Zonas de Ritmo Resumo */}
                          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 mb-4">
                            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Activity className="w-3 h-3 text-blue-400" />
                              <span>Zonas de Pace</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate">
                                Leve: {athlete.paceLeve || '5:10–5:40'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold truncate">
                                Tiros: {athlete.paceTiros || '3:00–3:30'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              onSelectAthleteForTraining(athlete);
                              onClose();
                            }}
                            className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                            }`}
                          >
                            <span>{isSelected ? 'Gerenciando Planilha Atual' : 'Montar / Abrir Planilha'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenApplyCycle(undefined, athlete.id)}
                            className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>⚡ Aplicar Ciclo de Treino (30d)</span>
                          </button>

                          <button
                            onClick={() => {
                              setFilterAthleteId(athlete.id);
                              setActiveTab('results');
                            }}
                            className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Ver Resultados & Fotos do Aluno</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notificação Toast */}
        {successToast && (
          <div className="absolute top-20 right-8 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-fadeIn border border-emerald-400/40">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* CONTEÚDO DA ABA: CICLOS & PERIODIZAÇÃO */}
        {activeTab === 'cycles' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header de Ações dos Ciclos */}
            <div className="p-4 sm:px-8 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Biblioteca de Periodização & Modelos de Treino (30 Dias)
                </h3>
                <p className="text-xs text-zinc-400">
                  Modelos completos com 4 semanas de treinos estruturados, tiros e volumes. Aplique em qualquer aluno com 1 clique.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchCycles}
                  title="Atualizar Lista"
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCycles ? 'animate-spin text-amber-400' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    setEditingCycle(null);
                    setIsCycleBuilderOpen(true);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span>Novo Ciclo Personalizado</span>
                </button>
              </div>
            </div>

            {/* Lista dos Ciclos */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {loadingCycles ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-xs font-medium">Carregando modelos de periodização...</p>
                </div>
              ) : cycles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center max-w-md mx-auto">
                  <Layers className="w-12 h-12 text-zinc-700 mb-3" />
                  <p className="text-base font-bold text-zinc-300">Nenhum ciclo cadastrado ainda</p>
                  <p className="text-xs text-zinc-500 mt-1 mb-4">
                    Crie seu primeiro modelo de planejamento de 30 dias para economizar tempo na prescrição.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCycle(null);
                      setIsCycleBuilderOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs cursor-pointer"
                  >
                    + Criar Ciclo 5km 16min
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cycles.map(cycle => {
                    let parsedWeeks: CycleWeek[] = [];
                    try {
                      parsedWeeks = JSON.parse(cycle.weeksData || '[]');
                    } catch (e) {
                      parsedWeeks = [];
                    }

                    const totalWorkouts = parsedWeeks.reduce((acc, w) => {
                      return acc + (w.days?.reduce((dAcc, d) => dAcc + (d.workouts?.length || 0), 0) || 0);
                    }, 0);

                    const totalVolumeKm = parsedWeeks.reduce((acc, w) => {
                      return acc + (w.days?.reduce((dAcc, d) => {
                        return dAcc + (d.workouts?.reduce((wAcc, wo) => wAcc + (wo.targetDistanceKm || 0), 0) || 0);
                      }, 0) || 0);
                    }, 0);

                    return (
                      <div
                        key={cycle.id}
                        className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 hover:bg-zinc-900/90 transition-all flex flex-col justify-between group shadow-xl"
                      >
                        <div>
                          {/* Badges superiores */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Target className="w-3 h-3 text-amber-400" />
                              {cycle.category || '5KM'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {cycle.targetPace && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-zinc-800 text-amber-400 border border-zinc-700">
                                  {cycle.targetPace}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                                {cycle.durationDays || 30}d ({parsedWeeks.length} sem)
                              </span>
                            </div>
                          </div>

                          {/* Título & Descrição */}
                          <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors leading-snug mb-1.5">
                            {cycle.name}
                          </h4>

                          {cycle.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                              {cycle.description}
                            </p>
                          )}

                          {/* Resumo Semanal */}
                          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 mb-4 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500 font-bold uppercase text-[10px]">Treinos Prescritos</span>
                              <span className="text-white font-extrabold">{totalWorkouts} treinos</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500 font-bold uppercase text-[10px]">Volume Total Est.</span>
                              <span className="text-emerald-400 font-extrabold">~{Math.round(totalVolumeKm)} km</span>
                            </div>

                            <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-4 gap-1 text-center">
                              {parsedWeeks.slice(0, 4).map((w, idx) => (
                                <div key={idx} className="bg-zinc-900/90 py-1 px-1 rounded-lg">
                                  <p className="text-[9px] text-zinc-500 font-bold">Sem {w.weekNumber}</p>
                                  <p className="text-[11px] font-black text-amber-400">
                                    {w.days?.reduce((acc, d) => acc + (d.workouts?.length || 0), 0) || 0}t
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Ações do Ciclo */}
                        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                          <button
                            onClick={() => handleOpenApplyCycle(cycle.id, undefined)}
                            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-black" />
                            <span>⚡ Aplicar em Aluno (1-Clique)</span>
                          </button>

                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCycle(cycle);
                                setIsCycleBuilderOpen(true);
                              }}
                              className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Editar treinos deste ciclo"
                            >
                              <Edit3 className="w-3 h-3 text-zinc-400" />
                              <span>Editar</span>
                            </button>

                            <button
                              onClick={() => handleDuplicateCycle(cycle.id)}
                              className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Duplicar para criar variação"
                            >
                              <Copy className="w-3 h-3 text-zinc-400" />
                              <span>Duplicar</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCycle(cycle.id, cycle.name)}
                              className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Excluir da biblioteca"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: RESULTADOS & COMPROVANTES DOS ALUNOS */}
        {activeTab === 'results' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filtros da Aba de Resultados */}
            <div className="p-4 sm:px-8 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Filtrar por Aluno:
                </span>
                <select
                  value={filterAthleteId}
                  onChange={(e) => setFilterAthleteId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-xs text-white font-medium outline-none cursor-pointer"
                >
                  <option value="ALL">Todos os Alunos ({athletes.length})</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => fetchResults(filterAthleteId)}
                  title="Atualizar Resultados"
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingResults ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>

              <div className="text-xs text-zinc-400">
                Total de treinos registrados: <span className="text-emerald-400 font-bold">{results.length}</span>
              </div>
            </div>

            {/* Feed de Resultados */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {loadingResults ? (
                <div className="h-full flex items-center justify-center flex-col gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-xs">Carregando execuções e fotos enviadas pelos alunos...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col gap-3 text-center p-6">
                  <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-600">
                    <Camera className="w-10 h-10 text-zinc-600" />
                  </div>
                  <p className="text-sm font-bold text-zinc-300">Nenhum treino com resultado registrado ainda</p>
                  <p className="text-xs text-zinc-500 max-w-md">
                    Assim que o aluno realizar o treino e enviar o print do relógio ou os dados de execução (km, pace, tempo, bpm), os comprovantes aparecerão aqui com comparativo do planejado vs realizado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {results.map((res) => {
                    const plannedDist = res.targetDistanceKm || res.estimatedDistanceKm || 0;
                    const actualDist = res.actualDistanceKm || 0;
                    const diffKm = (actualDist - plannedDist).toFixed(1);

                    return (
                      <div
                        key={res.id}
                        className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          {/* Cabeçalho do Treino com Aluno */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white text-sm shadow-md">
                                {res.athlete.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  {res.athlete.name}
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 uppercase">
                                    Concluído
                                  </span>
                                </h4>
                                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                  <Calendar className="w-3 h-3 text-zinc-500" />
                                  <span>{res.date} ({res.dayOfWeek})</span>
                                  {res.weekTitle && <span>• {res.weekTitle}</span>}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleResetResult(res.id)}
                              title="Remover Resultado / Reverter"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Nome do Treino */}
                          <div className="mb-3.5">
                            <h5 className="text-base font-black text-zinc-100 flex items-center gap-2">
                              <span>{res.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 uppercase">
                                {res.category}
                              </span>
                            </h5>
                          </div>

                          {/* COMPARAÇÃO: PLANEJADO VS REALIZADO */}
                          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 mb-4">
                            {/* Planejado */}
                            <div className="border-r border-zinc-800/80 pr-2">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                Planejado
                              </p>
                              <div className="text-sm font-bold text-zinc-300">
                                {plannedDist > 0 ? `${plannedDist} km` : 'Livre'}
                              </div>
                              {(res.targetPaceMin || res.targetPaceMax) && (
                                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                                  Pace: {res.targetPaceMin}{res.targetPaceMax ? `–${res.targetPaceMax}` : ''}/km
                                </div>
                              )}
                            </div>

                            {/* Realizado */}
                            <div className="pl-2">
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <span>Realizado</span>
                                {actualDist > 0 && plannedDist > 0 && (
                                  <span className={`text-[10px] font-bold ${Number(diffKm) >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {Number(diffKm) >= 0 ? `+${diffKm} km` : `${diffKm} km`}
                                  </span>
                                )}
                              </p>
                              <div className="text-sm font-black text-emerald-300">
                                {actualDist > 0 ? `${actualDist} km` : 'Concluído'}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                                {res.actualPace && <span>Pace: {res.actualPace}/km</span>}
                                {res.actualDurationMinutes && <span>⏱️ {res.actualDurationMinutes}min</span>}
                                {res.actualHeartRate && <span>❤️ {res.actualHeartRate}bpm</span>}
                              </div>
                            </div>
                          </div>

                          {/* Feedback / Comentário do Aluno */}
                          {res.feedback && (
                            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 mb-3.5">
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">
                                Feedback do Aluno:
                              </p>
                              <p className="text-xs text-zinc-300 italic">
                                "{res.feedback}"
                              </p>
                            </div>
                          )}

                          {/* Foto / Comprovante do Relógio */}
                          {res.proofImageUrl && (
                            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black/60 group">
                              <img
                                src={res.proofImageUrl}
                                alt="Comprovante do Relógio"
                                className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                  Comprovante de Treino
                                </span>
                                <button
                                  onClick={() => setPreviewImage({
                                    url: res.proofImageUrl!,
                                    title: res.name,
                                    athlete: res.athlete.name
                                  })}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-xs font-bold text-white flex items-center gap-1 backdrop-blur-sm transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Ampliar</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE ALUNO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span>{editingId ? 'Editar Aluno' : 'Novo Aluno Pace Club'}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAthlete} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Hugo Henrique"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  E-mail de Login *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="paulo@pacetraining.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Senha {editingId ? '(Deixe em branco para manter)' : '*'}
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingId ? 'Manter senha atual' : 'Padrão: 123456'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Observações / Objetivo do Aluno
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ex: Foco em Maratona sub 3h30, treina 5x por semana..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-xs text-white outline-none resize-none"
                />
              </div>

              {/* Zonas de Ritmo no Cadastro */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2.5">
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Zonas de Ritmo / Referência do Aluno
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-semibold block mb-0.5">Leve:</span>
                    <input
                      type="text"
                      value={formPaceLeve}
                      onChange={(e) => setFormPaceLeve(e.target.value)}
                      placeholder="5:10–5:40/km"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs font-mono text-zinc-200 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-400 font-semibold block mb-0.5">Moderado:</span>
                    <input
                      type="text"
                      value={formPaceModerado}
                      onChange={(e) => setFormPaceModerado(e.target.value)}
                      placeholder="4:40–5:10/km"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs font-mono text-zinc-200 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 font-semibold block mb-0.5">Controlado:</span>
                    <input
                      type="text"
                      value={formPaceControlado}
                      onChange={(e) => setFormPaceControlado(e.target.value)}
                      placeholder="3:50–4:10/km"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs font-mono text-zinc-200 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 font-semibold block mb-0.5">Tiros:</span>
                    <input
                      type="text"
                      value={formPaceTiros}
                      onChange={(e) => setFormPaceTiros(e.target.value)}
                      placeholder="3:00–3:30/km"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs font-mono text-zinc-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Aluno'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM / VISUALIZAÇÃO AMPLIADA DA FOTO DO COMPROVANTE */}
      {previewImage && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/80">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Comprovante: {previewImage.title}
                </h4>
                <p className="text-xs text-zinc-400">
                  Aluno: <span className="text-emerald-400 font-bold">{previewImage.athlete}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Original</span>
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-2 overflow-auto flex items-center justify-center bg-black/80">
              <img
                src={previewImage.url}
                alt="Comprovante em Alta Resolução"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE APLICAR CICLO AO ALUNO */}
      <ApplyCycleModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        cycles={cycles}
        athletes={athletes}
        initialCycleId={applyCycleId}
        initialAthleteId={applyAthleteId}
        onSuccess={handleCycleActionSuccess}
      />

      {/* MODAL DE CONSTRUÇÃO / EDIÇÃO DO CICLO */}
      <CycleBuilderModal
        isOpen={isCycleBuilderOpen}
        onClose={() => setIsCycleBuilderOpen(false)}
        cycleToEdit={editingCycle}
        onSuccess={handleCycleActionSuccess}
      />
    </div>
  );
};
