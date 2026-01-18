'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { popupPerformances, abTestResults, formatCurrency } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const analyticsNavItems = [
  { href: '/analytics', label: 'Revenue' },
  { href: '/analytics/churn', label: 'Churn' },
  { href: '/analytics/engagement', label: 'Engagement' },
  { href: '/analytics/conversion', label: 'Conversion' },
  { href: '/analytics/emails', label: 'Emails' },
  { href: '/analytics/popups', label: 'Popups', active: true },
];

const typeLabels: Record<string, string> = {
  upsell: 'Upsell',
  promo: 'Promo',
  survey: 'Survey',
  feedback: 'Feedback',
  announcement: 'Annonce',
  exit_intent: 'Exit Intent',
  onboarding: 'Onboarding',
};

const typeColors: Record<string, string> = {
  upsell: '#6366f1',
  promo: '#f59e0b',
  survey: '#10b981',
  feedback: '#8b5cf6',
  announcement: '#3b82f6',
  exit_intent: '#ef4444',
  onboarding: '#06b6d4',
};

export default function AnalyticsPopupsPage() {
  const popupAbTests = abTestResults.filter((t) => t.type === 'popup');
  const totalImpressions = popupPerformances.reduce((sum, p) => sum + p.impressions, 0);
  const totalConversions = popupPerformances.reduce((sum, p) => sum + p.conversions, 0);
  const totalRevenue = popupPerformances.reduce((sum, p) => sum + p.revenue, 0);

  // Group by type for chart
  const performanceByType = Object.entries(
    popupPerformances.reduce(
      (acc, p) => {
        if (!acc[p.type]) acc[p.type] = { type: p.type, impressions: 0, conversions: 0, revenue: 0 };
        acc[p.type].impressions += p.impressions;
        acc[p.type].conversions += p.conversions;
        acc[p.type].revenue += p.revenue;
        return acc;
      },
      {} as Record<string, { type: string; impressions: number; conversions: number; revenue: number }>
    )
  ).map(([, v]) => v);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Popups</h1>
          <p className="text-gray-500 mt-1">Performance de vos popups</p>
        </div>
        <div className="flex gap-2">
          {analyticsNavItems.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab.active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Global Performance */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-medium">Impressions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalImpressions.toLocaleString()}</p>
          <p className="text-sm text-emerald-600 mt-1">+18% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-medium">Clics</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {popupPerformances.reduce((sum, p) => sum + p.clicks, 0).toLocaleString()}
          </p>
          <p className="text-sm text-emerald-600 mt-1">+12% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-emerald-600 font-medium">Conversions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalConversions}</p>
          <p className="text-sm text-emerald-600 mt-1">+25% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <p className="text-sm text-purple-600 font-medium">Revenue genere</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-emerald-600 mt-1">+30% ce mois</p>
        </Card>
      </div>

      {/* Performance by Type */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par type</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceByType} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 12 }}
                width={100}
                tickFormatter={(v) => typeLabels[v] || v}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(Number(value) || 0) : (Number(value) || 0).toLocaleString(),
                  name === 'revenue' ? 'Revenue' : name === 'conversions' ? 'Conversions' : 'Impressions',
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="conversions" fill="#10b981" radius={[0, 4, 4, 0]}>
                {performanceByType.map((entry) => (
                  <Cell key={`cell-${entry.type}`} fill={typeColors[entry.type] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Popup Performance Table */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par popup</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Impressions</th>
                <th className="pb-3 font-medium text-right">Clics</th>
                <th className="pb-3 font-medium text-right">Conversions</th>
                <th className="pb-3 font-medium text-right">Taux conv.</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {popupPerformances.map((popup) => (
                <tr key={popup.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{popup.name}</td>
                  <td className="py-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${typeColors[popup.type]}20`,
                        color: typeColors[popup.type],
                      }}
                    >
                      {typeLabels[popup.type]}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-600">{popup.impressions.toLocaleString()}</td>
                  <td className="py-3 text-right text-gray-600">{popup.clicks.toLocaleString()}</td>
                  <td className="py-3 text-right text-emerald-600 font-medium">{popup.conversions}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        popup.conversionRate > 10
                          ? 'bg-emerald-100 text-emerald-700'
                          : popup.conversionRate > 5
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {popup.conversionRate}%
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {popup.revenue > 0 ? formatCurrency(popup.revenue) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* A/B Test Results */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultats A/B Tests Popups</h2>
        {popupAbTests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun A/B test popup en cours</p>
        ) : (
          <div className="space-y-6">
            {popupAbTests.map((test) => (
              <div key={test.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-500">
                      {test.status === 'running' ? 'En cours' : test.status === 'completed' ? 'Termine' : 'Arrete'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      test.status === 'running'
                        ? 'bg-blue-100 text-blue-700'
                        : test.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {test.confidence}% confiance
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {test.variants.map((variant) => (
                    <div
                      key={variant.name}
                      className={`p-4 rounded-lg ${
                        variant.isWinner ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{variant.name}</span>
                        {variant.isWinner && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                            Gagnant
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Impressions</p>
                          <p className="font-medium">{variant.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Conversions</p>
                          <p className="font-medium">{variant.conversions}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Taux</p>
                          <p className={`font-medium ${variant.isWinner ? 'text-emerald-600' : ''}`}>
                            {variant.rate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
