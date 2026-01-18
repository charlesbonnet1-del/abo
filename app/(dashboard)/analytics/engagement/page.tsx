'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { engagementMetrics, featureAdoption, timeToValue, userSegmentation, formatCurrency } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const analyticsNavItems = [
  { href: '/analytics', label: 'Revenue' },
  { href: '/analytics/churn', label: 'Churn' },
  { href: '/analytics/engagement', label: 'Engagement', active: true },
  { href: '/analytics/conversion', label: 'Conversion' },
  { href: '/analytics/emails', label: 'Emails' },
  { href: '/analytics/popups', label: 'Popups' },
];

const SEGMENT_COLORS = ['#6366f1', '#3b82f6', '#94a3b8'];

export default function AnalyticsEngagementPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Engagement</h1>
          <p className="text-gray-500 mt-1">Metriques d&apos;engagement utilisateur</p>
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

      {/* DAU/WAU/MAU */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-medium">DAU</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{engagementMetrics.dau}</p>
          <p className="text-sm text-emerald-600 mt-1">+{engagementMetrics.dauTrend}% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-medium">WAU</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{engagementMetrics.wau}</p>
          <p className="text-sm text-emerald-600 mt-1">+{engagementMetrics.wauTrend}% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <p className="text-sm text-purple-600 font-medium">MAU</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{engagementMetrics.mau}</p>
          <p className="text-sm text-emerald-600 mt-1">+{engagementMetrics.mauTrend}% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-emerald-600 font-medium">Stickiness (DAU/MAU)</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{engagementMetrics.stickiness}%</p>
          <p className="text-sm text-emerald-600 mt-1">+{engagementMetrics.stickinessTrend}pts</p>
        </Card>
      </div>

      {/* Stickiness Benchmark */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stickiness Benchmark SaaS</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 w-[15%] bg-red-200" />
              <div className="absolute inset-y-0 left-[15%] w-[10%] bg-amber-200" />
              <div className="absolute inset-y-0 left-[25%] w-[15%] bg-emerald-200" />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow"
                style={{ left: `${Math.min(engagementMetrics.stickiness, 40)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <span className="text-red-600">15% (faible)</span>
              <span className="text-amber-600">20% (moyen)</span>
              <span className="text-emerald-600">25%+ (excellent)</span>
              <span>40%</span>
            </div>
          </div>
          <div className="w-48 text-center p-4 bg-indigo-50 rounded-xl">
            <p className="text-sm text-indigo-600 font-medium">Votre score</p>
            <p className="text-2xl font-bold text-indigo-700">{engagementMetrics.stickiness}%</p>
            <p className="text-xs text-indigo-600 mt-1">
              {engagementMetrics.stickiness >= 25 ? 'Excellent' : engagementMetrics.stickiness >= 20 ? 'Moyen' : 'A ameliorer'}
            </p>
          </div>
        </div>
      </Card>

      {/* Feature Adoption & Time to Value */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adoption des features</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureAdoption} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={100} />
                <Tooltip
                  formatter={(value) => [`${Number(value) || 0}%`, 'Adoption']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="adoptionRate" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Time to Value</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium text-right">Temps median</th>
                  <th className="pb-3 font-medium text-right">% Complete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeToValue.map((row) => (
                  <tr key={row.action} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{row.action}</td>
                    <td className="py-3 text-right">
                      <span className="text-sm text-gray-600">
                        {row.medianDays === 0 ? 'Immediat' : `J+${row.medianDays}`}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.percentCompleted > 70
                                ? 'bg-emerald-500'
                                : row.percentCompleted > 50
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${row.percentCompleted}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10">{row.percentCompleted}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Power vs Casual Users */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Power vs Casual Users</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-center justify-center">
            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userSegmentation as unknown as Array<{ [key: string]: string | number }>}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="percent"
                    nameKey="segment"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {userSegmentation.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${Number(value) || 0}%`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">Segment</th>
                    <th className="pb-3 font-medium text-right">Users</th>
                    <th className="pb-3 font-medium text-right">%</th>
                    <th className="pb-3 font-medium text-right">LTV moyen</th>
                    <th className="pb-3 font-medium text-right">MRR moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userSegmentation.map((row, index) => (
                    <tr key={row.segment} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: SEGMENT_COLORS[index] }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{row.segment}</p>
                            <p className="text-xs text-gray-500">{row.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-600">{row.count}</td>
                      <td className="py-3 text-right text-gray-600">{row.percent}%</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(row.avgLtv)}</td>
                      <td className="py-3 text-right">{formatCurrency(row.avgMrr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700">
                <strong>Insight:</strong> Les Power Users representent 12% des users mais generent 35% du MRR.
                Concentrez vos efforts pour convertir les Regular en Power users.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
