'use client';

import { WarningGroup } from '@/lib/mock-data';
import { WarningCard } from './warning-card';
import { CoachChips } from '@/components/coach';

interface WarningsGridProps {
  warnings: WarningGroup[];
}

export function WarningsGrid({ warnings }: WarningsGridProps) {
  // Sort by severity: critical > warning > info > positive
  const severityOrder = { critical: 0, warning: 1, info: 2, positive: 3 };
  const sortedWarnings = [...warnings].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  // Calculate stats for coach questions
  const totalUsers = warnings.reduce((sum, w) => sum + w.userCount, 0);
  const totalMrrAtRisk = warnings.reduce((sum, w) => sum + (w.mrrAtRisk || 0), 0);
  const totalCovered = warnings.reduce((sum, w) => sum + w.automationStatus.coveredCount, 0);
  const totalUncovered = warnings.reduce((sum, w) => sum + w.automationStatus.uncoveredCount, 0);
  const coveragePercent = totalUsers > 0 ? Math.round((totalCovered / totalUsers) * 100) : 0;

  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const uncoveredCritical = criticalWarnings.reduce((sum, w) => sum + w.automationStatus.uncoveredCount, 0);

  const coachQuestions = [
    {
      text: 'Quelle couverture ?',
      mockAnswer: `**Couverture globale des automations :**\n\n📊 **${coveragePercent}% de vos users a risque sont couverts**\n- ${totalCovered} users dans une automation\n- ${totalUncovered} users sans automation\n\n**Par type de warning :**\n${warnings.map(w => {
        const pct = w.userCount > 0 ? Math.round((w.automationStatus.coveredCount / w.userCount) * 100) : 0;
        return `- ${w.title}: ${pct}% couverts (${w.automationStatus.coveredCount}/${w.userCount})`;
      }).join('\n')}\n\n${uncoveredCritical > 0 ? `⚠️ **Attention:** ${uncoveredCritical} users critiques ne sont pas dans une automation !` : '✅ Tous les users critiques sont couverts.'}`,
    },
    {
      text: 'Quoi automatiser ?',
      mockAnswer: `**Recommandations d'automatisation :**\n\n🔴 **Priorite 1 - Paiements echoues**\nActivez "Dunning automatique" pour:\n- Email J+1: Rappel de mise a jour CB\n- Email J+3: Lien direct vers portail paiement\n- Email J+7: Alerte suspension imminente\n→ Recupere 40% des paiements echoues\n\n🟡 **Priorite 2 - Trials expirant**\nActivez "Trial Nurturing Sequence":\n- J-5: Email valeur cle + temoignage\n- J-2: Offre early-bird -10%\n- J-1: Derniere chance\n→ +25% de conversion trial\n\n🔵 **Priorite 3 - Inactifs**\nActivez "Re-engagement":\n- J+7: "On vous manque"\n- J+14: Feature highlight\n- J+21: Offre reactivation`,
    },
    {
      text: 'Impact MRR ?',
      mockAnswer: `**Impact MRR des warnings actuels :**\n\n💰 **${totalMrrAtRisk.toLocaleString()}€ MRR total a risque**\n\n**Repartition :**\n${warnings.filter(w => w.mrrAtRisk).map(w => `- ${w.title}: ${w.mrrAtRisk?.toLocaleString()}€`).join('\n')}\n\n**Potentiel de recuperation :**\nAvec les bonnes automations:\n- Paiements echoues: 40-60% recuperable\n- Trials: 15-25% conversion\n- Inactifs: 10-15% reactivation\n\n📈 **Estimation:** ${Math.round(totalMrrAtRisk * 0.35).toLocaleString()}€ recuperables\n(35% du MRR a risque)`,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h2 className="text-lg font-semibold text-gray-900">Warnings</h2>
          <span className="text-sm text-gray-500">
            {warnings.length} groupes • {totalUsers} users
          </span>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500">
            Couverture: <span className={coveragePercent >= 70 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{coveragePercent}%</span>
          </div>
          {totalMrrAtRisk > 0 && (
            <div className="text-xs text-red-600 font-medium">
              {totalMrrAtRisk.toLocaleString()}€ a risque
            </div>
          )}
        </div>
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
