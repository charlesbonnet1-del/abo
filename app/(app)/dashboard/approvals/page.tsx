'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgentIcon } from '@/components/ui/AgentIcon';
import { TimeAgo } from '@/components/ui/TimeAgo';

type AgentType = 'recovery' | 'retention' | 'conversion';

interface PendingAction {
  id: string;
  user_id: string;
  agent_type: AgentType;
  action_type: string;
  subscriber_id: string | null;
  description: string | null;
  status: string;
  created_at: string;
  result: {
    email_subject?: string;
    email_body?: string;
    subscriber_email?: string;
    subscriber_name?: string;
    channel?: string;
  } | null;
  subscriber?: {
    email: string | null;
    name: string | null;
    plan_name: string | null;
    mrr: number | null;
  } | null;
}

interface PreviewModalProps {
  action: PendingAction;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}

const agentLabels: Record<AgentType, string> = {
  recovery: 'Recovery Agent',
  retention: 'Retention Agent',
  conversion: 'Conversion Agent'
};

const actionDescriptions: Record<string, string> = {
  send_reminder_email: 'Email de relance',
  send_winback_email: 'Email de reconquete',
  send_upgrade_email: 'Email d\'upgrade',
  offer_discount: 'Offre de reduction',
  offer_pause: 'Proposition de pause',
  offer_downgrade: 'Proposition de downgrade'
};

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100);
}

function getExpirationTime(createdAt: string): { text: string; urgent: boolean } {
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 48 * 60 * 60 * 1000); // 48h
  const now = new Date();
  const diffHours = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

  if (diffHours === 0) {
    return { text: 'Expire bientot', urgent: true };
  } else if (diffHours < 24) {
    return { text: `Expire dans ${diffHours}h`, urgent: true };
  } else {
    return { text: `Expire dans ${diffHours}h`, urgent: false };
  }
}

function PreviewModal({ action, onClose, onApprove, onReject, processing }: PreviewModalProps) {
  const emailSubject = action.result?.email_subject || 'Sans objet';
  const emailBody = action.result?.email_body || '';
  const subscriberEmail = action.result?.subscriber_email || action.subscriber?.email || '';
  const subscriberName = action.result?.subscriber_name || action.subscriber?.name || 'Client';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Previsualisation de l&apos;email</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {/* Email header */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-12">De:</span>
                <span className="text-gray-900">Mon Entreprise &lt;notifications@abo-mail.com&gt;</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-12">A:</span>
                <span className="text-gray-900">{subscriberName} &lt;{subscriberEmail}&gt;</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-12">Sujet:</span>
                <span className="font-medium text-gray-900">{emailSubject}</span>
              </div>
            </div>

            {/* Email body */}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: emailBody }}
            />
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button variant="secondary" onClick={onReject} disabled={processing}>
              Rejeter
            </Button>
            <Button onClick={onApprove} disabled={processing}>
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approbation...
                </span>
              ) : (
                'Approuver'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [previewAction, setPreviewAction] = useState<PendingAction | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const fetchActions = useCallback(async () => {
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

    const { data, error } = await supabase
      .from('agent_action')
      .select(`
        *,
        subscriber:subscriber_id (
          email,
          name,
          plan_name,
          mrr
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching actions:', error);
    } else {
      setActions(data || []);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleApprove = async (actionId: string) => {
    setProcessing(actionId);
    try {
      const response = await fetch(`/api/actions/${actionId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        setActions(prev => prev.filter(a => a.id !== actionId));
        setSelectedActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionId);
          return newSet;
        });
        if (previewAction?.id === actionId) {
          setPreviewAction(null);
        }
      }
    } catch (error) {
      console.error('Error approving action:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (actionId: string) => {
    setProcessing(actionId);
    try {
      const response = await fetch(`/api/actions/${actionId}/reject`, {
        method: 'POST'
      });

      if (response.ok) {
        setActions(prev => prev.filter(a => a.id !== actionId));
        setSelectedActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionId);
          return newSet;
        });
        if (previewAction?.id === actionId) {
          setPreviewAction(null);
        }
      }
    } catch (error) {
      console.error('Error rejecting action:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedActions.size === 0) return;

    setBatchProcessing(true);
    try {
      const response = await fetch('/api/actions/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIds: Array.from(selectedActions) })
      });

      if (response.ok) {
        setActions(prev => prev.filter(a => !selectedActions.has(a.id)));
        setSelectedActions(new Set());
      }
    } catch (error) {
      console.error('Error batch approving:', error);
    } finally {
      setBatchProcessing(false);
    }
  };

  const toggleSelection = (actionId: string) => {
    setSelectedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedActions.size === actions.length) {
      setSelectedActions(new Set());
    } else {
      setSelectedActions(new Set(actions.map(a => a.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Actions en attente de validation</h1>
        <p className="text-gray-500 mt-1">
          Ces actions ont ete generees par tes agents et attendent ton approbation avant d&apos;etre executees.
        </p>
      </div>

      {/* Batch actions */}
      {actions.length > 0 && (
        <Card className="mb-6">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedActions.size === actions.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  Tout selectionner ({actions.length})
                </span>
              </label>
              {selectedActions.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleBatchApprove}
                  disabled={batchProcessing}
                >
                  {batchProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Approbation...
                    </span>
                  ) : (
                    `Approuver la selection (${selectedActions.size})`
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions list */}
      {actions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tout est valide</h3>
            <p className="text-gray-500">Aucune action en attente de validation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => {
            const expiration = getExpirationTime(action.created_at);
            const isSelected = selectedActions.has(action.id);

            return (
              <Card key={action.id} className={isSelected ? 'ring-2 ring-indigo-500' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(action.id)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    {/* Agent icon */}
                    <AgentIcon type={action.agent_type} size="md" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {agentLabels[action.agent_type]}
                        </span>
                        <span className="text-sm text-gray-500">
                          <TimeAgo date={action.created_at} />
                        </span>
                      </div>

                      <p className="text-gray-900 mb-2">
                        {actionDescriptions[action.action_type] || action.action_type} a{' '}
                        <span className="font-medium">
                          {action.result?.subscriber_email || action.subscriber?.email}
                        </span>
                      </p>

                      {action.result?.email_subject && (
                        <p className="text-sm text-gray-500 mb-2">
                          Sujet : &quot;{action.result.email_subject}&quot;
                        </p>
                      )}

                      {action.subscriber && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                          {action.subscriber.name && (
                            <span>Client : {action.subscriber.name}</span>
                          )}
                          {action.subscriber.plan_name && (
                            <span>Plan : {action.subscriber.plan_name}</span>
                          )}
                          {action.subscriber.mrr && (
                            <span>MRR : {formatAmount(action.subscriber.mrr)}</span>
                          )}
                        </div>
                      )}

                      <div className={`inline-flex items-center gap-1.5 text-xs ${expiration.urgent ? 'text-amber-600' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {expiration.text}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewAction(action)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Previsualiser
                      </button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(action.id)}
                        disabled={processing === action.id}
                      >
                        {processing === action.id ? '...' : 'Approuver'}
                      </Button>
                      <button
                        onClick={() => handleReject(action.id)}
                        disabled={processing === action.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewAction && (
        <PreviewModal
          action={previewAction}
          onClose={() => setPreviewAction(null)}
          onApprove={() => handleApprove(previewAction.id)}
          onReject={() => handleReject(previewAction.id)}
          processing={processing === previewAction.id}
        />
      )}
    </div>
  );
}
