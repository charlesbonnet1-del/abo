'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockAutomations, MockAutomation } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoachInline } from '@/components/coach';

type FilterType = 'all' | 'active' | 'inactive' | 'draft';

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
  segment_enter: 'Entrée dans segment',
  segment_exit: 'Sortie de segment',
  date_based: 'Date spécifique',
};

export default function AutomationsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [automations] = useState<MockAutomation[]>(mockAutomations);

  const filteredAutomations = automations.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'active') return a.isActive;
    if (filter === 'inactive') return !a.isActive;
    return true;
  });

  const activeCount = automations.filter(a => a.isActive).length;
  const totalInProgress = automations.reduce((sum, a) => sum + a.stats.inProgress, 0);
  const totalSent = automations.reduce((sum, a) => sum + a.stats.sent, 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-500 mt-1">Créez et gérez vos workflows automatisés</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/automations/templates"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Templates
          </Link>
          <Link
            href="/automations/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{automations.length}</p>
          <p className="text-sm text-gray-500">Automations</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-sm text-gray-500">Actives</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-600">{totalInProgress.toLocaleString()}</p>
          <p className="text-sm text-gray-500">En cours</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Emails envoyés</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'active', label: 'Actives' },
              { key: 'inactive', label: 'Inactives' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Automations List */}
          <div className="space-y-4">
            {filteredAutomations.map((automation) => (
              <Card key={automation.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      automation.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {automation.isActive ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                        {automation.isTemplate && (
                          <Badge variant="info" className="text-xs">Template</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{automation.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          ⚡ {triggerLabels[automation.trigger.event || automation.trigger.type] || automation.trigger.type}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{automation.steps.length} étapes</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/automations/${automation.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Modifier
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-6 text-sm">
                    {automation.stats.inProgress > 0 && (
                      <span className="text-indigo-600 font-medium">
                        {automation.stats.inProgress.toLocaleString()} en cours
                      </span>
                    )}
                    <span className="text-gray-500">
                      {automation.stats.sent.toLocaleString()} envoyés
                    </span>
                    <span className="text-gray-500">
                      {Math.round((automation.stats.opened / automation.stats.sent) * 100) || 0}% ouverture
                    </span>
                    <span className="text-gray-500">
                      {Math.round((automation.stats.clicked / automation.stats.sent) * 100) || 0}% clic
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CoachInline context="automation" />

          {/* Quick Create */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Créer rapidement</h3>
            <div className="space-y-2">
              {[
                { icon: '👋', label: 'Onboarding', href: '/automations/templates?select=auto_1' },
                { icon: '💳', label: 'Paiement échoué', href: '/automations/templates?select=auto_4' },
                { icon: '😴', label: 'Réactivation', href: '/automations/templates?select=auto_5' },
                { icon: '📈', label: 'Upgrade nudge', href: '/automations/templates?select=auto_7' },
              ].map(({ icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm">{label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
