'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

// Mock data for AI Activity Timeline
const aiActivityTimeline = [
  {
    id: '1',
    agent: 'Retention Agent',
    agentColor: 'emerald',
    action: 'a contacte Marc (Score 28) suite a un blocage technique',
    timestamp: 'Il y a 2 min',
    result: 'Email envoye',
    resultType: 'success' as const,
  },
  {
    id: '2',
    agent: 'Recovery Agent',
    agentColor: 'amber',
    action: 'a relance le paiement de Sophie - CB expiree',
    timestamp: 'Il y a 15 min',
    result: 'Paiement recupere (+49€)',
    resultType: 'success' as const,
  },
  {
    id: '3',
    agent: 'Conversion Agent',
    agentColor: 'blue',
    action: 'a propose une offre a Lucas (Trial J+12)',
    timestamp: 'Il y a 1h',
    result: 'Offre acceptee (+29€/mois)',
    resultType: 'success' as const,
  },
  {
    id: '4',
    agent: 'Retention Agent',
    agentColor: 'emerald',
    action: 'a detecte un risque de churn pour Marie (Score 35)',
    timestamp: 'Il y a 2h',
    result: 'En cours de traitement',
    resultType: 'pending' as const,
  },
  {
    id: '5',
    agent: 'Recovery Agent',
    agentColor: 'amber',
    action: 'a tente de recuperer le paiement de Jean',
    timestamp: 'Il y a 3h',
    result: 'Echec - CB invalide',
    resultType: 'failed' as const,
  },
  {
    id: '6',
    agent: 'Conversion Agent',
    agentColor: 'blue',
    action: 'a envoye un email de nurturing a Pierre (Freemium)',
    timestamp: 'Il y a 4h',
    result: 'Email ouvert',
    resultType: 'success' as const,
  },
];

// Mock stats
const stats = {
  mrr: 4850,
  mrrGrowth: 12.5,
  churnRate: 2.1,
  churnChange: -0.5,
  revenueRecovered: 1247,
  revenueRecoveredCount: 8,
  conversions: 12,
  retentionSaved: 5,
};

const agentColors: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
};

const resultColors: Record<string, string> = {
  success: 'text-emerald-600',
  pending: 'text-amber-600',
  failed: 'text-red-500',
};

export default function Demo2DashboardPage() {
  const [timeRange] = useState('30d');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Ton Revenue Autopilot en action</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Periode:</span>
          <select
            value={timeRange}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Revenue Recovered - Hero Widget */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-emerald-100 text-sm font-medium">Revenue Recovered ce mois</span>
            </div>
            <div className="text-4xl font-bold mb-1">{formatCurrency(stats.revenueRecovered)}</div>
            <p className="text-emerald-100 text-sm">
              {stats.revenueRecoveredCount} paiements recuperes par les Agents
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">MRR</span>
            <span className="text-emerald-600 text-xs font-medium">+{stats.mrrGrowth}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.mrr)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Churn Rate</span>
            <span className="text-emerald-600 text-xs font-medium">{stats.churnChange}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.churnRate}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Conversions</span>
            <span className="text-blue-600 text-xs font-medium">Agent</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.conversions}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Churns evites</span>
            <span className="text-emerald-600 text-xs font-medium">Agent</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.retentionSaved}</div>
        </Card>
      </div>

      {/* AI Activity Timeline */}
      <Card className="mb-8">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-semibold text-slate-900">AI Activity Timeline</h2>
            </div>
            <span className="text-xs text-slate-500">Actions automatiques des agents</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {aiActivityTimeline.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`px-2 py-1 rounded-md text-xs font-medium border ${agentColors[activity.agentColor]}`}>
                  {activity.agent}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{activity.timestamp}</span>
                    <span className="text-slate-300">•</span>
                    <span className={`text-xs font-medium ${resultColors[activity.resultType]}`}>
                      {activity.result}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 text-center">
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Voir tout l&apos;historique →
          </button>
        </div>
      </Card>

      {/* Agent Performance Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link href="/demo2/agents" className="block">
          <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Conversion Agent</h3>
                <p className="text-xs text-slate-500">Freemium → Paid</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">12 conversions</div>
            <p className="text-xs text-slate-500 mt-1">+348€ MRR genere ce mois</p>
          </Card>
        </Link>

        <Link href="/demo2/agents" className="block">
          <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Retention Agent</h3>
                <p className="text-xs text-slate-500">Prevention du churn</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">5 churns evites</div>
            <p className="text-xs text-slate-500 mt-1">245€ MRR preserve ce mois</p>
          </Card>
        </Link>

        <Link href="/demo2/agents" className="block">
          <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Recovery Agent</h3>
                <p className="text-xs text-slate-500">Echecs de paiements</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600">8 recuperes</div>
            <p className="text-xs text-slate-500 mt-1">1,247€ recupere ce mois</p>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/demo2/agents"
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          Configurer les Agents →
        </Link>
        <Link
          href="/demo2/users"
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Voir tous les users
        </Link>
      </div>
    </div>
  );
}
