'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockCampaigns, MockCampaign } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { CoachInline } from '@/components/coach';

type FilterType = 'all' | 'sent' | 'scheduled' | 'draft';

const statusLabels: Record<MockCampaign['status'], string> = {
  draft: 'Brouillon',
  scheduled: 'Programmé',
  sending: 'En cours',
  sent: 'Envoyé',
};

const statusColors: Record<MockCampaign['status'], string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
};

export default function EmailsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [campaigns] = useState<MockCampaign[]>(mockCampaigns);

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'sent') return c.status === 'sent';
    if (filter === 'scheduled') return c.status === 'scheduled';
    if (filter === 'draft') return c.status === 'draft';
    return true;
  });

  // Calculate stats
  const totalSent = campaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + (c.stats?.delivered || 0), 0);
  const totalOpened = campaigns.filter(c => c.status === 'sent').reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes email</h1>
          <p className="text-gray-500 mt-1">Envoyez des emails à vos segments d&apos;utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/emails/templates"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/emails/campaigns/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle campagne
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
          <p className="text-sm text-gray-500">Campagnes</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{totalSent}</p>
          <p className="text-sm text-gray-500">Emails envoyés</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-600">{avgOpenRate}%</p>
          <p className="text-sm text-gray-500">Taux d&apos;ouverture</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {campaigns.filter(c => c.status === 'scheduled').length}
          </p>
          <p className="text-sm text-gray-500">Programmées</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'sent', label: 'Envoyées' },
              { key: 'scheduled', label: 'Programmées' },
              { key: 'draft', label: 'Brouillons' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Campaigns List */}
          <Card className="overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Campagne</th>
                  <th className="text-left p-4 font-medium text-gray-500 bg-gray-50 hidden md:table-cell">Segment</th>
                  <th className="text-center p-4 font-medium text-gray-500 bg-gray-50">Statut</th>
                  <th className="text-right p-4 font-medium text-gray-500 bg-gray-50 hidden sm:table-cell">Stats</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <Link href={`/emails/editor?campaign=${campaign.id}`} className="block">
                        <p className="font-medium text-gray-900">{campaign.subject}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{campaign.name}</p>
                      </Link>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{campaign.segmentName}</span>
                      <span className="text-xs text-gray-400 ml-1">({campaign.recipientCount})</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[campaign.status]}`}>
                        {statusLabels[campaign.status]}
                      </span>
                      {campaign.status === 'scheduled' && campaign.scheduledAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(campaign.scheduledAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell">
                      {campaign.stats ? (
                        <div className="text-sm">
                          <span className="text-gray-900 font-medium">
                            {Math.round((campaign.stats.opened / campaign.stats.delivered) * 100)}%
                          </span>
                          <span className="text-gray-400 ml-1">ouv.</span>
                          <span className="text-gray-300 mx-1">•</span>
                          <span className="text-gray-900 font-medium">
                            {Math.round((campaign.stats.clicked / campaign.stats.delivered) * 100)}%
                          </span>
                          <span className="text-gray-400 ml-1">clic</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCampaigns.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucune campagne trouvée
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CoachInline context="email" />

          {/* Quick Actions */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link
                href="/emails/campaigns/new"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-lg">🚀</span>
                <span className="text-sm">Nouvelle campagne</span>
              </Link>
              <Link
                href="/emails/templates"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-lg">📋</span>
                <span className="text-sm">Voir les templates</span>
              </Link>
              <Link
                href="/segments"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-lg">👥</span>
                <span className="text-sm">Gérer les segments</span>
              </Link>
            </div>
          </Card>

          {/* Best Practices */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <span className="text-blue-500 text-lg">💡</span>
              <div>
                <h4 className="font-semibold text-blue-900">Bonnes pratiques</h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>• Envoyez le mardi ou mercredi à 10h</li>
                  <li>• Un seul CTA par email</li>
                  <li>• Sujet court et personnalisé</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
