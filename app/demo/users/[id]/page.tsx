'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { getUserById, formatDate, formatCurrency, plansConfig, sampleUserAttributes } from '@/lib/mock-data';
import { UserAttributes } from '@/components/attributes';
import { StatusBadge, PlanBadge, Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { HealthBar } from '@/components/ui/health-bar';
import { StatCard } from '@/components/ui/stat-card';

export default function UserDetailPage() {
  const params = useParams();
  const user = getUserById(params.id as string);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');

  if (!user) {
    notFound();
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      console.log('Note ajoutée:', newNote);
      alert('Note ajoutée (simulation)');
      setNewNote('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      console.log('Tag ajouté:', newTag);
      alert('Tag ajouté (simulation)');
      setNewTag('');
    }
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      payment_success: '💳',
      payment_failed: '❌',
      subscription_created: '🎉',
      subscription_canceled: '😢',
      login: '🔑',
      feature_used: '⚡',
      limit_reached: '🚫',
      email_sent: '📧',
      email_opened: '👀',
    };
    return icons[type] || '📌';
  };

  // Calculate trial days remaining
  const trialDaysRemaining = user.trialEndsAt
    ? Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Coach suggestion based on user status
  const getCoachSuggestion = () => {
    if (user.status === 'freemium' && user.healthScore > 70) {
      return {
        message: `Ce user est très actif mais en plan Free. Propose-lui un trial avec un email personnalisé.`,
        action: 'Générer un email',
      };
    }
    if (user.status === 'at_risk') {
      return {
        message: `Attention, ce user est à risque. ${user.events.some(e => e.type === 'payment_failed') ? 'Paiements échoués détectés.' : 'Inactivité prolongée.'} Voici une stratégie de réengagement.`,
        action: 'Voir les recommandations',
      };
    }
    if (user.status === 'trial' && trialDaysRemaining && trialDaysRemaining <= 3) {
      return {
        message: `Trial expire dans ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''}. C'est le moment de convertir!`,
        action: 'Envoyer un email de conversion',
      };
    }
    if (user.status === 'active' && user.ltv > 500) {
      return {
        message: `Client fidèle avec ${formatCurrency(user.ltv)} de LTV. Potentiel ambassadeur ou upsell.`,
        action: 'Proposer un upgrade',
      };
    }
    return null;
  };

  const coachSuggestion = getCoachSuggestion();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/users"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Retour</span>
        </Link>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Envoyer email
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            Actions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card>
            <div className="flex items-start gap-4">
              <Avatar name={user.name} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <StatusBadge status={user.status} />
                  <PlanBadge plan={user.plan} />
                </div>
                <p className="text-gray-500">{user.email}</p>
                {user.company && (
                  <p className="text-gray-600 mt-1">{user.company}</p>
                )}
                {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
                  <p className="text-yellow-600 text-sm mt-2">
                    ⏰ Trial expire dans {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="MRR"
              value={user.mrr > 0 ? formatCurrency(user.mrr) : '—'}
            />
            <StatCard
              label="LTV"
              value={formatCurrency(user.ltv)}
            />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Health Score</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold text-gray-900">{user.healthScore}</span>
                <div className="flex-1">
                  <HealthBar score={user.healthScore} showLabel={false} />
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Info (locked) */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-500">🔒</span>
              <h2 className="font-semibold text-gray-900">INFORMATIONS STRIPE</h2>
              <span className="text-xs text-gray-500">(synchronisees automatiquement)</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900 flex items-center gap-1">{user.email} <span className="text-gray-400">🔒</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="text-gray-900 flex items-center gap-1 capitalize">{user.plan} <span className="text-gray-400">🔒</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">MRR</span>
                <span className="text-gray-900 flex items-center gap-1">{formatCurrency(user.mrr)} <span className="text-gray-400">🔒</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="text-gray-900 flex items-center gap-1 capitalize">{user.status} <span className="text-gray-400">🔒</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inscrit le</span>
                <span className="text-gray-900 flex items-center gap-1">{formatDate(user.createdAt)} <span className="text-gray-400">🔒</span></span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
              <span>ℹ️</span>
              Ces champs sont mis a jour automatiquement depuis Stripe.
            </p>
          </Card>

          {/* Calculated Info */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-500">📊</span>
              <h2 className="font-semibold text-gray-900">INFORMATIONS CALCULEES</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Health Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <HealthBar score={user.healthScore} showLabel={false} />
                  </div>
                  <span className="text-gray-900">{user.healthScore}/100 🔒</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LTV</span>
                <span className="text-gray-900">{formatCurrency(user.ltv)} 🔒</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Derniere activite</span>
                <span className="text-gray-900">{formatDate(user.lastSeenAt)} 🔒</span>
              </div>
            </div>
          </Card>

          {/* Custom Attributes */}
          <UserAttributes
            userId={user.id}
            initialValues={sampleUserAttributes[user.id] || {}}
            onSave={(values) => console.log('Saving attributes:', values)}
          />

          {/* Entitlements */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Droits & Limites</h2>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(user.features).map(([key, enabled]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={enabled ? 'text-green-500' : 'text-gray-300'}>
                      {enabled ? '✓' : '✗'}
                    </span>
                    <span className={enabled ? 'text-gray-900' : 'text-gray-400'}>
                      {plansConfig.features[key as keyof typeof plansConfig.features]?.name || key}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Limites</h3>
              <div className="space-y-3">
                {Object.entries(user.limits).map(([key, limit]) => {
                  const percentage = (limit.current / limit.max) * 100;
                  const isNearLimit = percentage >= 80;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {plansConfig.limits[key as keyof typeof plansConfig.limits]?.name || key}
                        </span>
                        <span className={isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                          {limit.current}/{limit.max === 9999 ? '∞' : limit.max}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isNearLimit ? 'bg-orange-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Modifier les droits →
            </button>
          </Card>

          {/* Timeline */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4">
              {user.events.slice(0, 10).map((event) => (
                <div key={event.id} className="flex gap-3">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                  <div className="flex-1">
                    <p className="text-gray-900">{event.description}</p>
                    {event.metadata && (
                      <p className="text-sm text-gray-500">
                        {event.metadata.amount && `${event.metadata.amount}€`}
                        {event.metadata.feature && `Feature: ${event.metadata.feature}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(event.occurredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Coach Suggestion */}
          {coachSuggestion && (
            <Card className="bg-indigo-50 border-indigo-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-1">Coach IA</h3>
                  <p className="text-sm text-indigo-800 mb-3">{coachSuggestion.message}</p>
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    {coachSuggestion.action} →
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="space-y-3 mb-4">
              {user.notes.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune note</p>
              ) : (
                user.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddNote}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                +
              </button>
            </div>
          </Card>

          {/* Tags */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {user.tags.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun tag</p>
              ) : (
                user.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nouveau tag..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </Card>

          {/* Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Client depuis</span>
                <span className="text-gray-900">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière activité</span>
                <span className="text-gray-900">{formatDate(user.lastSeenAt)}</span>
              </div>
              {user.cardExpiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiration CB</span>
                  <span className="text-orange-600">{formatDate(user.cardExpiresAt)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
