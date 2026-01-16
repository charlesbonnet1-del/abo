'use client';

import { useState } from 'react';
import { CoachPanel } from './coach-panel';

interface CoachChipsProps {
  questions: Array<{
    text: string;
    mockAnswer: string;
  }>;
  className?: string;
}

export function CoachChips({ questions, className = '' }: CoachChipsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<{ text: string; mockAnswer: string } | null>(null);

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => setSelectedQuestion(q)}
            className="px-3 py-1.5 text-sm bg-violet-50 hover:bg-violet-100
                       text-violet-700 rounded-full border border-violet-200
                       transition-colors whitespace-nowrap"
          >
            {q.text}
          </button>
        ))}
      </div>

      {selectedQuestion && (
        <CoachPanel
          question={selectedQuestion.text}
          answer={selectedQuestion.mockAnswer}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </>
  );
}
