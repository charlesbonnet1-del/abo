'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge, AgentIcon, TimeAgo } from '@/components/ui';

interface AgentAction {
  id: string;
  agent_type: string;
  action_type: string;
  description: string;
  status: string;
  created_at: string;
  executed_at: string | null;
  subscriber_id: string | null;
  subscriber?: {
    name: string | null;
    email: string | null;
  } | null;
}

function HistoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [agentFilter, setAgentFilter] = useState(searchParams.get('agent') || 'all');

  const fetchData = useCallback(async () => {
    setLoading(true);
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

    let query = supabase
      .from('agent_action')
      .select('id, agent_type, action_type, description, status, created_at, executed_at, subscriber_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (agentFilter !== 'all') {
      query = query.eq('agent_type', agentFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching actions:', error);
    } else {
      setActions(data || []);
    }

    setLoading(false);
  }, [router, statusFilter, agentFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (actionId: string, approve: boolean) => {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('agent_action')
      .update({
        status: approve ? 'approved' : 'rejected',
        approved_by: approve ? user.id : null,
        approved_at: approve ? new Date().toISOString() : null,
      })
      .eq('id', actionId);

    await fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historique des actions</h1>
        <p className="text-gray-500">Toutes les actions de vos agents IA</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending_approval">En attente</option>
            <option value="approved">Approuves</option>
            <option value="rejected">Rejetes</option>
            <option value="executed">Executes</option>
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">Tous les agents</option>
            <option value="recovery">Recovery</option>
            <option value="retention">Retention</option>
            <option value="conversion">Conversion</option>
          </select>
        </div>
      </div>

      {/* Actions list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune action</h3>
            <p className="mt-1 text-sm text-gray-500">
              Activez vos agents pour voir leurs actions ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {actions.map((action) => (
              <div key={action.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AgentIcon type={action.agent_type as 'recovery' | 'retention' | 'conversion'} size="sm" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{action.description}</span>
                        <StatusBadge status={action.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="capitalize">{action.agent_type}</span>
                        <span>•</span>
                        <TimeAgo date={action.created_at} />
                        {action.executed_at && (
                          <>
                            <span>•</span>
                            <span>Execute <TimeAgo date={action.executed_at} /></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {action.status === 'pending_approval' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(action.id, true)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleAction(action.id, false)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <HistoryPageContent />
    </Suspense>
  );
}
