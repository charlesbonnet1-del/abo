'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getStats, mockUsers, mockAlerts, mrrHistory, formatCurrency, getUserById } from '@/lib/mock-data';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/badge';

export default function DashboardPage() {
  const stats = getStats();
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  // Get urgent alerts for the todo list
  const urgentAlerts = mockAlerts
    .filter((a) => !a.seen && (a.severity === 'critical' || a.severity === 'warning'))
    .slice(0, 6);

  // Get AI insights
  const insights = [
    {
      message: `${stats.freemiumCount} users freemium sont très actifs cette semaine. C'est le bon moment pour leur proposer un trial.`,
      type: 'opportunity',
    },
    {
      message: `Le churn a augmenté de 15% ce mois. Les paiements échoués en sont la cause principale.`,
      type: 'warning',
    },
    {
      message: `${stats.trialCount} users en trial, dont 1 expire dans 2 jours avec un engagement élevé.`,
      type: 'info',
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      default:
        return '🟢';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour 👋</h1>
        <p className="text-gray-500 mt-1">
          Voici ce qui se passe avec tes users aujourd&apos;hui
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="MRR"
          value={formatCurrency(stats.mrr)}
          change={stats.mrrGrowth}
        />
        <StatCard
          label="Users actifs"
          value={stats.activeUsersCount}
          change={stats.activeUsersGrowth}
        />
        <StatCard
          label="Churn rate"
          value={`${stats.churnRate}%`}
          change={-2.1}
        />
        <StatCard
          label="Trial → Paid"
          value={`${stats.trialConversionRate}%`}
          change={5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Todo List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">À faire aujourd&apos;hui</h2>
              <span className="text-sm text-gray-500">{urgentAlerts.length} actions</span>
            </div>
            <div className="space-y-3">
              {urgentAlerts.map((alert) => {
                const user = getUserById(alert.userId);
                return (
                  <Link
                    key={alert.id}
                    href={`/users/${alert.userId}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 line-clamp-2">{alert.message.split('—')[0]}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.email}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/alerts"
              className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Voir toutes les alertes →
            </Link>
          </Card>
        </div>

        {/* Coach IA Preview */}
        <div>
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <h2 className="text-lg font-semibold text-indigo-900">Coach IA</h2>
            </div>
            <div className="space-y-3">
              {insights.slice(0, 2).map((insight, i) => (
                <p key={i} className="text-sm text-indigo-800">
                  {insight.message}
                </p>
              ))}
            </div>
            <button
              onClick={() => setIsCoachOpen(true)}
              className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Parler au coach
            </button>
          </Card>
        </div>
      </div>

      {/* MRR Chart */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Évolution MRR</h2>
        <div className="h-48 flex items-end gap-2">
          {mrrHistory.map((data, i) => {
            const maxMrr = Math.max(...mrrHistory.map((d) => d.mrr));
            const heightPercent = (data.mrr / maxMrr) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600"
                  style={{ height: `${heightPercent}%` }}
                  title={`${formatCurrency(data.mrr)}`}
                />
                <span className="text-xs text-gray-500">{data.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <span className="text-gray-500">6 derniers mois</span>
          <span className="text-green-600 font-medium">+{stats.mrrGrowth}% ce mois</span>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <Link href="/users?status=freemium" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="freemium" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.freemiumCount}</p>
          <p className="text-xs text-gray-500">Freemium</p>
        </Link>
        <Link href="/users?status=trial" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="trial" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.trialCount}</p>
          <p className="text-xs text-gray-500">Trial</p>
        </Link>
        <Link href="/users?status=active" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="active" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeUsersCount}</p>
          <p className="text-xs text-gray-500">Actifs</p>
        </Link>
        <Link href="/users?status=at_risk" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="at_risk" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.atRiskCount}</p>
          <p className="text-xs text-gray-500">À risque</p>
        </Link>
        <Link href="/users?status=churned" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="churned" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.churnedCount}</p>
          <p className="text-xs text-gray-500">Churnés</p>
        </Link>
      </div>

      {/* View All */}
      <Link
        href="/users"
        className="block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        Voir tous les users →
      </Link>

      {/* Coach Chat Modal - Placeholder */}
      {isCoachOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-semibold text-gray-900">Coach Abo</h3>
              </div>
              <button
                onClick={() => setIsCoachOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-indigo-800">
                  Bonjour ! Je suis ton coach IA. Je peux t&apos;aider à réduire ton churn,
                  améliorer tes conversions, et optimiser ta stratégie d&apos;abonnements.
                </p>
              </div>
              <div className="space-y-2">
                {['Comment réduire mon churn ?', 'Analyse mes users à risque', 'Génère un email de relance'].map((q) => (
                  <button
                    key={q}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pose ta question..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
