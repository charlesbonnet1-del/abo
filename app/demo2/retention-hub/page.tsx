'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

// At-risk users data
const atRiskUsers = [
  {
    id: '1',
    name: 'Marc Dubois',
    email: 'marc@startup.io',
    healthScore: 28,
    riskReason: 'Blocage technique non resolu',
    mrr: 49,
    daysAtRisk: 5,
    aiAction: { status: 'in_progress', action: 'Email de support envoye', timestamp: 'Il y a 2 min' },
  },
  {
    id: '2',
    name: 'Marie Laurent',
    email: 'marie@freelance.fr',
    healthScore: 35,
    riskReason: 'Baisse engagement -60%',
    mrr: 29,
    daysAtRisk: 3,
    aiAction: { status: 'pending', action: 'En attente d\'analyse', timestamp: '' },
  },
  {
    id: '3',
    name: 'Jean Martin',
    email: 'jean@agency.com',
    healthScore: 42,
    riskReason: 'Derniere connexion il y a 14j',
    mrr: 99,
    daysAtRisk: 2,
    aiAction: { status: 'scheduled', action: 'Appel programme', timestamp: 'Demain 10h' },
  },
];

// Recently saved users
const savedUsers = [
  { name: 'Sophie Petit', reason: 'Offre retention acceptee', mrr: 49, savedAt: 'Il y a 2j' },
  { name: 'Pierre Bernard', reason: 'Probleme technique resolu', mrr: 79, savedAt: 'Il y a 3j' },
  { name: 'Lucas Martin', reason: 'Upgrade vers plan superieur', mrr: 99, savedAt: 'Il y a 5j' },
];

// Retention stats
const retentionStats = {
  atRiskCount: 3,
  atRiskMrr: 177,
  savedThisMonth: 5,
  savedMrr: 245,
  retentionRate: 94.2,
  avgTimeToResolve: '2.3j',
};

const statusColors = {
  in_progress: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
};

const statusLabels = {
  in_progress: 'En cours',
  pending: 'En attente',
  scheduled: 'Programme',
};

export default function RetentionHubPage() {
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [instructions, setInstructions] = useState(
    'Sois empathique et solution-oriented. Propose de l\'aide technique avant les reductions. Escalade vers un humain si le score tombe sous 20. Maximum 3 tentatives par utilisateur.'
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Retention Hub</h1>
          <p className="text-slate-500 mt-1">Prevention automatisee du churn</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-600">Retention Agent actif</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-red-500">
          <p className="text-xs text-slate-500 mb-1">Utilisateurs a risque</p>
          <p className="text-2xl font-bold text-slate-900">{retentionStats.atRiskCount}</p>
          <p className="text-xs text-red-600 mt-1">{retentionStats.atRiskMrr}€ MRR en danger</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-500 mb-1">Sauves ce mois</p>
          <p className="text-2xl font-bold text-emerald-600">{retentionStats.savedThisMonth}</p>
          <p className="text-xs text-emerald-600 mt-1">{retentionStats.savedMrr}€ preserves</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Taux de retention</p>
          <p className="text-2xl font-bold text-slate-900">{retentionStats.retentionRate}%</p>
          <p className="text-xs text-slate-400 mt-1">+2.1% vs mois dernier</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Temps moyen resolution</p>
          <p className="text-2xl font-bold text-slate-900">{retentionStats.avgTimeToResolve}</p>
          <p className="text-xs text-slate-400 mt-1">Par l&apos;agent</p>
        </Card>
      </div>

      {/* At-Risk Users */}
      <Card className="mb-8">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-slate-900">Utilisateurs a risque</h2>
            </div>
            <span className="text-sm text-slate-500">{atRiskUsers.length} utilisateurs</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {atRiskUsers.map((user) => (
            <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Health Score Indicator */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                    user.healthScore < 30 ? 'bg-red-500' :
                    user.healthScore < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    {user.healthScore}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {user.riskReason}
                      </span>
                      <span className="text-xs text-slate-400">
                        A risque depuis {user.daysAtRisk}j
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{user.mrr}€</p>
                  <p className="text-xs text-slate-500">MRR</p>
                </div>
              </div>

              {/* AI Action Status */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[user.aiAction.status as keyof typeof statusColors]}`}>
                      {statusLabels[user.aiAction.status as keyof typeof statusLabels]}
                    </span>
                    <span className="text-sm text-slate-600">{user.aiAction.action}</span>
                  </div>
                  {user.aiAction.timestamp && (
                    <span className="text-xs text-slate-400">{user.aiAction.timestamp}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recently Saved */}
      <Card className="mb-8">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-slate-900">Recemment sauves</h2>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {savedUsers.map((user, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-sm text-emerald-600">{user.reason}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-emerald-600">+{user.mrr}€ preserves</p>
                <p className="text-xs text-slate-400">{user.savedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Agent Instructions */}
      <Card>
        <div
          className="p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
          onClick={() => setInstructionsExpanded(!instructionsExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="font-semibold text-slate-900">Instructions de l&apos;agent</h2>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${instructionsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {instructionsExpanded && (
          <div className="p-4">
            <p className="text-sm text-slate-600 mb-3">
              Ces instructions guident le comportement et le ton de l&apos;agent Retention.
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Instructions pour l'agent..."
            />
            <div className="flex justify-end mt-3">
              <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                Sauvegarder
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
