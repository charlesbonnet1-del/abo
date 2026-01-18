'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { mrrWaterfall, arrProjection, nrrData, mrrByPlan, formatCurrency } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, ReferenceLine } from 'recharts';

const milestones = [
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
  { value: 2000000, label: '2M' },
];

export default function AnalyticsRevenuePage() {
  const [arrView, setArrView] = useState<'all' | 'current'>('all');

  // Calculate waterfall running total
  let runningTotal = 0;
  const waterfallWithPositions = mrrWaterfall.map((item) => {
    const start = runningTotal;
    if (item.type === 'start' || item.type === 'end') {
      runningTotal = item.value;
      return { ...item, start: 0, end: item.value };
    } else {
      runningTotal += item.value;
      return { ...item, start, end: runningTotal };
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics - Revenue</h1>
          <p className="text-gray-500 mt-1">Suivi detaille de vos revenus</p>
        </div>
        <div className="flex gap-2">
          {[
            { href: '/analytics', label: 'Revenue', active: true },
            { href: '/analytics/churn', label: 'Churn' },
            { href: '/analytics/engagement', label: 'Engagement' },
            { href: '/analytics/conversion', label: 'Conversion' },
            { href: '/analytics/emails', label: 'Emails' },
            { href: '/analytics/popups', label: 'Popups' },
          ].map((tab) => (
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
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-medium">MRR Actuel</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(12400)}</p>
          <p className="text-sm text-emerald-600 mt-1">+10.7% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-sm text-emerald-600 font-medium">ARR</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(148800)}</p>
          <p className="text-sm text-emerald-600 mt-1">+42% YoY</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-medium">NRR</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{nrrData.current}%</p>
          <p className="text-sm text-emerald-600 mt-1">+{nrrData.trend}% ce mois</p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <p className="text-sm text-purple-600 font-medium">ARPU</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(73)}</p>
          <p className="text-sm text-emerald-600 mt-1">+5% ce mois</p>
        </Card>
      </div>

      {/* MRR Waterfall */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">MRR Waterfall - Ce mois</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallWithPositions} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
              <Tooltip
                formatter={(value) => [`${formatCurrency(Math.abs(Number(value) || 0))}`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallWithPositions.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.type === 'start' || entry.type === 'end'
                        ? '#6366f1'
                        : entry.type === 'positive'
                        ? '#10b981'
                        : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <span className="text-sm text-gray-600">MRR Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-sm text-gray-600">Gains</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-sm text-gray-600">Pertes</span>
          </div>
        </div>
      </Card>

      {/* ARR Projection */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Projection ARR vers 1M/2M</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setArrView('current')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                arrView === 'current' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Projection actuelle
            </button>
            <button
              onClick={() => setArrView('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                arrView === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Tous scenarios
            </button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={arrProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              {milestones.map((m) => (
                <ReferenceLine
                  key={m.value}
                  y={m.value}
                  stroke="#9ca3af"
                  strokeDasharray="5 5"
                  label={{ value: m.label, position: 'right', fontSize: 11 }}
                />
              ))}
              {arrView === 'all' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="pessimistic"
                    name="Pessimiste"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="optimistic"
                    name="Optimiste"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}
              <Line
                type="monotone"
                dataKey="current"
                name="Projection actuelle"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* NRR Gauge & Revenue by Plan */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* NRR */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Revenue Retention (NRR)</h2>
          <div className="flex items-center justify-center py-8">
            <div className="relative w-48 h-48">
              {/* Gauge background */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="188.5"
                  strokeDashoffset="47"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={nrrData.current >= 100 ? '#10b981' : '#f59e0b'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="188.5"
                  strokeDashoffset={188.5 - (188.5 * 0.75 * Math.min(nrrData.current, 130)) / 130 + 47}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{nrrData.current}%</span>
                <span className={`text-sm ${nrrData.current >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {nrrData.current >= 100 ? 'Croissance organique' : 'En dessous de 100%'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <span className="text-gray-500">Benchmark: </span>
            <span className="text-red-500">&lt;90% mauvais</span>
            <span className="text-amber-500">90-100% moyen</span>
            <span className="text-emerald-500">&gt;100% excellent</span>
          </div>
          <div className="h-32 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nrrData.history}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[90, 120]} tick={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue par plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium text-right">MRR</th>
                  <th className="pb-3 font-medium text-right">% Total</th>
                  <th className="pb-3 font-medium text-right">Evolution</th>
                  <th className="pb-3 font-medium text-right">Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mrrByPlan.map((row) => (
                  <tr key={row.plan} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{row.plan}</td>
                    <td className="py-3 text-right">{formatCurrency(row.value)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${row.percentTotal}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{row.percentTotal}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={row.evolution > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {row.evolution > 0 ? '+' : ''}{row.evolution}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-600">{row.userCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
