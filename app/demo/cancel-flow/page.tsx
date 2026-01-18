'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  cancelFlowStats,
  cancelReasons,
  retentionOffers,
  RetentionOfferType,
  formatCurrency,
} from '@/lib/mock-data';

const offerTypeLabels: Record<RetentionOfferType, string> = {
  discount: 'Reduction',
  suspension: 'Suspension',
  downgrade: 'Downgrade',
  extension: 'Extension',
  call: 'Appel',
};

const offerTypeColors: Record<RetentionOfferType, string> = {
  discount: '#10b981',
  suspension: '#3b82f6',
  downgrade: '#f59e0b',
  extension: '#8b5cf6',
  call: '#06b6d4',
};

export default function CancelFlowPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reasons' | 'offers' | 'funnel'>('overview');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cancel Flow</h1>
          <p className="text-gray-500 mt-1">Parcours de retention et prevention du churn</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Tester le flow
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-medium">Tentatives</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{cancelFlowStats.attempts}</p>
          <p className="text-sm text-gray-500 mt-1">ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-emerald-600 font-medium">Sauves</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{cancelFlowStats.saved}</p>
          <p className="text-sm text-emerald-600 mt-1">{cancelFlowStats.saveRate}% save rate</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-medium">Suspendus</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{cancelFlowStats.suspended}</p>
          <p className="text-sm text-gray-500 mt-1">en pause</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <p className="text-sm text-amber-600 font-medium">Downgrades</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{cancelFlowStats.downgraded}</p>
          <p className="text-sm text-gray-500 mt-1">plan inferieur</p>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white">
          <p className="text-sm text-red-600 font-medium">Perdus</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{cancelFlowStats.lost}</p>
          <p className="text-sm text-red-600 mt-1">{formatCurrency(cancelFlowStats.mrrLost)} MRR</p>
        </Card>
      </div>

      {/* MRR Impact */}
      <Card className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Impact MRR ce mois</h2>
            <p className="text-sm text-gray-500 mt-1">Revenu sauve vs perdu grace au cancel flow</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-sm text-emerald-600 font-medium">MRR Sauve</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(cancelFlowStats.mrrSaved)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium">MRR Perdu</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(cancelFlowStats.mrrLost)}</p>
            </div>
            <div className="text-center px-6 py-4 bg-emerald-50 rounded-xl">
              <p className="text-sm text-emerald-600 font-medium">Net</p>
              <p className="text-2xl font-bold text-emerald-700">
                +{formatCurrency(cancelFlowStats.mrrSaved - cancelFlowStats.mrrLost)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'overview', label: 'Vue d\'ensemble' },
          { id: 'reasons', label: 'Raisons' },
          { id: 'offers', label: 'Offres de retention' },
          { id: 'funnel', label: 'Funnel' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'reasons' | 'offers' | 'funnel')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Flow Steps Preview */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Etapes du flow</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Clic "Annuler"', description: 'L\'utilisateur clique sur annuler dans ses parametres', color: '#6366f1' },
                { step: 2, title: 'Choix de la raison', description: '6 raisons configurables + champ libre', color: '#3b82f6' },
                { step: 3, title: 'Offre de retention', description: 'Offre personnalisee selon la raison', color: '#10b981' },
                { step: 4, title: 'Confirmation', description: 'Derniere chance avec recap des benefices', color: '#f59e0b' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Best Performing Offers */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Offres les plus efficaces</h2>
            <div className="space-y-3">
              {retentionOffers
                .sort((a, b) => b.stats.acceptRate - a.stats.acceptRate)
                .slice(0, 4)
                .map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${offerTypeColors[offer.type]}20` }}
                      >
                        <span style={{ color: offerTypeColors[offer.type] }} className="text-sm font-bold">
                          {offer.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{offer.name}</p>
                        <p className="text-xs text-gray-500">{offer.stats.shown} affichees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{offer.stats.acceptRate}%</p>
                      <p className="text-xs text-gray-500">{formatCurrency(offer.stats.mrrSaved)} sauves</p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Reasons Tab */}
      {activeTab === 'reasons' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Raisons de resiliation</h2>
            <button className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors">
              + Ajouter une raison
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Raison</th>
                  <th className="pb-3 font-medium">Offre associee</th>
                  <th className="pb-3 font-medium text-right">Utilisations</th>
                  <th className="pb-3 font-medium text-right">Taux de save</th>
                  <th className="pb-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cancelReasons.map((reason) => (
                  <tr key={reason.id} className="hover:bg-gray-50">
                    <td className="py-4 font-medium text-gray-900">{reason.label}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                        {reason.offerLabel}
                      </span>
                    </td>
                    <td className="py-4 text-right text-gray-600">{reason.usageCount}</td>
                    <td className="py-4 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reason.saveRate > 50
                            ? 'bg-emerald-100 text-emerald-700'
                            : reason.saveRate > 30
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {reason.saveRate}%
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Offres de retention</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle offre
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {retentionOffers.map((offer) => (
              <Card key={offer.id} className={offer.isActive ? '' : 'opacity-60'}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${offerTypeColors[offer.type]}20` }}
                    >
                      <span style={{ color: offerTypeColors[offer.type] }} className="text-lg font-bold">
                        {offerTypeLabels[offer.type].charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{offer.name}</p>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${offerTypeColors[offer.type]}20`,
                          color: offerTypeColors[offer.type],
                        }}
                      >
                        {offerTypeLabels[offer.type]}
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={offer.isActive} readOnly className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                <p className="text-sm text-gray-600 mb-4">{offer.description}</p>

                {/* Conditions */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Conditions:</p>
                  <div className="flex flex-wrap gap-1">
                    {offer.conditions.map((condition, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{offer.stats.shown}</p>
                    <p className="text-xs text-gray-500">Affichees</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{offer.stats.accepted}</p>
                    <p className="text-xs text-gray-500">Acceptees</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{offer.stats.acceptRate}%</p>
                    <p className="text-xs text-gray-500">Taux</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(offer.stats.mrrSaved)}</p>
                    <p className="text-xs text-gray-500">Sauve</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Funnel Tab */}
      {activeTab === 'funnel' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Funnel de retention</h2>

          {/* Funnel Visualization */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { label: 'Clic Annuler', value: cancelFlowStats.attempts, color: '#6366f1' },
              { label: 'Raison choisie', value: Math.round(cancelFlowStats.attempts * 0.95), color: '#3b82f6' },
              { label: 'Offre vue', value: Math.round(cancelFlowStats.attempts * 0.85), color: '#8b5cf6' },
              { label: 'Offre acceptee', value: cancelFlowStats.saved + cancelFlowStats.suspended + cancelFlowStats.downgraded, color: '#10b981' },
              { label: 'Perdus', value: cancelFlowStats.lost, color: '#ef4444' },
            ].map((step, index) => (
              <div key={step.label} className="flex items-center">
                <div className="text-center">
                  <div
                    className="w-24 flex items-center justify-center text-white font-bold text-lg rounded-lg"
                    style={{
                      backgroundColor: step.color,
                      height: `${Math.max(40, (step.value / cancelFlowStats.attempts) * 150)}px`,
                    }}
                  >
                    {step.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 max-w-[80px]">{step.label}</p>
                </div>
                {index < 4 && (
                  <svg className="w-6 h-6 text-gray-300 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div className="p-4 bg-emerald-50 rounded-xl text-center">
              <p className="text-sm text-emerald-600 font-medium">Sauves (restent)</p>
              <p className="text-2xl font-bold text-emerald-700">{cancelFlowStats.saved}</p>
              <p className="text-xs text-emerald-600 mt-1">
                {((cancelFlowStats.saved / cancelFlowStats.attempts) * 100).toFixed(0)}% du total
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-sm text-blue-600 font-medium">Suspendus</p>
              <p className="text-2xl font-bold text-blue-700">{cancelFlowStats.suspended}</p>
              <p className="text-xs text-blue-600 mt-1">
                {((cancelFlowStats.suspended / cancelFlowStats.attempts) * 100).toFixed(0)}% du total
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <p className="text-sm text-amber-600 font-medium">Downgrades</p>
              <p className="text-2xl font-bold text-amber-700">{cancelFlowStats.downgraded}</p>
              <p className="text-xs text-amber-600 mt-1">
                {((cancelFlowStats.downgraded / cancelFlowStats.attempts) * 100).toFixed(0)}% du total
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <p className="text-sm text-red-600 font-medium">Perdus</p>
              <p className="text-2xl font-bold text-red-700">{cancelFlowStats.lost}</p>
              <p className="text-xs text-red-600 mt-1">
                {((cancelFlowStats.lost / cancelFlowStats.attempts) * 100).toFixed(0)}% du total
              </p>
            </div>
          </div>

          {/* Insights */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
            <h3 className="font-medium text-indigo-900 mb-2">Insights</h3>
            <ul className="space-y-2 text-sm text-indigo-700">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Le taux de retention global est de {cancelFlowStats.saveRate}% - au-dessus de la moyenne SaaS (50%)
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                L&apos;offre &quot;Appel support&quot; a le meilleur taux d&apos;acceptation (75%)
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                &quot;Je pars chez un concurrent&quot; a le plus faible taux de save (28%) - optimiser l&apos;offre
              </li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
