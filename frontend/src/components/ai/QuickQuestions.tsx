import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

const defaultQuestions = [
  'Como foi minha semana?',
  'Quanto corri essa semana?',
  'Compare com a semana passada',
  'Analise meu treino de terça',
  'Quanto estava planejado?'
];

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({ onSelectQuestion, disabled }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar text-xs">
      <div className="flex items-center gap-1 text-zinc-500 font-semibold text-[11px] flex-shrink-0 mr-1">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Sugestões:</span>
      </div>

      {defaultQuestions.map((q, idx) => (
        <button
          key={idx}
          disabled={disabled}
          onClick={() => onSelectQuestion(q)}
          className="whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 text-zinc-300 hover:text-white transition-all shadow-sm disabled:opacity-50 flex-shrink-0"
        >
          {q}
        </button>
      ))}
    </div>
  );
};
