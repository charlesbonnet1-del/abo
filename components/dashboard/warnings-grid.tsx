'use client';

import { WarningGroup } from '@/lib/mock-data';
import { WarningCard } from './warning-card';
import { CoachChips } from '@/components/coach';

interface WarningsGridProps {
  warnings: WarningGroup[];
}

const coachQuestions = [
  {
    text: 'Pourquoi ces warnings ?',
    mockAnswer: `Ces warnings sont generes automatiquement en analysant le comportement de vos users :\n\n**Paiements echoues :** Detection apres 3 tentatives echouees\n**Trials expirent :** Alertes 5 jours avant expiration\n**Inactifs :** Users sans connexion depuis 14+ jours\n**CB expirent :** Cartes expirant dans < 30 jours\n\n**Priorite suggeree :**\n1. Paiements echoues (risque immediat)\n2. Trials expirent (opportunite conversion)\n3. Health score bas (prevention churn)`,
  },
  {
    text: 'Quels sont les plus urgents ?',
    mockAnswer: `**Classement par urgence :**\n\n🔴 **CRITIQUE (aujourd'hui) :**\n1. Paiements echoues — 2 users, 198€ MRR a risque\n\n🟡 **IMPORTANT (cette semaine) :**\n2. Trials expirent — 3 conversions potentielles\n3. Health score < 40 — Prevenir le churn\n\n🔵 **A PLANIFIER :**\n4. CB expirent — Preventif, pas urgent\n5. Anniversaires — Opportunite engagement\n\n**Temps estime :** 2h pour les critiques, 1h pour les importants`,
  },
];

export function WarningsGrid({ warnings }: WarningsGridProps) {
  // Sort by severity: critical > warning > info > positive
  const severityOrder = { critical: 0, warning: 1, info: 2, positive: 3 };
  const sortedWarnings = [...warnings].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">⚠️</span>
        <h2 className="text-lg font-semibold text-gray-900">Warnings</h2>
        <span className="ml-auto text-sm text-gray-500">
          {warnings.length} groupes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedWarnings.map((warning) => (
          <WarningCard key={warning.id} warning={warning} />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <CoachChips questions={coachQuestions} />
      </div>
    </div>
  );
}
