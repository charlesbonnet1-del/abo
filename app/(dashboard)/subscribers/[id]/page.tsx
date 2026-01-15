import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timeline } from '@/components/subscribers/timeline';
import { NotesSection } from '@/components/subscribers/notes-section';
import { getHealthScoreColor } from '@/lib/health-score';

export default async function SubscriberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (!user) {
    return null;
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
      },
      events: {
        orderBy: { occurredAt: 'desc' },
        take: 20,
      },
      tags: true,
    },
  });

  if (!subscriber) {
    notFound();
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: Date | null) =>
    date
      ? new Date(date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const isCardExpiringSoon =
    subscriber.cardExpiresAt &&
    new Date(subscriber.cardExpiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/subscribers"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Retour</span>
        </Link>
        <Button variant="secondary">Actions</Button>
      </div>

      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {subscriber.name || 'Sans nom'}
              </h1>
              <StatusBadge status={subscriber.status} />
            </div>
            <p className="text-gray-500">{subscriber.email}</p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            Voir dans Stripe →
          </a>
        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Plan</p>
          <p className="text-xl font-bold text-gray-900">{subscriber.plan || 'N/A'}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">MRR</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(subscriber.mrr)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">LTV</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(subscriber.ltv)}
          </p>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Client depuis</p>
            <p className="font-medium text-gray-900">
              {formatDate(subscriber.firstSeenAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prochain paiement</p>
            <p className="font-medium text-gray-900">
              {formatDate(subscriber.currentPeriodEnd)}
            </p>
          </div>
          {subscriber.cardExpiresAt && (
            <div>
              <p className="text-sm text-gray-500">Expiration CB</p>
              <p
                className={`font-medium ${
                  isCardExpiringSoon ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {isCardExpiringSoon && '⚠️ '}
                {formatDate(subscriber.cardExpiresAt)}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Score santé</p>
            <p
              className={`font-medium ${getHealthScoreColor(
                subscriber.healthScore || 0
              )}`}
            >
              {subscriber.healthScore !== null ? `${subscriber.healthScore}/100` : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Tags */}
      {subscriber.tags.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {subscriber.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                style={tag.color ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      <div className="mb-6">
        <NotesSection subscriberId={subscriber.id} notes={subscriber.notes} />
      </div>

      {/* Timeline */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
        <Timeline events={subscriber.events} />
      </Card>
    </div>
  );
}
