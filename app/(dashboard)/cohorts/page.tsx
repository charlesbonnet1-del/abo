'use client';

import { mockCohorts, formatCurrency } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { CoachInline } from '@/components/coach';

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
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}

export default function CohortsPage() {
  // Calculate averages
  const avgRetentionM6 = mockCohorts
    .filter(c => c.retention.length >= 7)
    .reduce((sum, c) => sum + (c.retention[6] || 0), 0) /
    mockCohorts.filter(c => c.retention.length >= 7).length || 0;

  const avgLtv = mockCohorts.reduce((sum, c) => sum + c.avgLtv, 0) / mockCohorts.length;
  const avgChurnRate = mockCohorts.reduce((sum, c) => sum + c.churnRate, 0) / mockCohorts.length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cohortes</h1>
        <p className="text-gray-500 mt-1">Analysez la rétention et le comportement par cohorte d&apos;acquisition</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{mockCohorts.length}</p>
          <p className="text-sm text-gray-500">Cohortes</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{Math.round(avgRetentionM6)}%</p>
          <p className="text-sm text-gray-500">Rétention M6 moy.</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgLtv)}</p>
          <p className="text-sm text-gray-500">LTV moyen</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{Math.round(avgChurnRate)}%</p>
          <p className="text-sm text-gray-500">Churn moyen</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Retention Heatmap */}
        <div className="xl:col-span-3">
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tableau de rétention</h2>
              <p className="text-sm text-gray-500 mt-1">Pourcentage de users actifs par mois depuis l&apos;inscription</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-500 bg-gray-50 sticky left-0 z-10 min-w-[80px]">Cohorte</th>
                    <th className="text-center p-3 font-medium text-gray-500 bg-gray-50 min-w-[50px]">Users</th>
                    {[...Array(12)].map((_, i) => (
                      <th key={i} className="text-center p-3 font-medium text-gray-500 bg-gray-50 min-w-[50px]">
                        M{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockCohorts.map((cohort) => (
                    <tr key={cohort.id} className="border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                        {formatMonth(cohort.period)}
                      </td>
                      <td className="p-3 text-center text-gray-600">
                        {cohort.usersCount}
                      </td>
                      {[...Array(12)].map((_, i) => {
                        const value = cohort.retention[i];
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
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-green-500"></span>
                  &gt;80%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-green-300"></span>
                  60-80%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-yellow-300"></span>
                  40-60%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-orange-300"></span>
                  20-40%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-red-300"></span>
                  &lt;20%
                </span>
              </div>
            </div>
          </Card>

          {/* Cohort Metrics Table */}
          <Card className="mt-6 overflow-hidden p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Métriques par cohorte</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Cohorte</th>
                    <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">Users</th>
                    <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">Rétention M6</th>
                    <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">LTV moyen</th>
                    <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">MRR moyen</th>
                    <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">Churn rate</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCohorts.map((cohort) => (
                    <tr key={cohort.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{formatMonth(cohort.period)}</td>
                      <td className="p-4 text-center text-gray-600">{cohort.usersCount}</td>
                      <td className="p-4 text-center">
                        {cohort.retention.length >= 7 ? (
                          <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                            cohort.retention[6] >= 60 ? 'bg-green-100 text-green-700' :
                            cohort.retention[6] >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {cohort.retention[6]}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-medium text-gray-900">{formatCurrency(cohort.avgLtv)}</td>
                      <td className="p-4 text-center text-gray-600">{formatCurrency(cohort.avgMrr)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                          cohort.churnRate <= 30 ? 'bg-green-100 text-green-700' :
                          cohort.churnRate <= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {Math.round(cohort.churnRate)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Coach Sidebar */}
        <div className="xl:col-span-1">
          <CoachInline context="cohorts" />

          {/* Key Insights */}
          <Card className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Insights clés</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">📈</span>
                <div>
                  <p className="font-medium text-gray-900">Meilleure cohorte</p>
                  <p className="text-sm text-gray-500">
                    {formatMonth(mockCohorts.reduce((best, c) =>
                      (c.retention[6] || 0) > (best.retention[6] || 0) ? c : best
                    ).period)} avec {Math.max(...mockCohorts.map(c => c.retention[6] || 0))}% de rétention M6
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">📉</span>
                <div>
                  <p className="font-medium text-gray-900">Point d&apos;attention</p>
                  <p className="text-sm text-gray-500">
                    La rétention chute en moyenne de 25% entre M2 et M3. Focus sur l&apos;engagement à ce stade.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">💡</span>
                <div>
                  <p className="font-medium text-gray-900">Recommandation</p>
                  <p className="text-sm text-gray-500">
                    Activez une automation de check-in à M2 pour améliorer la rétention M3.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
