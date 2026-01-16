'use client';

import { useState } from 'react';
import { CoachQuestion, getCoachQuestionsByContext } from '@/lib/mock-data';
import { CoachConversation } from './coach-conversation';

interface CoachInlineProps {
  context: CoachQuestion['context'];
  maxQuestions?: number;
  className?: string;
}

export function CoachInline({ context, maxQuestions = 4, className = '' }: CoachInlineProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<CoachQuestion | null>(null);
  const questions = getCoachQuestionsByContext(context).slice(0, maxQuestions);

  if (questions.length === 0) return null;

  return (
    <>
      <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💡</span>
          <h3 className="font-semibold text-indigo-900">Questions Coach</h3>
        </div>
        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.id}>
              <button
                onClick={() => setSelectedQuestion(q)}
                className="w-full text-left text-sm text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/50 rounded-lg px-3 py-2 transition-colors flex items-start gap-2"
              >
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>{q.question}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <CoachConversation
        isOpen={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        initialQuestion={selectedQuestion}
        context={context}
      />
    </>
  );
}
