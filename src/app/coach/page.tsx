'use client';

import { coachConversation, coachSuggestions } from '@/lib/mock-data';

export default function CoachPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Coach IA 🤖</h1>
        <p className="text-gray-500 mt-1">
          Ton assistant pour comprendre et faire grandir tes abonnés
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {coachConversation.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-sm text-gray-600">
                    Coach Abo
                  </span>
                </div>
              )}
              <div
                className={`whitespace-pre-wrap text-sm leading-relaxed ${
                  message.role === 'user' ? '' : 'prose prose-sm'
                }`}
              >
                {message.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-semibold mt-2">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('---')) {
                    return <hr key={i} className="my-3 border-gray-200" />;
                  }
                  if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                    return (
                      <p key={i} className="ml-2 mt-1">
                        {line}
                      </p>
                    );
                  }
                  if (line.startsWith('*') && line.endsWith('*')) {
                    return (
                      <p key={i} className="italic text-gray-500 mt-2 text-xs">
                        {line.replace(/\*/g, '')}
                      </p>
                    );
                  }
                  return line ? <p key={i}>{line}</p> : <br key={i} />;
                })}
              </div>
              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-violet-200' : 'text-gray-400'
                }`}
              >
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="px-6 py-3 bg-white border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {coachSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Pose ta question..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            disabled
          />
          <button
            className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
            disabled
          >
            Envoyer
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Interface de démonstration - non fonctionnelle
        </p>
      </div>
    </div>
  );
}
