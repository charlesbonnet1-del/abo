'use client';

import { use } from 'react';
import Link from 'next/link';
import { getSegmentById, mockUsers, formatCurrency } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Badge, StatusDot, PlanBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { HealthBar } from '@/components/ui/health-bar';
import { CoachInline } from '@/components/coach';

export default function SegmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const segment = getSegmentById(id);

  if (!segment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Segment non trouvé</p>
      </div>
    );
  }

  // Simple mock filter - in real app would use filterRules
  const users = mockUsers.slice(0, segment.userCount);
  const totalMrr = users.reduce((sum, u) => sum + u.mrr, 0);
  const avgHealthScore = users.length > 0
    ? Math.round(users.reduce((sum, u) => sum + u.healthScore, 0) / users.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/segments"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{segment.name}</h1>
            {segment.isSystem && (
              <Badge variant="gray">Système</Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1">{segment.description}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/emails/campaigns/new?segment=${segment.id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Envoyer un email
          </Link>
          <Link
            href={`/automations/new?segment=${segment.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Créer automation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{segment.userCount}</p>
              <p className="text-sm text-gray-500">Users</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalMrr)}</p>
              <p className="text-sm text-gray-500">MRR total</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{avgHealthScore}</p>
              <p className="text-sm text-gray-500">Health moyen</p>
            </Card>
          </div>

          {/* Filter Rules */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Règles de filtrage</h2>
            {segment.filterRules.length === 0 ? (
              <p className="text-gray-500">Aucun filtre — inclut tous les utilisateurs</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {segment.filterRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                  >
                    <span className="font-medium text-gray-700">{rule.field}</span>
                    <span className="text-gray-500">
                      {rule.operator === 'equals' ? '=' :
                       rule.operator === 'not_equals' ? '!=' :
                       rule.operator === 'greater_than' ? '>' :
                       rule.operator === 'less_than' ? '<' :
                       rule.operator === 'contains' ? 'contient' :
                       rule.operator === 'in' ? 'dans' : rule.operator}
                    </span>
                    <span className="font-medium text-indigo-600">
                      {Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)}
                    </span>
                    {idx < segment.filterRules.length - 1 && (
                      <span className="text-gray-400 ml-1">ET</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Users List */}
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Users dans ce segment ({users.length})
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">User</th>
                  <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-500 bg-gray-50 hidden sm:table-cell">Plan</th>
                  <th className="text-left p-4 font-medium text-gray-500 bg-gray-50 hidden md:table-cell">Health</th>
                  <th className="text-right p-4 font-medium text-gray-500 bg-gray-50">MRR</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <Link href={`/users/${user.id}`} className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <StatusDot status={user.status} />
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <PlanBadge plan={user.plan} />
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <HealthBar score={user.healthScore} />
                    </td>
                    <td className="p-4 text-right font-medium text-gray-900">
                      {user.mrr > 0 ? formatCurrency(user.mrr) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CoachInline context="segment" />

          {/* Quick Actions */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Exporter en CSV</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Dupliquer le segment</span>
              </button>
              {!segment.isSystem && (
                <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
