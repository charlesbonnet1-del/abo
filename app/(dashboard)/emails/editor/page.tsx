'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockUsers, emailTemplates } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

const templateContent: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: 'Bienvenue sur Abo, {name}!',
    body: `Bonjour {name},

Bienvenue sur Abo ! Nous sommes ravis de vous compter parmi nous.

Votre compte {company} est maintenant actif et prêt à être utilisé.

Pour commencer, voici quelques ressources utiles :
- Guide de démarrage
- Documentation API
- Support

Si vous avez la moindre question, n'hésitez pas à nous contacter.

À bientôt,
L'équipe Abo`,
  },
  trial_ending: {
    subject: 'Votre trial expire dans {days} jours',
    body: `Bonjour {name},

Votre période d'essai sur Abo se termine dans {days} jours.

Vous avez adoré utiliser :
- La gestion des abonnements
- Les alertes automatiques
- Le tableau de bord

Pour continuer à profiter de toutes ces fonctionnalités, passez à un plan payant dès maintenant.

Cordialement,
L'équipe Abo`,
  },
  payment_failed: {
    subject: 'Action requise : mettre à jour votre moyen de paiement',
    body: `Bonjour {name},

Nous avons rencontré un problème lors du prélèvement de votre abonnement.

Pour éviter toute interruption de service, merci de mettre à jour vos informations de paiement.

[Mettre à jour mon paiement]

Si vous avez des questions, contactez-nous.

L'équipe Abo`,
  },
  reengagement: {
    subject: '{name}, vous nous manquez !',
    body: `Bonjour {name},

Cela fait un moment que nous ne vous avons pas vu sur Abo.

Nous avons ajouté de nouvelles fonctionnalités qui pourraient vous intéresser :
- Coach IA intégré
- Nouveaux rapports
- Intégrations améliorées

Reconnectez-vous et découvrez les nouveautés !

À bientôt,
L'équipe Abo`,
  },
  anniversary: {
    subject: 'Joyeux anniversaire {name} ! 🎂',
    body: `Bonjour {name},

Ça fait déjà 1 an que vous êtes avec nous !

Merci pour votre fidélité. Pour célébrer, voici un code promo de 20% sur votre prochain mois : MERCI20

Continuez à grandir avec Abo !

L'équipe Abo`,
  },
  upgrade_proposal: {
    subject: 'Débloquez plus de fonctionnalités avec {plan}',
    body: `Bonjour {name},

Vous avez atteint les limites de votre plan actuel.

Passez au plan {plan} pour débloquer :
- Plus de projets
- Plus de membres
- Fonctionnalités avancées

Profitez de 10% de réduction avec le code UPGRADE10.

À bientôt,
L'équipe Abo`,
  },
};

export default function EmailEditorPage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const content = templateContent[templateId];
    if (content) {
      setSubject(content.subject);
      setBody(content.body);
    }
  };

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + `{${variable}}`);
  };

  const handleSend = () => {
    alert('Email envoyé (simulation)');
    console.log({ to: selectedUser, subject, body });
  };

  const handleSendTest = () => {
    alert('Email de test envoyé à demo@abo.app (simulation)');
  };

  const handleSaveTemplate = () => {
    alert('Template sauvegardé (simulation)');
  };

  // Preview with replaced variables
  const selectedUserData = mockUsers.find((u) => u.id === selectedUser);
  const previewBody = body
    .replace(/{name}/g, selectedUserData?.name || 'John Doe')
    .replace(/{company}/g, selectedUserData?.company || 'Acme Corp')
    .replace(/{email}/g, selectedUserData?.email || 'john@example.com')
    .replace(/{plan}/g, 'Growth')
    .replace(/{days}/g, '3');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/emails"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Éditeur Email</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveTemplate}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Sauvegarder template
          </button>
          <button
            onClick={handleSendTest}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Envoyer test
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedUser}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          {/* Recipient */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destinataire</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sélectionner un user...</option>
              {mockUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </Card>

          {/* Template */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choisir un template...</option>
              {emailTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Card>

          {/* Subject */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de l'email..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Card>

          {/* Body */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Contenu</label>
              <div className="flex gap-1">
                <button
                  onClick={() => insertVariable('name')}
                  className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                >
                  {'{name}'}
                </button>
                <button
                  onClick={() => insertVariable('company')}
                  className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                >
                  {'{company}'}
                </button>
                <button
                  onClick={() => insertVariable('plan')}
                  className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                >
                  {'{plan}'}
                </button>
              </div>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Contenu de l'email..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card className="sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 mb-1">À:</p>
                <p className="text-sm text-gray-900">
                  {selectedUserData?.email || 'destinataire@exemple.com'}
                </p>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Sujet:</p>
                <p className="text-sm font-medium text-gray-900">
                  {subject
                    .replace(/{name}/g, selectedUserData?.name || 'John Doe')
                    .replace(/{days}/g, '3')
                    .replace(/{plan}/g, 'Growth') || 'Sujet de l\'email'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Contenu:</p>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {previewBody || 'Le contenu de l\'email apparaîtra ici...'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
