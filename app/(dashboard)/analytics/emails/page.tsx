'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { emailPerformanceGlobal, campaignPerformances, abTestResults, formatCurrency } from '@/lib/mock-data';
// Recharts not used in this page currently

const analyticsNavItems = [
  { href: '/analytics', label: 'Revenue' },
  { href: '/analytics/churn', label: 'Churn' },
  { href: '/analytics/engagement', label: 'Engagement' },
  { href: '/analytics/conversion', label: 'Conversion' },
  { href: '/analytics/emails', label: 'Emails', active: true },
  { href: '/analytics/popups', label: 'Popups' },
];

export default function AnalyticsEmailsPage() {
  const emailAbTests = abTestResults.filter((t) => t.type === 'email');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Emails</h1>
          <p className="text-gray-500 mt-1">Performance de vos emails</p>
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
      <div className="grid grid-cols-5 gap-4 mb-8">
        {emailPerformanceGlobal.map((metric) => (
          <Card key={metric.metric} className="text-center">
            <p className="text-sm text-gray-500 font-medium">{metric.metric}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {metric.value.toLocaleString()}
            </p>
            <p className="text-sm text-emerald-600 mt-1">+{metric.trend}%</p>
          </Card>
        ))}
      </div>

      {/* Funnel visualization */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Funnel Email</h2>
        <div className="flex items-end justify-center gap-8 h-48">
          {emailPerformanceGlobal.map((metric, index) => {
            const maxValue = emailPerformanceGlobal[0].value;
            const heightPercent = (metric.value / maxValue) * 100;
            return (
              <div key={metric.metric} className="flex flex-col items-center">
                <p className="text-sm font-bold text-gray-900 mb-2">{metric.value.toLocaleString()}</p>
                <div
                  className="w-20 bg-indigo-500 rounded-t-lg transition-all"
                  style={{
                    height: `${heightPercent}%`,
                    opacity: 1 - index * 0.15,
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">{metric.metric}</p>
                {index > 0 && (
                  <p className="text-xs text-gray-400">
                    {((metric.value / emailPerformanceGlobal[index - 1].value) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Campaign Performance */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par campagne/automation</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Envoyes</th>
                <th className="pb-3 font-medium text-right">Ouverts</th>
                <th className="pb-3 font-medium text-right">Cliques</th>
                <th className="pb-3 font-medium text-right">Convertis</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaignPerformances.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{camp.name}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        camp.type === 'automation'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {camp.type}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-600">{camp.sent.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className="text-gray-900">{camp.opened.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({((camp.opened / camp.delivered) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-gray-900">{camp.clicked.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({((camp.clicked / camp.opened) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-3 text-right text-emerald-600 font-medium">{camp.converted}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(camp.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* A/B Test Results */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultats A/B Tests</h2>
        {emailAbTests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun A/B test email en cours</p>
        ) : (
          <div className="space-y-6">
            {emailAbTests.map((test) => (
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
