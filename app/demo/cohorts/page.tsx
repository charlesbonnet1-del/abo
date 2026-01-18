'use client';

import { useState } from 'react';
import {
  mockCohorts,
  formatCurrency,
  cohortsByPrice,
  cohortsByPromo,
  cohortsByTenure,
  customCohorts,
  CohortSegment,
} from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { CoachChips } from '@/components/coach';

type CohortTab = 'month' | 'price' | 'promo' | 'tenure' | 'custom';

// Get retention color based on percentage
function getRetentionColor(value: number): string {
  if (value >= 80) return 'bg-green-500 text-white';
  if (value >= 60) return 'bg-green-300 text-green-900';
  if (value >= 40) return 'bg-yellow-300 text-yellow-900';
  if (value >= 20) return 'bg-orange-300 text-orange-900';
  return 'bg-red-300 text-red-900';
}

// Format month for display
function formatMonth(period: string): string {
  const [year, month] = period.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}

// Heatmap table component
function RetentionHeatmap({ segments, labelFormatter }: { segments: CohortSegment[]; labelFormatter?: (label: string) => string }) {
  const formatLabel = labelFormatter || ((l: string) => l);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-3 font-medium text-gray-500 bg-gray-50 sticky left-0 z-10 min-w-[100px]">Cohorte</th>
            <th className="text-center p-3 font-medium text-gray-500 bg-gray-50 min-w-[50px]">Users</th>
            {[...Array(12)].map((_, i) => (
              <th key={i} className="text-center p-3 font-medium text-gray-500 bg-gray-50 min-w-[50px]">
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.id} className="border-b border-gray-100">
              <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                {formatLabel(segment.label)}
              </td>
              <td className="p-3 text-center text-gray-600">
                {segment.userCount}
              </td>
              {[...Array(12)].map((_, i) => {
                const value = segment.retention[i];
                if (value === undefined) {
                  return <td key={i} className="p-3 text-center text-gray-300">—</td>;
                }
                return (
                  <td key={i} className="p-2 text-center">
                    <span className={`inline-block w-full py-1 px-2 rounded text-xs font-semibold ${getRetentionColor(value)}`}>
                      {value}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tenure table (different format)
function TenureTable({ segments }: { segments: CohortSegment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Anciennete</th>
            <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">Users</th>
            <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">Churn/mois</th>
            <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">LTV moyen</th>
            <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">MRR moyen</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-4 font-medium text-gray-900">{segment.label}</td>
              <td className="p-4 text-center text-gray-600">{segment.userCount}</td>
              <td className="p-4 text-center">
                <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                  segment.churnRate <= 3 ? 'bg-green-100 text-green-700' :
                  segment.churnRate <= 6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {segment.churnRate}%
                </span>
              </td>
              <td className="p-4 text-center font-medium text-gray-900">{formatCurrency(segment.avgLtv)}</td>
              <td className="p-4 text-center text-gray-600">{formatCurrency(segment.avgMrr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Create cohort modal
function CreateCohortModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [field, setField] = useState('source');
  const [operator, setOperator] = useState('equals');
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Creer une cohorte personnalisee</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cohorte ProductHunt"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regrouper les users par :</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="source">Source acquisition</option>
                  <option value="plan">Plan</option>
                  <option value="country">Pays</option>
                  <option value="tag">Tag</option>
                </select>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="equals">egal a</option>
                  <option value="contains">contient</option>
                  <option value="starts_with">commence par</option>
                </select>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="producthunt"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700">
                + Ajouter un critere
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comparer avec :</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="compare" defaultChecked className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Tous les autres users</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="compare" className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Une autre cohorte</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Apercu :</span> 89 users matchent ce critere
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Creer la cohorte
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CohortsPage() {
  const [activeTab, setActiveTab] = useState<CohortTab>('month');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tabs: { id: CohortTab; label: string }[] = [
    { id: 'month', label: 'Par mois d\'acquisition' },
    { id: 'price', label: 'Par prix' },
    { id: 'promo', label: 'Par promo' },
    { id: 'tenure', label: 'Par duree' },
    { id: 'custom', label: 'Custom' },
  ];

  // Convert mockCohorts to segments format
  const monthSegments: CohortSegment[] = mockCohorts.map(c => ({
    id: c.id,
    label: c.period,
    userCount: c.usersCount,
    retention: c.retention,
    avgMrr: c.avgMrr,
    avgLtv: c.avgLtv,
    churnRate: c.churnRate,
  }));

  // Coach questions per tab
  const coachQuestionsByTab: Record<CohortTab, Array<{ text: string; mockAnswer: string }>> = {
    month: [
      {
        text: 'Quelle cohorte performe le mieux ?',
        mockAnswer: `**Meilleure cohorte : Avril 2024**\n\n- Retention M6 : 68% (vs moyenne 58%)\n- LTV moyen : 320€ (vs moyenne 245€)\n- Churn rate : 32% (vs moyenne 42%)\n\n**Pourquoi ?**\n1. Nouvel onboarding lance ce mois\n2. Campagne d'acquisition ciblee (SaaS B2B)\n3. Feature "Quick Start" introduite`,
      },
      {
        text: 'Pourquoi la retention M3 chute ?',
        mockAnswer: `**Analyse de la chute M3 :**\n\nLa retention passe de 75% (M2) a 65% (M3), -10 points.\n\n**Causes :**\n1. Fin de "honeymoon" : decouverte des limitations\n2. 40% n'ont pas utilise une feature cle\n3. Realisation du cout reel a M3\n\n**Solution :** Email "Quick wins" a M2 + check-in call a M2.5`,
      },
    ],
    price: [
      {
        text: 'Pourquoi les petits plans churnent plus ?',
        mockAnswer: `**Analyse churn par prix :**\n\n**0-29€ : 12% churn/mois**\n- Users "touristes" qui testent\n- Moins d'engagement (ROI faible)\n- Pas de feature lock-in\n\n**100€+ : 3% churn/mois**\n- Decision d'achat plus reflechie\n- Integration plus profonde\n- Support prioritaire\n\n**Recommandation :** Augmenter le prix d'entree ou ajouter un commitment annuel`,
      },
    ],
    promo: [
      {
        text: 'Pourquoi LAUNCH50 churne autant ?',
        mockAnswer: `**Analyse cohorte LAUNCH50 (50% off) :**\n\n**Churn : 18%** vs 5% sans promo\n\n**Causes :**\n1. **Chasseurs de promo** : pas de besoin reel\n2. **Ancrage prix** : refusent de payer plein tarif\n3. **Faible engagement** : 60% jamais configure l'integration\n\n**Solution :** \n- Limiter les grosses promos\n- Ajouter conditions (engagement 6 mois)\n- Focus onboarding pour ces users`,
      },
      {
        text: 'Quelle promo fonctionne ?',
        mockAnswer: `**Classement promos par retention M6 :**\n\n🥇 **FRIEND25** (parrainage) : 62%\n- Users qualifies par un ami\n- Engagement social\n\n🥈 **Sans promo** : 54%\n- Decision autonome = forte intention\n\n🥉 **BLACKFRIDAY** : 30%\n- Opportuniste mais pas terrible\n\n🔴 **LAUNCH50** : 16%\n- A eviter, LTV trop faible`,
      },
    ],
    tenure: [
      {
        text: 'Comment reduire le churn early ?',
        mockAnswer: `**Reduire le churn < 3 mois (8.2%) :**\n\n**Actions immediates :**\n1. Onboarding renforce (checklist in-app)\n2. Email J+3 : "Comment ca se passe ?"\n3. Call decouverte pour > 50€/mois\n\n**Metriques cles :**\n- "Aha moment" atteint = -70% churn\n- 3+ logins semaine 1 = -50% churn\n- Integration configuree = -60% churn`,
      },
    ],
    custom: [
      {
        text: 'Creer une cohorte utile',
        mockAnswer: `**Idees de cohortes custom :**\n\n1. **Par source acquisition**\n- ProductHunt vs Organic vs Ads\n- Identifier le meilleur canal\n\n2. **Par feature utilisee**\n- Users API vs users classiques\n- Mesurer l'impact feature\n\n3. **Par comportement**\n- Power users vs occasionnels\n- Adapter la communication\n\n4. **Par geographie**\n- France vs International\n- Adapter le pricing/support`,
      },
    ],
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'month':
        return (
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Retention par mois d&apos;acquisition</h2>
              <p className="text-sm text-gray-500 mt-1">Pourcentage de users actifs par mois depuis l&apos;inscription</p>
            </div>
            <RetentionHeatmap segments={monthSegments} labelFormatter={formatMonth} />
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-500"></span>&gt;80%</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-300"></span>60-80%</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-300"></span>40-60%</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-orange-300"></span>20-40%</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-300"></span>&lt;20%</span>
              </div>
            </div>
          </Card>
        );

      case 'price':
        return (
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Retention par tranche de prix</h2>
              <p className="text-sm text-gray-500 mt-1">Comparaison de retention selon le MRR</p>
            </div>
            <RetentionHeatmap segments={cohortsByPrice.segments} />
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                💡 Les plans 100€+ ont 4x moins de churn que les plans 0-29€
              </p>
            </div>
          </Card>
        );

      case 'promo':
        return (
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Retention par promotion</h2>
              <p className="text-sm text-gray-500 mt-1">Impact des codes promo sur la retention</p>
            </div>
            <RetentionHeatmap segments={cohortsByPromo.segments} />
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                ⚠️ LAUNCH50 a une retention M6 de seulement 16% - a eviter
              </p>
            </div>
          </Card>
        );

      case 'tenure':
        return (
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Comportement par anciennete</h2>
              <p className="text-sm text-gray-500 mt-1">Metriques cles selon la duree d&apos;abonnement</p>
            </div>
            <TenureTable segments={cohortsByTenure.segments} />
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                📈 Le LTV augmente de 10x entre &lt;3 mois et &gt;12 mois
              </p>
            </div>
          </Card>
        );

      case 'custom':
        return (
          <div className="space-y-6">
            {customCohorts.map((cohort) => (
              <Card key={cohort.id} className="overflow-hidden p-0">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{cohort.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Filtre : {cohort.filterRules?.map(r => `${r.field} ${r.operator} "${r.value}"`).join(' ET ')}
                    </p>
                  </div>
                  <button className="text-sm text-red-600 hover:text-red-700">Supprimer</button>
                </div>
                <RetentionHeatmap segments={cohort.segments} />
              </Card>
            ))}

            {customCohorts.length === 0 && (
              <Card className="text-center py-12">
                <p className="text-gray-500 mb-4">Aucune cohorte custom creee</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Creer ma premiere cohorte
                </button>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cohortes</h1>
          <p className="text-gray-500 mt-1">Analysez la retention et le comportement par groupe</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Creer une cohorte
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          {renderTabContent()}
        </div>

        {/* Coach Sidebar */}
        <div className="xl:col-span-1">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✨</span>
              <h3 className="font-semibold text-gray-900">Coach Cohortes</h3>
            </div>
            <CoachChips questions={coachQuestionsByTab[activeTab]} />
          </Card>

          {/* Key Insights */}
          <Card className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Insights cles</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">📈</span>
                <div>
                  <p className="font-medium text-gray-900">Meilleure cohorte</p>
                  <p className="text-sm text-gray-500">
                    Parrainage (FRIEND25) avec 62% retention M6
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">📉</span>
                <div>
                  <p className="font-medium text-gray-900">Point d&apos;attention</p>
                  <p className="text-sm text-gray-500">
                    LAUNCH50 a 18% de churn mensuel
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">💡</span>
                <div>
                  <p className="font-medium text-gray-900">Recommandation</p>
                  <p className="text-sm text-gray-500">
                    Privilegier le parrainage vs grosses promos
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Cohort Modal */}
      <CreateCohortModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
