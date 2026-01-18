'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { mockPopups, PopupType, PopupStatus, formatCurrency } from '@/lib/mock-data';

const typeLabels: Record<PopupType, string> = {
  upsell: 'Upsell',
  promo: 'Promo',
  survey: 'Survey',
  feedback: 'Feedback',
  announcement: 'Annonce',
  exit_intent: 'Exit Intent',
  onboarding: 'Onboarding',
};

const typeColors: Record<PopupType, string> = {
  upsell: '#6366f1',
  promo: '#f59e0b',
  survey: '#10b981',
  feedback: '#8b5cf6',
  announcement: '#3b82f6',
  exit_intent: '#ef4444',
  onboarding: '#06b6d4',
};

const statusLabels: Record<PopupStatus, string> = {
  active: 'Actif',
  draft: 'Brouillon',
  paused: 'En pause',
  archived: 'Archive',
  ab_test: 'A/B Test',
};

const statusColors: Record<PopupStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  paused: { bg: 'bg-amber-100', text: 'text-amber-700' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-500' },
  ab_test: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function PopupsPage() {
  const [typeFilter, setTypeFilter] = useState<PopupType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PopupStatus | 'all'>('all');

  const filteredPopups = mockPopups.filter((popup) => {
    if (typeFilter !== 'all' && popup.type !== typeFilter) return false;
    if (statusFilter !== 'all' && popup.status !== statusFilter) return false;
    return true;
  });

  const activeCount = mockPopups.filter((p) => p.status === 'active').length;
  const totalImpressions = mockPopups.reduce((sum, p) => sum + p.stats.impressions, 0);
  const totalConversions = mockPopups.reduce((sum, p) => sum + p.stats.conversions, 0);
  const totalRevenue = mockPopups.reduce((sum, p) => sum + p.stats.revenue, 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Popups Builder</h1>
          <p className="text-gray-500 mt-1">Creez et gerez vos popups</p>
        </div>
        <Link
          href="/popups/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Creer un popup
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-sm text-indigo-600 font-medium">Popups actifs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</p>
          <p className="text-sm text-gray-500 mt-1">sur {mockPopups.length} total</p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <p className="text-sm text-blue-600 font-medium">Impressions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalImpressions.toLocaleString()}</p>
          <p className="text-sm text-emerald-600 mt-1">+18% ce mois</p>
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

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-6">
          {/* Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PopupType | 'all')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous</option>
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Statut:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PopupStatus | 'all')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tous</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-500">
            {filteredPopups.length} popup{filteredPopups.length > 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Popups List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Statut</th>
                <th className="pb-3 font-medium text-right">Impressions</th>
                <th className="pb-3 font-medium text-right">Clics</th>
                <th className="pb-3 font-medium text-right">Conv.</th>
                <th className="pb-3 font-medium text-right">Taux</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
                <th className="pb-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPopups.map((popup) => {
                const conversionRate =
                  popup.stats.impressions > 0
                    ? ((popup.stats.conversions / popup.stats.impressions) * 100).toFixed(1)
                    : '0';
                return (
                  <tr key={popup.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-900">{popup.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{popup.design.title}</p>
                      </div>
                    </td>
                    <td className="py-4">
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
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[popup.status].bg} ${statusColors[popup.status].text}`}
                      >
                        {statusLabels[popup.status]}
                      </span>
                    </td>
                    <td className="py-4 text-right text-gray-600">{popup.stats.impressions.toLocaleString()}</td>
                    <td className="py-4 text-right text-gray-600">{popup.stats.clicks.toLocaleString()}</td>
                    <td className="py-4 text-right text-emerald-600 font-medium">{popup.stats.conversions}</td>
                    <td className="py-4 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          Number(conversionRate) > 10
                            ? 'bg-emerald-100 text-emerald-700'
                            : Number(conversionRate) > 5
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {conversionRate}%
                      </span>
                    </td>
                    <td className="py-4 text-right font-medium">
                      {popup.stats.revenue > 0 ? formatCurrency(popup.stats.revenue) : '-'}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/popups/${popup.id}`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                        <button
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title={popup.status === 'active' ? 'Pause' : 'Activer'}
                        >
                          {popup.status === 'active' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Stats by Type */}
      <div className="grid grid-cols-7 gap-3 mt-8">
        {(Object.keys(typeLabels) as PopupType[]).map((type) => {
          const typePopups = mockPopups.filter((p) => p.type === type);
          const activePopups = typePopups.filter((p) => p.status === 'active').length;
          return (
            <div
              key={type}
              className="p-4 bg-white rounded-xl border border-gray-200 text-center cursor-pointer hover:border-indigo-300 transition-colors"
              onClick={() => setTypeFilter(type === typeFilter ? 'all' : type)}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: `${typeColors[type]}20` }}
              >
                <span style={{ color: typeColors[type] }} className="text-lg font-bold">
                  {typeLabels[type].charAt(0)}
                </span>
              </div>
              <p className="text-xs text-gray-500">{typeLabels[type]}</p>
              <p className="text-sm font-semibold text-gray-900">
                {activePopups}/{typePopups.length}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
