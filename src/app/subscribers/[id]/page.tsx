'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getSubscriberById,
  getStatusLabel,
  getHealthColor,
  formatCurrency,
  formatDate,
} from '@/lib/mock-data';

export default function SubscriberDetailPage() {
  const params = useParams();
  const subscriber = getSubscriberById(params.id as string);

  if (!subscriber) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-center text-gray-500">Abonné non trouvé</p>
        <Link
          href="/subscribers"
          className="block text-center mt-4 text-violet-600 hover:underline"
        >
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const statusBadgeColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    at_risk: 'bg-yellow-100 text-yellow-700',
    churned: 'bg-gray-100 text-gray-700',
    trial: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/subscribers"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>←</span>
          <span>Retour</span>
        </Link>
        <div className="relative">
          <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
            Actions ▾
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {subscriber.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusBadgeColors[subscriber.status]
                }`}
              >
                {getStatusLabel(subscriber.status)}
              </span>
            </div>
            <p className="text-gray-500">{subscriber.email}</p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
          >
            Voir dans Stripe →
          </a>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Plan</p>
          <p className="text-xl font-bold text-gray-900">{subscriber.plan}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">MRR</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(subscriber.mrr)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">LTV</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(subscriber.ltv)}
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Client depuis</p>
            <p className="font-medium text-gray-900">
              {formatDate(subscriber.since)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prochain paiement</p>
            <p className="font-medium text-gray-900">
              {formatDate(subscriber.nextPayment)}
            </p>
          </div>
          {subscriber.cardExpiry && (
            <div>
              <p className="text-sm text-gray-500">Expiration CB</p>
              <p className="font-medium text-red-600">
                ⚠️ {subscriber.cardExpiry}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Score santé</p>
            <p className={`font-medium ${getHealthColor(subscriber.health)}`}>
              {subscriber.health}/100
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {subscriber.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
          <button className="px-3 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:bg-gray-50 transition-colors">
            + Ajouter
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          <button className="text-sm text-violet-600 hover:text-violet-700">
            + Ajouter une note
          </button>
        </div>
        {subscriber.notes.length > 0 ? (
          <div className="space-y-3">
            {subscriber.notes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <p className="text-sm text-gray-500 mb-1">
                  {formatDate(note.date)}
                </p>
                <p className="text-gray-700">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucune note</p>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
        <div className="space-y-4">
          {subscriber.events.map((event) => {
            let icon = '📝';
            let bgColor = 'bg-gray-100';
            let textColor = 'text-gray-700';

            switch (event.type) {
              case 'payment':
                icon = '💳';
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
                break;
              case 'failed':
                icon = '❌';
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                break;
              case 'cancel':
                icon = '🚫';
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-700';
                break;
              case 'ai_comment':
                icon = '🤖';
                bgColor = 'bg-violet-50';
                textColor = 'text-violet-700';
                break;
              case 'subscription_start':
                icon = '🎉';
                bgColor = 'bg-blue-50';
                textColor = 'text-blue-700';
                break;
              case 'plan_change':
                icon = '📈';
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
                break;
            }

            return (
              <div key={event.id} className="flex gap-4">
                <div
                  className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                  {event.type === 'payment' && (
                    <p className={`${textColor} font-medium`}>
                      Paiement réussi : {formatCurrency(event.amount || 0)}
                    </p>
                  )}
                  {event.type === 'failed' && (
                    <p className={`${textColor} font-medium`}>
                      {event.message || `Paiement échoué : ${formatCurrency(event.amount || 0)}`}
                    </p>
                  )}
                  {event.type === 'cancel' && (
                    <p className={`${textColor} font-medium`}>{event.message}</p>
                  )}
                  {event.type === 'ai_comment' && (
                    <p className={`${textColor} italic`}>{event.message}</p>
                  )}
                  {event.type === 'subscription_start' && (
                    <p className={`${textColor} font-medium`}>{event.message}</p>
                  )}
                  {event.type === 'plan_change' && (
                    <p className={`${textColor} font-medium`}>{event.message}</p>
                  )}
                  {event.type === 'note' && (
                    <p className={`${textColor}`}>{event.message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
