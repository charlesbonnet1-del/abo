'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentIcon, getAgentConfig } from '@/components/ui/AgentIcon';
import { TimeAgo, formatDateTime } from '@/components/ui/TimeAgo';

type AgentType = 'recovery' | 'retention' | 'conversion';
type ActionStatus = 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed';

interface AgentAction {
  id: string;
  user_id: string;
  agent_type: AgentType;
  action_type: string;
  subscriber_id: string | null;
  description: string | null;
  status: ActionStatus;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
  subscriber_email?: string;
  subscriber_name?: string;
}

interface ActionModalData {
  action: AgentAction;
  isOpen: boolean;
}

const actionLabels: Record<string, string> = {
  send_reminder_email: 'Email de relance envoyé',
  send_sms_reminder: 'SMS de relance envoyé',
  offer_payment_extension: 'Délai de paiement proposé',
  update_payment_method_request: 'Demande de mise à jour CB',
  send_winback_email: 'Email de reconquête envoyé',
  offer_discount: 'Réduction offerte',
  offer_pause: 'Pause proposée',
  offer_downgrade: 'Downgrade proposé',
  send_upgrade_email: 'Proposition d\'upgrade envoyée',
  offer_trial_extension: 'Prolongation d\'essai proposée',
  offer_first_month_discount: 'Réduction 1er mois offerte',
  send_feature_highlight: 'Feature mise en avant',
};

const statusLabels: Record<ActionStatus, { label: string; color: string; icon: string }> = {
  pending_approval: { label: 'En attente d\'approbation', color: 'text-amber-600 bg-amber-50', icon: '⏳' },
  approved: { label: 'Approuvé', color: 'text-blue-600 bg-blue-50', icon: '✓' },
  rejected: { label: 'Rejeté', color: 'text-red-600 bg-red-50', icon: '✕' },
  executed: { label: 'Exécuté', color: 'text-green-600 bg-green-50', icon: '✅' },
  failed: { label: 'Échoué', color: 'text-red-600 bg-red-50', icon: '❌' },
};

const periodOptions = [
  { value: 'today', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'all', label: 'Tout' },
];

function getDateFilter(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(2020, 0, 1); // Very old date for "all"
  }
}

