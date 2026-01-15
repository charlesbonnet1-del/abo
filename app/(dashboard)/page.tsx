import Link from 'next/link';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { getDashboardMetrics } from '@/lib/metrics';
import { MetricCard, MetricsGrid } from '@/components/dashboard/metrics-cards';
import { TodoList } from '@/components/dashboard/todo-list';
import { AIInsight } from '@/components/dashboard/ai-insight';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
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

  // Check if Stripe is connected
  const isStripeConnected = !!user.stripeAccountId;

  // Get metrics
  const metrics = await getDashboardMetrics(user.id);

  // Get pending actions with subscriber info
  const pendingActions = await prisma.action.findMany({
    where: {
      subscriber: {
        userId: user.id,
      },
      status: 'PENDING',
    },
    include: {
      subscriber: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      suggestedAt: 'desc',
    },
    take: 5,
  });

  // Get top at-risk subscriber
  const topAtRiskSubscriber = await prisma.subscriber.findFirst({
    where: {
      userId: user.id,
      status: 'AT_RISK',
    },
    orderBy: {
      mrr: 'desc',
    },
    select: {
      id: true,
      name: true,
      email: true,
      mrr: true,
      healthScore: true,
    },
  });

  // If Stripe not connected, show onboarding prompt
  if (!isStripeConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue sur Abo ! 👋
          </h1>
          <p className="text-gray-500">
            Connecte ton compte Stripe pour commencer à suivre tes abonnés.
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connecte Stripe
          </h2>
          <p className="text-gray-500 mb-6">
            Synchronise automatiquement tes clients, abonnements et paiements.
          </p>
          <Link href="/settings">
            <Button size="lg">Connecter Stripe</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {user.name?.split(' ')[0] || 'là'} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Voici ce qui se passe avec tes abonnés aujourd&apos;hui
        </p>
      </div>

      {/* Metrics */}
      <div className="mb-8">
        <MetricsGrid>
          <MetricCard
            label="MRR"
            value={metrics.mrr}
            change={metrics.mrrChange}
            isCurrency
          />
          <MetricCard
            label="Abonnés"
            value={metrics.totalSubscribers}
            change={metrics.subscribersChange}
          />
          <MetricCard
            label="Churn rate"
            value={metrics.churnRate}
            isPercentage
          />
          <MetricCard label="LTV moyenne" value={metrics.avgLtv} isCurrency />
        </MetricsGrid>
      </div>

      {/* Todo List */}
      <div className="mb-8">
        <TodoList
          actions={pendingActions.map((a) => ({
            id: a.id,
            type: a.type,
            subscriberId: a.subscriberId,
            subscriber: {
              name: a.subscriber.name,
              email: a.subscriber.email,
            },
            dueAt: a.dueAt,
          }))}
        />
      </div>

      {/* AI Insight */}
      <div className="mb-8">
        <AIInsight
          atRiskCount={metrics.atRiskCount}
          topAtRiskSubscriber={topAtRiskSubscriber}
        />
      </div>

      {/* View All */}
      <Link
        href="/subscribers"
        className="block w-full text-center py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        Voir tous les abonnés →
      </Link>
    </div>
  );
}
