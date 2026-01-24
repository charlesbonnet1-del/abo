'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MetricCard, AgentIcon, TimeAgo, getAgentConfig } from '@/components/ui';
import { formatCurrency, getStartOfMonthISO } from '@/lib/utils';

interface DashboardData {
  isStripeConnected: boolean;
  stripeAccountName: string | null;
  lastSyncAt: string | null;
  totalMrr: number;
  subscriberCount: number;
  recoveredThisMonth: number;
  churnAvoidedThisMonth: number;
  conversionsThisMonth: number;
  onboardedThisMonth: number;
  pendingActions: PendingAction[];
  agentConfigs: AgentConfig[];
  agentStats: Record<string, AgentStats>;
}

interface PendingAction {
  id: string;
  agent_type: string;
  action_type: string;
  description: string;
  created_at: string;
  subscriber_id: string | null;
}

interface AgentConfig {
  agent_type: string;
  is_active: boolean;
}

interface AgentStats {
  lastAction: {
    description: string;
    created_at: string;
  } | null;
  executedThisMonth: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [togglingAgent, setTogglingAgent] = useState<string | null>(null);

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

    // Get user data
    const { data: userData } = await supabase
      .from('user')
      .select('stripe_account_id, stripe_account_name, stripe_connected, last_sync_at')
      .eq('id', user.id)
      .single();

    const isStripeConnected = userData?.stripe_connected === true;
    const startOfMonth = getStartOfMonthISO();

    if (!isStripeConnected) {
      setData({
        isStripeConnected: false,
        stripeAccountName: null,
        lastSyncAt: null,
        totalMrr: 0,
        subscriberCount: 0,
        recoveredThisMonth: 0,
        churnAvoidedThisMonth: 0,
        conversionsThisMonth: 0,
        onboardedThisMonth: 0,
        pendingActions: [],
        agentConfigs: [],
        agentStats: {},
      });
      setLoading(false);
      return;
    }

    // Fetch all data in parallel
    const [
      mrrResult,
      subscriberCountResult,
      recoveryResult,
      retentionResult,
      conversionResult,
      onboardingResult,
      pendingActionsResult,
      agentConfigsResult,
    ] = await Promise.all([
      supabase
        .from('subscriber')
        .select('mrr')
        .eq('user_id', user.id)
        .in('subscription_status', ['active', 'trialing']),
      supabase
        .from('subscriber')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('agent_action')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('agent_type', 'recovery')
        .eq('status', 'executed')
        .gte('created_at', startOfMonth),
      supabase
        .from('agent_action')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('agent_type', 'retention')
        .eq('status', 'executed')
        .gte('created_at', startOfMonth),
      supabase
        .from('agent_action')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('agent_type', 'conversion')
        .eq('status', 'executed')
        .gte('created_at', startOfMonth),
      supabase
        .from('agent_action')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('agent_type', 'onboarding')
        .eq('status', 'executed')
        .gte('created_at', startOfMonth),
      supabase
        .from('agent_action')
        .select('id, agent_type, action_type, description, created_at, subscriber_id')
        .eq('user_id', user.id)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('agent_config')
        .select('agent_type, is_active')
        .eq('user_id', user.id),
    ]);

    const totalMrr = mrrResult.data?.reduce((sum, s) => sum + (s.mrr || 0), 0) || 0;

