'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge, AgentIcon, formatDate, formatDateTime } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface Subscriber {
  id: string;
  stripe_customer_id: string;
  email: string | null;
  name: string | null;
  subscription_status: string;
  mrr: number;
  plan_name: string | null;
  plan_interval: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  lifetime_value: number;
  last_payment_at: string | null;
  last_payment_status: string | null;
  created_at: string;
  country: string | null;
}

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  status: string;
  plan_name: string | null;
  plan_amount: number;
  plan_interval: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface Communication {
  id: string;
  agent_type: string;
  channel: string;
  subject: string | null;
  content: string | null;
  status: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

type TabType = 'subscriptions' | 'payments' | 'communications';

/**
 * Calcule la prochaine date de renouvellement.
 * Priorité : current_period_end > calcul depuis created_at + plan_interval
 */
function getNextRenewalDate(subscriber: Subscriber): Date | null {
  if (subscriber.current_period_end) {
    return new Date(subscriber.current_period_end);
  }

  // Fallback : calculer depuis la date de création + intervalle
  if (!subscriber.created_at || !subscriber.plan_interval) return null;
  if (subscriber.subscription_status === 'canceled') return null;

  const start = new Date(subscriber.created_at);
  const now = new Date();
  const next = new Date(start);

  // Avancer par intervalles jusqu'à dépasser aujourd'hui
  if (subscriber.plan_interval === 'month') {
    while (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  } else if (subscriber.plan_interval === 'year') {
    while (next <= now) {
      next.setFullYear(next.getFullYear() + 1);
    }
  } else {
    return null;
  }

  return next;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      router.push('/login');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch subscriber
    const { data: subscriberData, error } = await supabase
      .from('subscriber')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (error || !subscriberData) {
      router.push('/dashboard/clients');
      return;
    }

    setSubscriber(subscriberData);

    // Fetch subscriptions, invoices, and communications in parallel
    const [subscriptionsResult, invoicesResult, communicationsResult] = await Promise.all([
      supabase
        .from('subscription')
        .select('*')
        .eq('subscriber_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoice')
        .select('*')
        .eq('subscriber_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('agent_communication')
        .select('*')
        .eq('subscriber_id', clientId)
        .order('sent_at', { ascending: false }),
    ]);

    setSubscriptions(subscriptionsResult.data || []);
    setInvoices(invoicesResult.data || []);
    setCommunications(communicationsResult.data || []);
    setLoading(false);
  }, [clientId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscriber non trouvé</h2>
        <p className="text-gray-500 mb-4">Ce client n'existe pas ou vous n'y avez pas accès.</p>
        <Link href="/dashboard/clients" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Retour à la liste des clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-2xl">
              {(subscriber.name || subscriber.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{subscriber.name || 'Sans nom'}</h1>
            <p className="text-gray-500">{subscriber.email || '-'}</p>
            {subscriber.country && (
              <p className="text-sm text-gray-400">{subscriber.country}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Statut</p>
            <StatusBadge status={subscriber.subscription_status} />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">MRR</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(subscriber.mrr)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Périodicité</p>
            <p className="text-xl font-bold text-gray-900">
              {subscriber.plan_interval === 'month' ? 'Mensuel' : subscriber.plan_interval === 'year' ? 'Annuel' : '-'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Prochain renouvellement</p>
            <p className="text-xl font-bold text-gray-900">
              {(() => {
                const renewal = getNextRenewalDate(subscriber);
                return renewal ? formatDate(renewal.toISOString(), { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
              })()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Lifetime Value</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(subscriber.lifetime_value)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Client depuis</p>
            <p className="text-xl font-bold text-gray-900">{formatDate(subscriber.created_at, { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['subscriptions', 'payments', 'communications'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'subscriptions' && `Abonnements (${subscriptions.length})`}
                {tab === 'payments' && `Paiements (${invoices.length})`}
                {tab === 'communications' && `Communications (${communications.length})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun abonnement</p>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {sub.plan_name || 'Plan'} - {formatCurrency(sub.plan_amount)}/{sub.plan_interval === 'month' ? 'mois' : 'an'}
                        </h3>
                        <StatusBadge status={sub.status} size="sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Période en cours : </span>
                        <span className="text-gray-900">
                          {(() => {
                            if (sub.current_period_start && sub.current_period_end) {
                              return `${formatDate(sub.current_period_start, { day: 'numeric', month: 'short' })} → ${formatDate(sub.current_period_end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
                            }
                            // Fallback : calculer depuis created_at + plan_interval
                            if (sub.created_at && sub.plan_interval) {
                              const start = new Date(sub.created_at);
                              const now = new Date();
                              const periodStart = new Date(start);
                              if (sub.plan_interval === 'month') {
                                while (new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, periodStart.getDate()) <= now) {
                                  periodStart.setMonth(periodStart.getMonth() + 1);
                                }
                              } else if (sub.plan_interval === 'year') {
                                while (new Date(periodStart.getFullYear() + 1, periodStart.getMonth(), periodStart.getDate()) <= now) {
                                  periodStart.setFullYear(periodStart.getFullYear() + 1);
                                }
                              }
                              const periodEnd = new Date(periodStart);
                              if (sub.plan_interval === 'month') periodEnd.setMonth(periodEnd.getMonth() + 1);
                              else if (sub.plan_interval === 'year') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                              return `${formatDate(periodStart.toISOString(), { day: 'numeric', month: 'short' })} → ${formatDate(periodEnd.toISOString(), { day: 'numeric', month: 'short', year: 'numeric' })}`;
                            }
                            return 'Non disponible';
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Renouvellement auto : </span>
                        <span className="text-gray-900">{sub.cancel_at_period_end ? 'Non' : 'Oui'}</span>
                      </div>
                    </div>
                    {sub.canceled_at && (
                      <p className="text-sm text-red-500 mt-2">
                        Annule le {formatDate(sub.canceled_at)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun paiement</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(invoice.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={invoice.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div className="space-y-4">
              {communications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune communication</p>
              ) : (
                communications.map((comm) => (
                  <div key={comm.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AgentIcon type={comm.agent_type as 'recovery' | 'retention' | 'conversion' | 'onboarding'} size="sm" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 capitalize">{comm.agent_type} Agent</span>
                            <span className="text-sm text-gray-500">- {formatDateTime(comm.sent_at)}</span>
                          </div>
                          {comm.subject && (
                            <p className="text-sm text-gray-700">Sujet: {comm.subject}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge status={comm.status} size="sm" />
                            {comm.opened_at && (
                              <span className="text-xs text-green-600">Ouvert</span>
                            )}
                            {comm.clicked_at && (
                              <span className="text-xs text-green-600">Clique</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCommunication(comm)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Voir le contenu
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Communication Modal */}
      {selectedCommunication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {selectedCommunication.subject || 'Communication'}
              </h3>
              <button
                onClick={() => setSelectedCommunication(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-sm max-w-none">
                {selectedCommunication.content || <span className="text-gray-500">Aucun contenu</span>}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Envoye le {formatDateTime(selectedCommunication.sent_at)}</span>
                <div className="flex items-center gap-4">
                  {selectedCommunication.opened_at && (
                    <span>Ouvert le {formatDateTime(selectedCommunication.opened_at)}</span>
                  )}
                  {selectedCommunication.clicked_at && (
                    <span>Clique le {formatDateTime(selectedCommunication.clicked_at)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
