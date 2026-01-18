'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';

// Mock current user
const mockCurrentUser = {
  email: 'demo@abo.app',
  name: 'Demo User',
  company: 'Abo Demo',
  createdAt: '2024-01-15T10:00:00Z',
};

export default function SettingsPage() {
  const settingsLinks = [
    {
      href: '/settings/plans',
      icon: '📊',
      title: 'Plans & Features',
      description: 'Configurer les plans et les entitlements',
    },
    {
      href: '/settings/integrations',
      icon: '🔌',
      title: 'Intégrations',
      description: 'Stripe, Webhooks, SDK Tracking',
    },
  ];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {settingsLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <span className="text-2xl mb-2 block">{link.icon}</span>
            <h3 className="font-semibold text-gray-900">{link.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Account Info */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compte</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{mockCurrentUser.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nom</p>
            <p className="font-medium text-gray-900">{mockCurrentUser.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Entreprise</p>
            <p className="font-medium text-gray-900">{mockCurrentUser.company}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Membre depuis</p>
            <p className="font-medium text-gray-900">{formatDate(mockCurrentUser.createdAt)}</p>
          </div>
        </div>
        <button className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Modifier le profil →
        </button>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
        <div className="space-y-3">
          {[
            { label: 'Alertes critiques', description: 'Paiements échoués, churn imminent', enabled: true },
            { label: 'Alertes warning', description: 'Trial expire, inactivité', enabled: true },
            { label: 'Milestones', description: 'Anniversaires, LTV atteinte', enabled: false },
            { label: 'Rapport hebdomadaire', description: 'Résumé de la semaine par email', enabled: true },
          ].map((notification, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">{notification.label}</p>
                <p className="text-sm text-gray-500">{notification.description}</p>
              </div>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notification.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
                onClick={() => alert('Toggle notification (simulation)')}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notification.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Zone dangereuse</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Exporter mes données</p>
              <p className="text-sm text-gray-500">Télécharger toutes vos données</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Exporter
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Supprimer mon compte</p>
              <p className="text-sm text-gray-500">Cette action est irréversible</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
              Supprimer
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
