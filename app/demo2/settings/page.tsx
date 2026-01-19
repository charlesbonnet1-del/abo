'use client';

import { Card } from '@/components/ui/card';

// Mock current user
const mockCurrentUser = {
  email: 'demo@abo.app',
  name: 'Demo User',
  company: 'Abo Demo',
  createdAt: '2024-01-15T10:00:00Z',
};

export default function SettingsPage() {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Parametres</h1>

      {/* Account Info */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Compte</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="font-medium text-slate-900">{mockCurrentUser.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Nom</p>
            <p className="font-medium text-slate-900">{mockCurrentUser.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Entreprise</p>
            <p className="font-medium text-slate-900">{mockCurrentUser.company}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Membre depuis</p>
            <p className="font-medium text-slate-900">{formatDate(mockCurrentUser.createdAt)}</p>
          </div>
        </div>
        <button className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          Modifier le profil →
        </button>
      </Card>

      {/* Stripe Integration */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Integration Stripe</h2>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Connecte
          </span>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#635BFF">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">stripe_test_xxx...xxx</p>
              <p className="text-sm text-slate-500">Derniere sync: Il y a 5 min</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            Reconfigurer
          </button>
          <button className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100">
            Forcer la sync
          </button>
        </div>
      </Card>

      {/* Agent Global Settings */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Configuration globale des agents</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-900">Mode automatique</p>
              <p className="text-sm text-slate-500">Les agents executent les actions sans confirmation</p>
            </div>
            <button className="relative w-12 h-6 rounded-full transition-colors bg-emerald-600">
              <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-900">Notifications temps reel</p>
              <p className="text-sm text-slate-500">Recevoir une notification a chaque action</p>
            </div>
            <button className="relative w-12 h-6 rounded-full transition-colors bg-slate-200">
              <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-900">Rapport quotidien</p>
              <p className="text-sm text-slate-500">Resume des actions des agents par email</p>
            </div>
            <button className="relative w-12 h-6 rounded-full transition-colors bg-emerald-600">
              <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
        </div>
      </Card>

      {/* Email Configuration */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Configuration emails</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-500 block mb-1">Email expediteur</label>
            <input
              type="email"
              defaultValue="hello@monapp.fr"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500 block mb-1">Nom expediteur</label>
            <input
              type="text"
              defaultValue="L'equipe MonApp"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500 block mb-1">Signature</label>
            <textarea
              defaultValue="Cordialement,\nL'equipe MonApp"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
        <button className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          Sauvegarder
        </button>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Zone dangereuse</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Desactiver tous les agents</p>
              <p className="text-sm text-slate-500">Arrete toutes les actions automatiques</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">
              Desactiver
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Exporter mes donnees</p>
              <p className="text-sm text-slate-500">Telecharger toutes vos donnees</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
              Exporter
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Supprimer mon compte</p>
              <p className="text-sm text-slate-500">Cette action est irreversible</p>
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
