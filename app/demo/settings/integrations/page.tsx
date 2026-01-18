'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock webhook events
const recentWebhookEvents = [
  { id: 1, type: 'customer.subscription.created', status: 'success', timestamp: '2024-01-20T14:32:00Z' },
  { id: 2, type: 'invoice.payment_succeeded', status: 'success', timestamp: '2024-01-20T14:30:00Z' },
  { id: 3, type: 'customer.subscription.updated', status: 'success', timestamp: '2024-01-20T12:15:00Z' },
  { id: 4, type: 'invoice.payment_failed', status: 'failed', timestamp: '2024-01-19T18:45:00Z' },
  { id: 5, type: 'customer.created', status: 'success', timestamp: '2024-01-19T16:20:00Z' },
];

export default function IntegrationsSettingsPage() {
  const [stripeConnected] = useState(true);
  const [webhookUrl] = useState('https://api.abo.app/webhooks/stripe');
  const [webhookSecret] = useState('whsec_****************************abcd');
  const [apiKey] = useState('abo_live_****************************xyz');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copié ! (simulation)`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/settings"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intégrations</h1>
          <p className="text-gray-500 mt-1">Connectez vos outils et configurez les intégrations</p>
        </div>
      </div>

      {/* Stripe Integration */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stripe</h2>
              <p className="text-sm text-gray-500">Synchronisation des abonnements et paiements</p>
            </div>
          </div>
          <Badge variant={stripeConnected ? 'success' : 'gray'}>
            {stripeConnected ? 'Connecté' : 'Non connecté'}
          </Badge>
        </div>

        {stripeConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Mode</p>
                <p className="text-xs text-gray-500">Environnement actif</p>
              </div>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Dernière sync</p>
                <p className="text-xs text-gray-500">Synchronisation automatique toutes les 5 min</p>
              </div>
              <span className="text-sm text-gray-700">Il y a 2 min</span>
            </div>
            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
              Déconnecter Stripe
            </button>
          </div>
        ) : (
          <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            Connecter Stripe
          </button>
        )}
      </Card>

      {/* SDK / API Key */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SDK Tracking</h2>
            <p className="text-sm text-gray-500">Intégrez le tracking dans votre application</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clé API</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(apiKey, 'Clé API')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Code Snippet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Snippet d&apos;installation</label>
            <div className="relative">
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
{`// npm install @abo/sdk

import { Abo } from '@abo/sdk';

const abo = new Abo('${apiKey}');

// Track user activity
abo.track('feature_used', {
  userId: 'user_123',
  feature: 'export_pdf'
});

// Check entitlement
const canExport = await abo.checkEntitlement(
  'user_123',
  'export_pdf'
);`}
              </pre>
              <button
                onClick={() => copyToClipboard('npm install @abo/sdk', 'Commande')}
                className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600"
              >
                Copier
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Voir la documentation →
            </button>
            <span className="text-gray-300">|</span>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Régénérer la clé
            </button>
          </div>
        </div>
      </Card>

      {/* Webhooks */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
            <p className="text-sm text-gray-500">Recevez des événements en temps réel</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL du webhook</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl, 'URL')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secret de signature</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={webhookSecret}
                  readOnly
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showWebhookSecret ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(webhookSecret, 'Secret')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Événements récents</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {recentWebhookEvents.map((event, idx) => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-3 ${
                    idx !== recentWebhookEvents.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-mono text-sm text-gray-900">{event.type}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Voir tous les événements →
          </button>
        </div>
      </Card>

      {/* Other Integrations */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Autres intégrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: 'Slack', icon: '💬', description: 'Notifications en temps réel', soon: false },
            { name: 'Zapier', icon: '⚡', description: 'Automatisations no-code', soon: true },
            { name: 'Segment', icon: '📊', description: 'Centralisation des données', soon: true },
            { name: 'HubSpot', icon: '🧲', description: 'Sync CRM', soon: true },
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{integration.name}</p>
                  <p className="text-xs text-gray-500">{integration.description}</p>
                </div>
              </div>
              {integration.soon ? (
                <Badge variant="gray">Bientôt</Badge>
              ) : (
                <button className="px-3 py-1 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">
                  Connecter
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
