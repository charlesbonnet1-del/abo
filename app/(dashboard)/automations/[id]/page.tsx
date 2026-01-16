'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { getAutomationById, AutomationStep, mockSegments } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stepTypeIcons: Record<string, string> = {
  email: '📧',
  wait: '⏳',
  condition: '🔀',
  tag: '🏷️',
  webhook: '🔗',
};

const stepTypeLabels: Record<string, string> = {
  email: 'Email',
  wait: 'Attendre',
  condition: 'Condition',
  tag: 'Tag',
  webhook: 'Webhook',
};

const triggerLabels: Record<string, string> = {
  signup: 'Nouveau signup',
  trial_started: 'Trial démarré',
  trial_ending: 'Trial expire bientôt',
  payment_failed: 'Paiement échoué',
  subscription_canceled: 'Abonnement annulé',
  inactive_7d: 'Inactif 7 jours',
  inactive_14d: 'Inactif 14 jours',
  plan_upgraded: 'Plan upgradé',
  plan_downgraded: 'Plan downgradé',
  limit_approaching: 'Limite approchée',
};

function StepCard({
  step,
  onEdit,
  onDelete,
}: {
  step: AutomationStep;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative">
      <Card className="border-2 border-gray-200 hover:border-indigo-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{stepTypeIcons[step.type]}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{stepTypeLabels[step.type]}</span>
                <Badge variant="gray" className="text-xs">#{step.order}</Badge>
              </div>

              {/* Step details */}
              <div className="text-sm text-gray-600 mt-1">
                {step.type === 'email' && (
                  <p>Sujet : &quot;{step.config.subject}&quot;</p>
                )}
                {step.type === 'wait' && (
                  <p>Durée : {step.config.days} jour{(step.config.days || 0) > 1 ? 's' : ''}</p>
                )}
                {step.type === 'condition' && (
                  <p>Si {step.config.field} {step.config.operator} {step.config.value}</p>
                )}
                {step.type === 'tag' && (
                  <p>{step.config.tagAction === 'add' ? 'Ajouter' : 'Retirer'} tag &quot;{step.config.tagName}&quot;</p>
                )}
                {step.type === 'webhook' && (
                  <p className="truncate max-w-[200px]">URL : {step.config.webhookUrl}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Branches for conditions */}
        {step.type === 'condition' && (step.trueBranchSteps?.length || step.falseBranchSteps?.length) && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* True branch */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs font-medium text-green-700 mb-2">✅ Si OUI</p>
              {step.trueBranchSteps && step.trueBranchSteps.length > 0 ? (
                <div className="space-y-2">
                  {step.trueBranchSteps.map((s) => (
                    <div key={s.id} className="text-xs text-green-800 flex items-center gap-1">
                      <span>{stepTypeIcons[s.type]}</span>
                      <span>{stepTypeLabels[s.type]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-600">Fin</p>
              )}
            </div>

            {/* False branch */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-medium text-red-700 mb-2">❌ Si NON</p>
              {step.falseBranchSteps && step.falseBranchSteps.length > 0 ? (
                <div className="space-y-2">
                  {step.falseBranchSteps.map((s) => (
                    <div key={s.id} className="text-xs text-red-800 flex items-center gap-1">
                      <span>{stepTypeIcons[s.type]}</span>
                      <span>{stepTypeLabels[s.type]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-600">Fin</p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Connector line */}
      <div className="absolute left-1/2 -bottom-4 w-0.5 h-4 bg-gray-300"></div>
    </div>
  );
}

export default function AutomationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const automation = getAutomationById(id);
  const [name, setName] = useState(automation?.name || '');
  const [isActive, setIsActive] = useState(automation?.isActive || false);

  if (!automation) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Automation non trouvée</p>
      </div>
    );
  }

  const handleSave = () => {
    alert('Automation sauvegardée ! (simulation)');
  };

  const handleTest = () => {
    alert('Test envoyé à demo@abo.app ! (simulation)');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/automations"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 -ml-1"
            />
            <p className="text-gray-500 mt-1">{automation.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Tester
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Status Toggle */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Statut de l&apos;automation</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isActive ? 'Cette automation est active et traite les nouveaux users.' : 'Cette automation est en pause.'}
            </p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Trigger */}
      <Card className="mb-6 border-2 border-indigo-200 bg-indigo-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-indigo-600 font-medium uppercase">Déclencheur</p>
            <div className="flex items-center gap-2 mt-1">
              <select
                defaultValue={automation.trigger.type}
                className="px-3 py-1.5 border border-indigo-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="event">Événement</option>
                <option value="segment_enter">Entrée dans segment</option>
                <option value="segment_exit">Sortie de segment</option>
                <option value="date_based">Date spécifique</option>
              </select>

              {automation.trigger.type === 'event' && (
                <select
                  defaultValue={automation.trigger.event}
                  className="px-3 py-1.5 border border-indigo-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(triggerLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              )}

              {automation.trigger.type === 'segment_enter' && (
                <select
                  defaultValue={automation.trigger.segmentId}
                  className="px-3 py-1.5 border border-indigo-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {mockSegments.map((segment) => (
                    <option key={segment.id} value={segment.id}>{segment.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Steps */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-1/2 top-0 bottom-16 w-0.5 bg-gray-200 -translate-x-1/2"></div>

        <div className="space-y-8 relative">
          {automation.steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              onEdit={() => alert(`Éditer étape ${step.id}`)}
              onDelete={() => alert(`Supprimer étape ${step.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Add Step Button */}
      <div className="mt-8 flex justify-center">
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl">
          <p className="w-full text-center text-sm text-gray-500 mb-2">Ajouter une étape :</p>
          {Object.entries(stepTypeIcons).map(([type, icon]) => (
            <button
              key={type}
              onClick={() => alert(`Ajouter étape ${type}`)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <span>{icon}</span>
              <span>{stepTypeLabels[type]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {automation.stats.sent > 0 && (
        <Card className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{automation.stats.inProgress.toLocaleString()}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{automation.stats.sent.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Envoyés</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((automation.stats.opened / automation.stats.sent) * 100)}%
              </p>
              <p className="text-sm text-gray-500">Ouverture</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((automation.stats.clicked / automation.stats.sent) * 100)}%
              </p>
              <p className="text-sm text-gray-500">Clic</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{automation.stats.converted.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Convertis</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
