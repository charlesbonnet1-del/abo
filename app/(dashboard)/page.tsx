'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStats, mrrHistory, formatCurrency, warningGroups } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/badge';
import { CoachChips } from '@/components/coach';
import { PeriodSelector, WarningsGrid, Period, KpiCard, KpiModal, KpiType } from '@/components/dashboard';

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [activeKpiModal, setActiveKpiModal] = useState<KpiType | null>(null);
  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vue d&apos;ensemble de ton activite</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards - Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          type="mrr"
          title="MRR"
          value={formatCurrency(stats.mrr)}
          change={`+${stats.mrrGrowth}%`}
          changeType="positive"
          icon="💰"
          onClick={() => setActiveKpiModal('mrr')}
        />
        <KpiCard
          type="active_users"
          title="Users actifs"
          value={stats.activeUsersCount.toString()}
          change={`+${stats.activeUsersGrowth}%`}
          changeType="positive"
          icon="👥"
          onClick={() => setActiveKpiModal('active_users')}
        />
        <KpiCard
          type="churn"
          title="Churn rate"
          value={`${stats.churnRate}%`}
          change="+0.5%"
          changeType="negative"
          icon="📉"
          onClick={() => setActiveKpiModal('churn')}
        />
        <KpiCard
          type="trial_conversion"
          title="Trial → Paid"
          value={`${stats.trialConversionRate}%`}
          change="-2%"
          changeType="negative"
          icon="🎯"
          onClick={() => setActiveKpiModal('trial_conversion')}
        />
      </div>

      {/* KPI Modal */}
      <KpiModal
        isOpen={activeKpiModal !== null}
        onClose={() => setActiveKpiModal(null)}
        kpiType={activeKpiModal || 'mrr'}
      />

      {/* Warnings Grid */}
      <div className="mb-8">
        <WarningsGrid warnings={warningGroups} />
      </div>

      {/* MRR Chart */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Evolution MRR</h2>
          <CoachChips
            questions={[
              {
                text: 'Comment accelerer ?',
                mockAnswer: `**Strategies pour accelerer la croissance MRR :**\n\n**Court terme (ce mois) :**\n1. Convertir les 3 trials actifs → +180€ potentiel\n2. Recuperer les paiements echoues → +198€\n3. Upgrade Pierre (limite atteinte) → +50€\n\n**Moyen terme (3 mois) :**\n1. Augmenter les prix de 10-15%\n2. Ajouter un plan "Scale" premium\n3. Programme de parrainage (LTV 40% superieur)\n\n**Potentiel a 3 mois :** +40-60% MRR`,
              },
            ]}
          />
        </div>
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

      {/* Quick Stats by Status */}
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
          <p className="text-xs text-gray-500">A risque</p>
        </Link>
        <Link href="/users?status=churned" className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:border-gray-300 transition-colors">
          <StatusDot status="churned" />
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.churnedCount}</p>
          <p className="text-xs text-gray-500">Churnes</p>
        </Link>
      </div>

      {/* View All Users */}
      <Link
        href="/users"
        className="block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        Voir tous les users →
      </Link>
    </div>
  );
}
