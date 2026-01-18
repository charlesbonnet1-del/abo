'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  churnByReason,
  churnByPlanDetailed,
  churnByTenure,
  churnPredictions,
  savedVsLost,
  formatCurrency,
} from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const analyticsNavItems = [
  { href: '/analytics', label: 'Revenue' },
  { href: '/analytics/churn', label: 'Churn', active: true },
  { href: '/analytics/engagement', label: 'Engagement' },
  { href: '/analytics/conversion', label: 'Conversion' },
  { href: '/analytics/emails', label: 'Emails' },
  { href: '/analytics/popups', label: 'Popups' },
];

export default function AnalyticsChurnPage() {
  const totalChurn = churnByReason.reduce((sum, r) => sum + r.count, 0);
  const totalMrrLost = churnByReason.reduce((sum, r) => sum + r.mrr, 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Churn</h1>
          <p className="text-gray-500 mt-1">Analyse detaillee du churn</p>
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

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-red-50 to-white">
          <p className="text-sm text-red-600 font-medium">Churn Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">4.2%</p>
          <p className="text-sm text-emerald-600 mt-1">-0.5% vs mois dernier</p>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <p className="text-sm text-orange-600 font-medium">Churns ce mois</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalChurn}</p>
          <p className="text-sm text-red-600 mt-1">{formatCurrency(totalMrrLost)} MRR perdu</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-emerald-600 font-medium">Sauves</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">14</p>
          <p className="text-sm text-emerald-600 mt-1">67% taux de sauvetage</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <p className="text-sm text-amber-600 font-medium">Users a risque</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{churnPredictions.length}</p>
          <p className="text-sm text-gray-500 mt-1">A contacter en priorite</p>
        </Card>
      </div>

      {/* Churn by Reason */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Churn par raison</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={churnByReason} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="reason" tick={{ fontSize: 12 }} width={150} />
              <Tooltip
                formatter={(value, name) => [
                  name === 'count' ? `${Number(value) || 0} users` : formatCurrency(Number(value) || 0),
                  name === 'count' ? 'Users' : 'MRR perdu',
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]}>
                {churnByReason.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#dc2626' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Churn by Plan & Tenure */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Churn par plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium text-right">Taux</th>
                  <th className="pb-3 font-medium text-right">Trend</th>
                  <th className="pb-3 font-medium text-right">MRR perdu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {churnByPlanDetailed.map((row) => (
                  <tr key={row.plan} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{row.plan}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.churnRate > 5
                            ? 'bg-red-100 text-red-700'
                            : row.churnRate > 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {row.churnRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={row.trend < 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {row.trend > 0 ? '+' : ''}{row.trend}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(row.mrrLost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Churn par anciennete</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Anciennete</th>
                  <th className="pb-3 font-medium text-right">Taux churn</th>
                  <th className="pb-3 font-medium text-right">Users</th>
                  <th className="pb-3 font-medium text-right">MRR moyen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {churnByTenure.map((row) => (
                  <tr key={row.tenure} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{row.tenure}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.churnRate > 10
                            ? 'bg-red-100 text-red-700'
                            : row.churnRate > 5
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {row.churnRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-600">{row.userCount}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(row.avgMrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Churn Prediction */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Prediction de churn</h2>
          <span className="text-sm text-gray-500">Users a contacter en priorite</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium text-right">MRR</th>
                <th className="pb-3 font-medium text-center">Score risque</th>
                <th className="pb-3 font-medium">Raison principale</th>
                <th className="pb-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {churnPredictions.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.userName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{user.plan}</span>
                  </td>
                  <td className="py-3 text-right font-medium">{formatCurrency(user.mrr)}</td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            user.riskScore > 80
                              ? 'bg-red-500'
                              : user.riskScore > 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${user.riskScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{user.riskScore}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{user.mainReason}</td>
                  <td className="py-3 text-center">
                    <Link
                      href={`/users/${user.userId}`}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
                    >
                      Contacter
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Saved vs Lost */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sauves vs Perdus</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={savedVsLost}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="saved" name="Sauves" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lost" name="Perdus" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Taux de sauvetage en hausse</p>
              <p className="text-xs text-emerald-600 mt-1">
                De 40% en juillet a 67% en decembre grace aux automations
              </p>
            </div>
            <span className="text-2xl font-bold text-emerald-700">+27pts</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
