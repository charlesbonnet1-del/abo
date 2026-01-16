'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  mrrKpiHistory,
  mrrByPlan,
  mrrMovements,
  churnHistory,
  churnByPlan,
  churnReasons,
  usersHistory,
  usersByStatus,
  activityBreakdown,
  conversionHistory,
  conversionFunnel,
  conversionBySource,
  KpiDataPoint,
} from '@/lib/mock-data';
import { CoachChips } from '@/components/coach';
import { ExportButton } from '@/components/export';
import { KpiType } from './kpi-card';

interface KpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiType: KpiType;
}

const periodOptions = ['7j', '30j', '90j', '12 mois', 'Custom'];

export function KpiModal({ isOpen, onClose, kpiType }: KpiModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30j');

  if (!isOpen) return null;

  const config = getKpiConfig(kpiType);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {config.title} — Detail
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Period selector */}
            <div className="flex gap-2">
              {periodOptions.map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedPeriod === period
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Main chart */}
            <div className="bg-gray-50 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={config.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [config.formatValue(Number(value) || 0), config.title]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={config.lineColor}
                    strokeWidth={2}
                    dot={{ fill: config.lineColor, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown sections */}
            {config.sections.map((section, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                </div>
                <div className="p-4">
                  {section.type === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            {section.columns.map((col, i) => (
                              <th key={i} className="pb-2 font-medium">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {section.rows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className={`py-2 ${cell.className || ''}`}>
                                  {cell.value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {section.type === 'bars' && (
                    <div className="space-y-3">
                      {section.bars.map((bar, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{bar.label}</span>
                            <span className="text-gray-500">{bar.value}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${bar.color || 'bg-indigo-500'}`}
                              style={{ width: `${bar.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Coach chips */}
            <div className="pt-2">
              <CoachChips questions={config.coachQuestions} />
            </div>

            {/* Export button */}
            <div className="flex justify-end pt-2">
              <ExportButton
                data={config.exportData}
                filename={`${kpiType}_detail`}
                label="Exporter Excel"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TableCell {
  value: string | number;
  className?: string;
}

interface TableSection {
  title: string;
  type: 'table';
  columns: string[];
  rows: TableCell[][];
}

interface BarSection {
  title: string;
  type: 'bars';
  bars: Array<{
    label: string;
    value: string;
    percent: number;
    color?: string;
  }>;
}

interface KpiConfig {
  title: string;
  chartData: KpiDataPoint[];
  lineColor: string;
  formatValue: (value: number) => string;
  sections: (TableSection | BarSection)[];
  coachQuestions: Array<{ text: string; mockAnswer: string }>;
  exportData: Record<string, unknown>[];
}

function getKpiConfig(type: KpiType): KpiConfig {
  switch (type) {
    case 'mrr':
      return {
        title: 'MRR',
        chartData: mrrKpiHistory,
        lineColor: '#10b981',
        formatValue: (v) => `${v.toLocaleString()}€`,
        sections: [
          {
            title: 'Breakdown par plan',
            type: 'table',
            columns: ['Plan', 'MRR', '% total', 'Evolution', 'Users'],
            rows: mrrByPlan.map((p) => [
              { value: p.plan },
              { value: `${p.value.toLocaleString()}€` },
              { value: `${p.percentTotal}%` },
              { value: `+${p.evolution}%`, className: 'text-green-600' },
              { value: p.userCount },
            ]),
          },
          {
            title: 'Mouvements ce mois',
            type: 'table',
            columns: ['Type', 'Montant', 'Count'],
            rows: mrrMovements.map((m) => [
              { value: m.label },
              { value: `${m.amount > 0 ? '+' : ''}${m.amount.toLocaleString()}€`, className: m.amount >= 0 ? 'text-green-600' : 'text-red-600' },
              { value: `${m.count} ${m.type === 'new' ? 'nouveaux' : m.type === 'expansion' ? 'upgrades' : m.type === 'contraction' ? 'downgrades' : 'annulations'}` },
            ]),
          },
        ],
        coachQuestions: [
          { text: 'Pourquoi +12% ce mois?', mockAnswer: 'La croissance de 12% est principalement due a 23 nouveaux clients (+1.8k€) et 8 upgrades (+450€). Le plan Scale performe particulierement bien avec +18% de croissance.' },
          { text: 'Quel plan croit le plus?', mockAnswer: 'Le plan Scale croit le plus vite (+18%), suivi de Team (+12%). Les plans premium ont une meilleure retention et donc une croissance plus stable.' },
          { text: 'Prevision M+1?', mockAnswer: 'Basee sur la tendance actuelle, je prevois un MRR de ~12.9k€ le mois prochain (+4%), avec potentiellement 25-30 nouveaux clients si les efforts marketing restent stables.' },
        ],
        exportData: mrrByPlan.map((p) => ({
          Plan: p.plan,
          MRR: p.value,
          'Pourcentage': `${p.percentTotal}%`,
          'Evolution': `+${p.evolution}%`,
          'Nombre users': p.userCount,
        })),
      };

    case 'churn':
      return {
        title: 'Churn Rate',
        chartData: churnHistory,
        lineColor: '#ef4444',
        formatValue: (v) => `${v}%`,
        sections: [
          {
            title: 'Breakdown par plan',
            type: 'table',
            columns: ['Plan', 'Churn', 'vs mois prec.', 'Users perdus', 'MRR perdu'],
            rows: churnByPlan.map((p) => [
              { value: p.plan },
              { value: `${p.churnRate}%` },
              { value: `${p.vsLastMonth > 0 ? '+' : ''}${p.vsLastMonth}%`, className: p.vsLastMonth > 0 ? 'text-red-600' : p.vsLastMonth < 0 ? 'text-green-600' : '' },
              { value: p.usersLost },
              { value: `${p.mrrLost}€` },
            ]),
          },
          {
            title: 'Raisons de churn (ce mois)',
            type: 'bars',
            bars: churnReasons.map((r) => ({
              label: r.reason,
              value: `${r.userCount} users (${r.percent}%)`,
              percent: r.percent,
              color: 'bg-red-400',
            })),
          },
        ],
        coachQuestions: [
          { text: 'Pourquoi Starter churne plus?', mockAnswer: 'Le plan Starter a le churn le plus eleve (8.2%) car: 1) Prix bas attire des clients moins engages 2) Moins de features = moins de valeur percue 3) Souvent utilise pour tester.' },
          { text: 'Comment reduire le churn?', mockAnswer: 'Recommandations: 1) Activer le dunning automatique pour les paiements echoues (38% du churn) 2) Onboarding ameliore pour les Starters 3) Emails de reengagement pour inactifs.' },
          { text: 'Qui est a risque?', mockAnswer: 'Users a risque: 12 sur plan Starter avec activite faible, 6 avec paiement echoue non resolu, 8 inactifs >15 jours. Action: Lancez une automation de reengagement.' },
        ],
        exportData: churnByPlan.map((p) => ({
          Plan: p.plan,
          'Taux churn': `${p.churnRate}%`,
          'Evolution': `${p.vsLastMonth}%`,
          'Users perdus': p.usersLost,
          'MRR perdu': `${p.mrrLost}€`,
        })),
      };

    case 'active_users':
      return {
        title: 'Users Actifs',
        chartData: usersHistory,
        lineColor: '#3b82f6',
        formatValue: (v) => v.toString(),
        sections: [
          {
            title: 'Breakdown par statut',
            type: 'table',
            columns: ['Statut', 'Count', '% total', 'Evolution'],
            rows: usersByStatus.map((s) => [
              { value: s.status },
              { value: s.count },
              { value: `${s.percentTotal}%` },
              { value: `+${s.evolution}%`, className: 'text-green-600' },
            ]),
          },
          {
            title: 'Activite',
            type: 'bars',
            bars: activityBreakdown.map((a) => ({
              label: a.label,
              value: `${a.count} users (${a.percent}%)`,
              percent: a.percent,
              color: a.isWarning ? 'bg-amber-400' : 'bg-blue-400',
            })),
          },
        ],
        coachQuestions: [
          { text: 'Qui sont les plus actifs?', mockAnswer: 'Les 89 users actifs aujourd\'hui sont principalement sur les plans Team (45%) et Growth (35%). Ils utilisent en moyenne 4.2 features/jour vs 1.3 pour les autres.' },
          { text: 'Pourquoi 21% inactifs?', mockAnswer: 'Les 111 inactifs >30j: 45% sont en plan Starter, 30% ont eu des paiements echoues, 25% n\'ont jamais complete l\'onboarding. Priorite: cibler les 30% avec paiement echoue.' },
          { text: 'Comment reengager?', mockAnswer: 'Strategie de reengagement: 1) Email "On vous manque" J+7 2) Feature highlight personnalise J+14 3) Offre speciale -20% J+21. Taux de reactivation attendu: 15-20%.' },
        ],
        exportData: usersByStatus.map((s) => ({
          Statut: s.status,
          Nombre: s.count,
          'Pourcentage': `${s.percentTotal}%`,
          'Evolution': `+${s.evolution}%`,
        })),
      };

    case 'trial_conversion':
      return {
        title: 'Conversion Trial',
        chartData: conversionHistory,
        lineColor: '#8b5cf6',
        formatValue: (v) => `${v}%`,
        sections: [
          {
            title: 'Funnel ce mois',
            type: 'bars',
            bars: conversionFunnel.map((f) => ({
              label: f.label,
              value: `${f.count} (${f.percent}%)`,
              percent: f.percent,
              color: 'bg-violet-400',
            })),
          },
          {
            title: 'Conversion par source',
            type: 'table',
            columns: ['Source', 'Trials', 'Convertis', 'Taux'],
            rows: conversionBySource.map((s) => [
              { value: s.source },
              { value: s.trials },
              { value: s.converted },
              { value: `${s.rate}%`, className: s.isWarning ? 'text-red-600' : '' },
            ]),
          },
        ],
        coachQuestions: [
          { text: 'Pourquoi Paid Ads convertit mal?', mockAnswer: 'Paid Ads a seulement 5% de conversion car: 1) Audience trop large, pas assez ciblee 2) Landing page generique 3) Pas d\'offre speciale trial. Recommandation: cibler "SaaS founders" specifiquement.' },
          { text: 'Comment ameliorer?', mockAnswer: 'Pour ameliorer la conversion: 1) Email de bienvenue optimise (J+1) 2) Demo guidee interactive (J+3) 3) Offre early-bird -15% avant fin trial. Potentiel: +5-8% de conversion.' },
          { text: 'Meilleur moment pour relancer?', mockAnswer: 'Meilleurs moments pour relancer les trials: J+3 (apres premiere utilisation), J+7 (mi-trial), J-2 (urgence fin trial). Eviter: week-ends et J+1 (trop tot).' },
        ],
        exportData: conversionBySource.map((s) => ({
          Source: s.source,
          'Nombre trials': s.trials,
          Convertis: s.converted,
          'Taux conversion': `${s.rate}%`,
        })),
      };
  }
}