    // Get agent stats
    const agentStats: Record<string, AgentStats> = {};
    for (const agentType of ['recovery', 'retention', 'conversion', 'onboarding']) {
      const { data: lastActionData } = await supabase
        .from('agent_action')
        .select('description, created_at')
        .eq('user_id', user.id)
        .eq('agent_type', agentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { count: executedCount } = await supabase
        .from('agent_action')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('agent_type', agentType)
        .eq('status', 'executed')
        .gte('created_at', startOfMonth);

      agentStats[agentType] = {
        lastAction: lastActionData || null,
        executedThisMonth: executedCount || 0,
      };
    }

    setData({
      isStripeConnected: true,
      stripeAccountName: userData?.stripe_account_name || userData?.stripe_account_id || null,
      lastSyncAt: userData?.last_sync_at || null,
      totalMrr,
      subscriberCount: subscriberCountResult.count || 0,
      recoveredThisMonth: recoveryResult.count || 0,
      churnAvoidedThisMonth: retentionResult.count || 0,
      conversionsThisMonth: conversionResult.count || 0,
      onboardedThisMonth: onboardingResult.count || 0,
      pendingActions: pendingActionsResult.data || [],
      agentConfigs: agentConfigsResult.data || [],
      agentStats,
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleAgent = async (agentType: string, currentActive: boolean) => {
    setTogglingAgent(agentType);
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('agent_config')
      .upsert({
        user_id: user.id,
        agent_type: agentType,
        is_active: !currentActive,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,agent_type',
      });

    await fetchData();
    setTogglingAgent(null);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!data?.isStripeConnected) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bienvenue sur Abo</h1>
        <p className="text-gray-600 mb-8">Connecte ton compte Stripe pour commencer.</p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
          Connecter Stripe
        </Link>
      </div>
    );
  }

  const getAgentIsActive = (agentType: string) => {
    return data.agentConfigs.find(c => c.agent_type === agentType)?.is_active || false;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Metrics Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="MRR" value={formatCurrency(data.totalMrr)} />
        <MetricCard label="Recupere" value={formatCurrency(data.recoveredThisMonth * 4900)} subValue="ce mois" />
        <MetricCard label="Churn evite" value={data.churnAvoidedThisMonth.toString()} subValue="ce mois" />
        <MetricCard label="Conversions" value={data.conversionsThisMonth.toString()} subValue="ce mois" />
      </div>

      {/* Pending Actions Banner */}
      {data.pendingActions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="font-semibold text-amber-800">
                {data.pendingActions.length} action{data.pendingActions.length > 1 ? 's' : ''} en attente
              </span>
            </div>
            <Link href="/dashboard/approvals" className="text-sm font-medium text-amber-700 hover:text-amber-900">
              Voir tout
            </Link>
          </div>
          <div className="space-y-2">
            {data.pendingActions.slice(0, 3).map((action) => (
              <div key={action.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AgentIcon type={action.agent_type as 'recovery' | 'retention' | 'conversion' | 'onboarding'} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{action.description}</p>
                    <TimeAgo date={action.created_at} className="text-xs" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleAction(action.id, true)} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                    Approuver
                  </button>
                  <button onClick={() => handleAction(action.id, false)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['recovery', 'retention', 'conversion', 'onboarding'] as const).map((agentType) => {
          const config = getAgentConfig(agentType);
          const isActive = getAgentIsActive(agentType);
          const stats = data.agentStats[agentType];

          const getDescription = () => {
            switch (agentType) {
              case 'recovery': return 'Recupere les paiements';
              case 'retention': return 'Reduit le churn';
              case 'conversion': return 'Convertit les prospects';
              case 'onboarding': return 'Accueille les nouveaux';
            }
          };

          const getStatsLabel = () => {
            switch (agentType) {
              case 'recovery': return 'recuperes';
              case 'retention': return 'retenus';
              case 'conversion': return 'convertis';
              case 'onboarding': return 'accueillis';
            }
          };

          return (
            <div key={agentType} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AgentIcon type={agentType} size="md" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{config.label}</h3>
                    <p className="text-xs text-gray-500">{getDescription()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-600">Statut</span>
                <button
                  onClick={() => toggleAgent(agentType, isActive)}
                  disabled={togglingAgent === agentType}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? config.color : 'bg-gray-200'} ${togglingAgent === agentType ? 'opacity-50' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Derniere action</span>
                  {stats?.lastAction ? <TimeAgo date={stats.lastAction.created_at} className="font-medium" /> : <span className="text-gray-400">Aucune</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Ce mois</span>
                  <span className="font-semibold text-gray-900">
                    {stats?.executedThisMonth || 0} {getStatsLabel()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/dashboard/agents/${agentType}/config`} className="flex-1 px-3 py-2 text-xs font-medium text-center text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100">
                  Configurer
                </Link>
                <Link href={`/dashboard/agents/${agentType}/history`} className="flex-1 px-3 py-2 text-xs font-medium text-center text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100">
                  Historique
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Apercu</h3>
          <Link href="/dashboard/clients" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Voir tous les clients
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{data.subscriberCount}</p>
            <p className="text-sm text-gray-500">Clients total</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{Math.round(data.subscriberCount * 0.7)}</p>
            <p className="text-sm text-gray-500">Actifs</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{Math.round(data.subscriberCount * 0.1)}</p>
            <p className="text-sm text-gray-500">A risque</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{Math.round(data.subscriberCount * 0.2)}</p>
            <p className="text-sm text-gray-500">Churnes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
