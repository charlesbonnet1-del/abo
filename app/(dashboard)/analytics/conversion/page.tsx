'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { conversionFunnelDetailed, conversionBySourceDetailed, timeToConvert, formatCurrency } from '@/lib/mock-data';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';

const analyticsNavItems = [
  { href: '/analytics', label: 'Revenue' },
  { href: '/analytics/churn', label: 'Churn' },
  { href: '/analytics/engagement', label: 'Engagement' },
  { href: '/analytics/conversion', label: 'Conversion', active: true },
  { href: '/analytics/emails', label: 'Emails' },
  { href: '/analytics/popups', label: 'Popups' },
];

export default function AnalyticsConversionPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Conversion</h1>
          <p className="text-gray-500 mt-1">Funnel et taux de conversion</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-medium">Taux conversion Trial</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">22.8%</p>
          <p className="text-sm text-emerald-600 mt-1">+3% vs mois dernier</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-emerald-600 font-medium">Trials ce mois</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">380</p>
          <p className="text-sm text-emerald-600 mt-1">+15% vs mois dernier</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-medium">Conversions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">87</p>
          <p className="text-sm text-emerald-600 mt-1">+21% vs mois dernier</p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <p className="text-sm text-purple-600 font-medium">MRR genere</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(5220)}</p>
          <p className="text-sm text-emerald-600 mt-1">+18% vs mois dernier</p>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Funnel Trial → Paid</h2>
        <div className="flex items-center gap-4">
          {conversionFunnelDetailed.map((step, index) => (
            <div key={step.step} className="flex-1 relative">
              {/* Bar */}
              <div
                className="bg-indigo-100 rounded-lg transition-all"
                style={{ height: `${Math.max(step.rate * 2, 20)}px` }}
              >
                <div
                  className="bg-indigo-500 rounded-lg h-full"
                  style={{ width: '100%' }}
                />
              </div>
              {/* Label */}
              <div className="mt-3 text-center">
                <p className="text-sm font-medium text-gray-900">{step.step}</p>
                <p className="text-lg font-bold text-indigo-600">{step.count}</p>
                <p className="text-xs text-gray-500">{step.rate}%</p>
              </div>
              {/* Dropoff arrow */}
              {index < conversionFunnelDetailed.length - 1 && step.dropoff > 0 && (
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-xs text-red-500 font-medium">
                  -{step.dropoff.toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-700">
            <strong>Bottleneck:</strong> Le plus gros drop-off est entre &quot;Integration Stripe&quot; et &quot;Premier segment&quot; (29.3%).
            Considerez ajouter un onboarding guide a cette etape.
          </p>
        </div>
      </Card>

      {/* Conversion by Source & Time to Convert */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion par source</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium text-right">Trials</th>
                  <th className="pb-3 font-medium text-right">Convertis</th>
                  <th className="pb-3 font-medium text-right">Taux</th>
                  <th className="pb-3 font-medium text-right">MRR moy.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conversionBySourceDetailed.map((row) => (
                  <tr key={row.source} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{row.source}</td>
                    <td className="py-3 text-right text-gray-600">{row.trials}</td>
                    <td className="py-3 text-right text-gray-600">{row.converted}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.rate > 30
                            ? 'bg-emerald-100 text-emerald-700'
                            : row.rate > 20
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {row.rate}%
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{formatCurrency(row.avgMrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-700">
              <strong>Best performer:</strong> Referral avec 34.4% de conversion et le MRR moyen le plus eleve.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Time to Convert</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeToConvert}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value) || 0}%`,
                    name === 'cumulative' ? 'Cumulatif' : 'Ce jour',
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#6366f1"
                  fill="#c7d2fe"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">38%</p>
              <p className="text-xs text-gray-500">J7</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">60%</p>
              <p className="text-xs text-indigo-600">J10 (median)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">85%</p>
              <p className="text-xs text-gray-500">J14</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upgrades & Downgrades */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrades & Downgrades ce mois</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-emerald-600 font-medium">Upgrades</p>
                <p className="text-2xl font-bold text-emerald-700">12</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">Starter → Growth</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">Growth → Team</span>
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">Team → Scale</span>
                <span className="font-medium">3</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-200">
              <p className="text-sm text-emerald-700">
                <strong>+{formatCurrency(890)}</strong> MRR expansion
              </p>
            </div>
          </div>

          <div className="p-6 bg-red-50 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Downgrades</p>
                <p className="text-2xl font-bold text-red-700">4</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Scale → Team</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Team → Growth</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Growth → Starter</span>
                <span className="font-medium">1</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-sm text-red-700">
                <strong>-{formatCurrency(320)}</strong> MRR contraction
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