function groupActionsByDate(actions: AgentAction[]): { label: string; actions: AgentAction[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { [key: string]: AgentAction[] } = {};

  actions.forEach(action => {
    const actionDate = new Date(action.created_at);
    actionDate.setHours(0, 0, 0, 0);

    let label: string;
    if (actionDate.getTime() === today.getTime()) {
      label = 'Aujourd\'hui';
    } else if (actionDate.getTime() === yesterday.getTime()) {
      label = 'Hier';
    } else {
      label = actionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(action);
  });

  return Object.entries(groups).map(([label, actions]) => ({ label, actions }));
}

export default function HistoryPage() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState<AgentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [modal, setModal] = useState<ActionModalData | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const dateFilter = getDateFilter(periodFilter);

      let query = supabase
        .from('agent_action')
        .select(`
          *,
          subscriber:subscriber_id (
            email,
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (agentFilter !== 'all') {
        query = query.eq('agent_type', agentFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading actions:', error);
      }

      if (data) {
        const formattedActions = data.map(action => ({
          ...action,
          subscriber_email: action.subscriber?.email,
          subscriber_name: action.subscriber?.name,
        }));
        setActions(formattedActions);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [agentFilter, statusFilter, periodFilter]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const handleApprove = async (actionId: string) => {
    setProcessing(actionId);
    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('agent_action')
        .update({
          status: 'executed',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          executed_at: new Date().toISOString(),
        })
        .eq('id', actionId);

      if (error) {
        console.error('Error approving action:', error);
      } else {
        loadActions();
        if (modal?.action.id === actionId) {
          setModal(null);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (actionId: string) => {
    setProcessing(actionId);
    try {
      const supabase = createClient();
      if (!supabase) return;

      const { error } = await supabase
        .from('agent_action')
        .update({
          status: 'rejected',
        })
        .eq('id', actionId);

      if (error) {
        console.error('Error rejecting action:', error);
      } else {
        loadActions();
        if (modal?.action.id === actionId) {
          setModal(null);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcessing(null);
    }
  };

  const groupedActions = groupActionsByDate(actions);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/demo2"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Historique des actions</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value as AgentType | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="all">Tous</option>
                <option value="recovery">Recovery</option>
                <option value="retention">Retention</option>
                <option value="conversion">Conversion</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ActionStatus | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="all">Tous</option>
                <option value="pending_approval">En attente</option>
                <option value="executed">Exécuté</option>
                <option value="rejected">Rejeté</option>
                <option value="failed">Échoué</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Période</label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      ) : actions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">Aucune action pour cette période</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedActions.map(group => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{group.label}</h3>
              <div className="space-y-3">
                {group.actions.map(action => {
                  const agentConfig = getAgentConfig(action.agent_type);
                  const status = statusLabels[action.status];

                  return (
                    <Card key={action.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <AgentIcon type={action.agent_type} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500">
                                <TimeAgo date={action.created_at} />
                              </span>
                              <span className="text-sm text-gray-400">-</span>
                              <span className={`text-sm font-medium ${agentConfig.textColor}`}>
                                {action.agent_type.charAt(0).toUpperCase() + action.agent_type.slice(1)} Agent
                              </span>
                            </div>
                            <p className="font-medium text-gray-900">
                              {actionLabels[action.action_type] || action.action_type}
                              {action.subscriber_email && (
                                <span className="font-normal text-gray-500"> à {action.subscriber_email}</span>
                              )}
                            </p>
                            {action.description && (
                              <p className="text-sm text-gray-500 mt-1 truncate">
                                &quot;{action.description}&quot;
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                {status.icon} {status.label}
                              </span>
                              {action.status !== 'pending_approval' && (
                                <button
                                  onClick={() => setModal({ action, isOpen: true })}
                                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  Voir détails
                                </button>
                              )}
                            </div>
                          </div>
                          {action.status === 'pending_approval' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(action.id)}
                                disabled={processing === action.id}
                              >
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleReject(action.id)}
                                disabled={processing === action.id}
                              >
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModal(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Détails de l&apos;action</h2>
                <button
                  onClick={() => setModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="flex items-center gap-3">
                  <AgentIcon type={modal.action.agent_type} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {modal.action.agent_type.charAt(0).toUpperCase() + modal.action.agent_type.slice(1)} Agent
                    </p>
                    <p className="text-sm text-gray-500">
                      {actionLabels[modal.action.action_type] || modal.action.action_type}
                    </p>
                  </div>
                </div>

                {modal.action.subscriber_email && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Destinataire</p>
                    <p className="text-sm text-gray-900">{modal.action.subscriber_email}</p>
                    {modal.action.subscriber_name && (
                      <p className="text-xs text-gray-500">{modal.action.subscriber_name}</p>
                    )}
                  </div>
                )}

                {modal.action.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Contenu</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                      {modal.action.description}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Statut</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusLabels[modal.action.status].color}`}>
                    {statusLabels[modal.action.status].icon} {statusLabels[modal.action.status].label}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Timeline</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span className="text-gray-600">Créé</span>
                      <span className="text-gray-400 ml-auto">{formatDateTime(modal.action.created_at)}</span>
                    </div>
                    {modal.action.approved_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600">Approuvé</span>
                        <span className="text-gray-400 ml-auto">{formatDateTime(modal.action.approved_at)}</span>
                      </div>
                    )}
                    {modal.action.executed_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Exécuté</span>
                        <span className="text-gray-400 ml-auto">{formatDateTime(modal.action.executed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {modal.action.result && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Résultat</p>
                    <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(modal.action.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <Button variant="secondary" onClick={() => setModal(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
