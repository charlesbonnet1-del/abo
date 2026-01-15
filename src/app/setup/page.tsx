'use client';

import { onboardingChecklist, currentUser } from '@/lib/mock-data';

export default function SetupPage() {
  const completedSteps = onboardingChecklist.filter((step) => step.completed).length;
  const totalSteps = onboardingChecklist.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Welcome */}
      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block">🚀</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenue sur Abo, {currentUser.firstName} !
        </h1>
        <p className="text-gray-500">
          Tu n&apos;as pas encore d&apos;abonnés ? Pas de souci, préparons tout ensemble.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Progression</p>
          <p className="text-sm text-gray-500">
            {completedSteps}/{totalSteps} étapes
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-violet-600 h-2 rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Checklist de démarrage</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {onboardingChecklist.map((step, index) => (
            <div
              key={step.id}
              className={`p-4 flex items-center justify-between ${
                step.completed ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {step.completed ? '✓' : index + 1}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      step.completed ? 'text-green-700' : 'text-gray-900'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  step.completed
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
                disabled={step.completed}
              >
                {step.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Zone */}
      <div className="bg-violet-50 rounded-xl p-6 border border-violet-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-medium text-gray-900">Besoin d&apos;aide ?</p>
            <p className="text-sm text-gray-600">
              Décris ton produit et je t&apos;aide à configurer Abo
            </p>
          </div>
        </div>
        <textarea
          placeholder="Ex: Je lance une app SaaS de gestion de projet à 29€/mois avec un trial de 14 jours..."
          className="w-full px-4 py-3 border border-violet-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          rows={3}
          disabled
        />
        <button
          className="mt-3 w-full py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
          disabled
        >
          Démarrer la configuration guidée
        </button>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Interface de démonstration - non fonctionnelle
        </p>
      </div>
    </div>
  );
}
