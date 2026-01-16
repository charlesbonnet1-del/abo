'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockEmails, emailTemplates, getUserById, formatDate } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type TabValue = 'templates' | 'history';

const templateDescriptions: Record<string, { icon: string; color: string }> = {
  welcome: { icon: '👋', color: 'bg-blue-50 border-blue-200' },
  trial_ending: { icon: '⏰', color: 'bg-yellow-50 border-yellow-200' },
  payment_failed: { icon: '❌', color: 'bg-red-50 border-red-200' },
  reengagement: { icon: '💫', color: 'bg-purple-50 border-purple-200' },
  anniversary: { icon: '🎂', color: 'bg-green-50 border-green-200' },
  upgrade_proposal: { icon: '🚀', color: 'bg-indigo-50 border-indigo-200' },
};

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('templates');

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'default' }> = {
      draft: { label: 'Brouillon', variant: 'default' },
      sent: { label: 'Envoyé', variant: 'info' },
      opened: { label: 'Ouvert', variant: 'success' },
      clicked: { label: 'Cliqué', variant: 'success' },
    };
    const { label, variant } = config[status] || config.draft;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
        <Link
          href="/emails/editor"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Nouvel email
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Historique
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emailTemplates.map((template) => {
            const config = templateDescriptions[template.id] || { icon: '📧', color: 'bg-gray-50 border-gray-200' };
            return (
              <div
                key={template.id}
                className={`p-4 rounded-xl border-2 ${config.color} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/emails/editor?template=${template.id}`}
                    className="flex-1 py-2 text-center text-sm font-medium text-indigo-600 bg-white rounded-lg hover:bg-indigo-50 border border-indigo-200"
                  >
                    Modifier
                  </Link>
                  <Link
                    href={`/emails/editor?template=${template.id}&send=true`}
                    className="flex-1 py-2 text-center text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    Utiliser
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinataire
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sujet
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Envoyé le
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ouvert
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockEmails.map((email) => {
                  const user = getUserById(email.userId);
                  return (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/users/${email.userId}`}
                          className="text-gray-900 hover:text-indigo-600"
                        >
                          {user?.email || email.userId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{email.subject}</td>
                      <td className="py-3 px-4">{getStatusBadge(email.status)}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {email.sentAt ? formatDate(email.sentAt) : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {email.openedAt ? formatDate(email.openedAt) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
