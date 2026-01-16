'use client';

import Link from 'next/link';
import { getAutomationTemplates } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

const templateIcons: Record<string, string> = {
  auto_1: '👋',
  auto_2: '🧪',
  auto_3: '⏰',
  auto_4: '💳',
  auto_5: '😴',
  auto_6: '⚠️',
  auto_7: '📈',
  auto_8: '🎂',
};

const templateColors: Record<string, string> = {
  auto_1: 'from-blue-500 to-cyan-500',
  auto_2: 'from-purple-500 to-pink-500',
  auto_3: 'from-orange-500 to-red-500',
  auto_4: 'from-red-500 to-rose-500',
  auto_5: 'from-gray-500 to-slate-500',
  auto_6: 'from-yellow-500 to-orange-500',
  auto_7: 'from-green-500 to-emerald-500',
  auto_8: 'from-pink-500 to-purple-500',
};

export default function AutomationTemplatesPage() {
  const templates = getAutomationTemplates();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/automations"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates d&apos;automations</h1>
          <p className="text-gray-500 mt-1">Choisissez un template et personnalisez-le selon vos besoins</p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow p-0">
            {/* Header with gradient */}
            <div className={`h-24 bg-gradient-to-br ${templateColors[template.id] || 'from-gray-500 to-slate-500'} flex items-center justify-center`}>
              <span className="text-5xl">{templateIcons[template.id] || '📧'}</span>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 text-lg">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span>{template.steps.length} étapes</span>
                <span>•</span>
                <span>{Math.round((template.stats.opened / template.stats.sent) * 100)}% ouverture moy.</span>
              </div>

              {/* Trigger */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Déclencheur :</p>
                <p className="text-sm font-medium text-gray-700">
                  {template.trigger.type === 'event' && template.trigger.event === 'signup' && 'Nouveau signup'}
                  {template.trigger.type === 'event' && template.trigger.event === 'trial_started' && 'Trial démarré'}
                  {template.trigger.type === 'event' && template.trigger.event === 'trial_ending' && 'Trial expire dans 3 jours'}
                  {template.trigger.type === 'event' && template.trigger.event === 'payment_failed' && 'Paiement échoué'}
                  {template.trigger.type === 'event' && template.trigger.event === 'inactive_14d' && 'Inactif depuis 14 jours'}
                  {template.trigger.type === 'event' && template.trigger.event === 'limit_approaching' && 'Limite approchée'}
                  {template.trigger.type === 'segment_enter' && 'Entrée dans segment'}
                  {template.trigger.type === 'date_based' && 'Date anniversaire (1 an)'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/automations/new?template=${template.id}`}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-center hover:bg-indigo-700 transition-colors"
                >
                  Utiliser
                </Link>
                <Link
                  href={`/automations/${template.id}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Voir
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <span className="text-blue-500 text-xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900">Comment ça marche ?</h3>
            <p className="text-sm text-blue-800 mt-1">
              Les templates sont des automations pré-configurées basées sur les meilleures pratiques.
              Cliquez sur &quot;Utiliser&quot; pour créer une copie personnalisable.
              Vous pourrez modifier les emails, les délais et les conditions selon vos besoins.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
