'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AgentIcon, getAgentConfig } from '@/components/ui/AgentIcon';

type AgentType = 'recovery' | 'retention' | 'conversion';
type ConfigTab = 'activation' | 'template' | 'strategie' | 'offres' | 'limites' | 'validation';
type StrategyTemplate = 'conservative' | 'moderate' | 'aggressive' | 'custom';
type ConfidenceLevel = 'review_all' | 'auto_with_copy' | 'full_auto';
type NotificationChannel = 'app' | 'email' | 'slack' | 'whatsapp';
type ApprovalMode = 'always' | 'auto' | 'never';

interface RecoveryStep {
  step: number;
  delay_days: number;
  tone: string;
  channel: string;
  include_offer?: boolean;
  mention_suspension?: boolean;
}

interface LimitsConfig {
  max_budget_month: number | null;
  max_actions_day: number;
  max_emails_client_week: number;
  max_offers_client_year: number;
  send_hours_start: number;
  send_hours_end: number;
  timezone: string;
  no_weekend: boolean;
}

interface OffersConfig {
  // Recovery
  discount_enabled?: boolean;
  discount_percent?: number;
  max_discount?: number;
  delay_enabled?: boolean;
  delay_days?: number;
  payment_method_change?: boolean;
  // Retention
  retention_discount_enabled?: boolean;
  retention_discount_percent?: number;
  retention_discount_months?: number;
  pause_enabled?: boolean;
  pause_max_months?: number;
  pause_price_percent?: number;
  downgrade_enabled?: boolean;
  // Conversion
  first_purchase_discount?: number;
  annual_discount?: number;
  trial_extension_enabled?: boolean;
  trial_extension_days?: number;
}

interface ActionRule {
  action_type: string;
  approval_mode: ApprovalMode;
  threshold?: number;
}

interface AgentConfigData {
  id?: string;
  user_id?: string;
  agent_type: AgentType;
  is_active: boolean;
  confidence_level: ConfidenceLevel;
  notification_channels: NotificationChannel[];
  strategy_template: StrategyTemplate;
  // Recovery specific
  recovery_sequence: RecoveryStep[];
  recovery_exclusions: { segments: string[]; min_amount: number };
  // Retention specific
  retention_triggers: string[];
  retention_approach: string;
  retention_ask_reason: boolean;
  // Conversion specific
  conversion_triggers: string[];
  trial_warning_days: number;
  freemium_conversion_days: number;
  // Offers & Limits
  offers_config: OffersConfig;
  limits_config: LimitsConfig;
  // Action rules for HITL
  action_rules: ActionRule[];
}

const defaultConfig: AgentConfigData = {
  agent_type: 'recovery',
  is_active: false,
  confidence_level: 'review_all',
  notification_channels: ['app'],
  strategy_template: 'moderate',
  recovery_sequence: [
    { step: 1, delay_days: 0, tone: 'friendly', channel: 'email' },
    { step: 2, delay_days: 1, tone: 'informative', channel: 'email' },
    { step: 3, delay_days: 3, tone: 'urgent', channel: 'email', include_offer: true },
    { step: 4, delay_days: 7, tone: 'final', channel: 'email', mention_suspension: true },
  ],
  recovery_exclusions: { segments: [], min_amount: 0 },
  retention_triggers: ['cancel_pending', 'downgrade'],
  retention_approach: 'winback',
  retention_ask_reason: true,
  conversion_triggers: ['trial_ending', 'freemium_inactive'],
  trial_warning_days: 3,
  freemium_conversion_days: 7,
  offers_config: {
    discount_enabled: true,
    discount_percent: 10,
    max_discount: 20,
    delay_enabled: true,
    delay_days: 7,
    payment_method_change: true,
    retention_discount_enabled: true,
    retention_discount_percent: 20,
    retention_discount_months: 3,
    pause_enabled: true,
    pause_max_months: 3,
    pause_price_percent: 50,
    downgrade_enabled: true,
    first_purchase_discount: 20,
    annual_discount: 30,
    trial_extension_enabled: true,
    trial_extension_days: 7,
  },
  limits_config: {
    max_budget_month: null,
    max_actions_day: 50,
    max_emails_client_week: 3,
    max_offers_client_year: 4,
    send_hours_start: 9,
    send_hours_end: 19,
    timezone: 'Europe/Paris',
    no_weekend: false,
  },
  action_rules: [],
};

const tabs: { id: ConfigTab; label: string }[] = [
  { id: 'activation', label: 'Activation' },
  { id: 'template', label: 'Template' },
  { id: 'strategie', label: 'Stratégie' },
  { id: 'offres', label: 'Offres' },
  { id: 'limites', label: 'Limites' },
  { id: 'validation', label: 'Validation' },
];

const strategyTemplates: { value: StrategyTemplate; label: string; icon: string; description: string; details: string[] }[] = [
  {
    value: 'conservative',
    label: 'Conservateur',
    icon: '🐢',
    description: 'Prudent et mesuré',
    details: [
      'Peu d\'actions, uniquement quand nécessaire',
      'Petites remises (max 10%)',
      'Validation humaine sur toutes les actions',
    ],
  },
  {
    value: 'moderate',
    label: 'Modéré',
    icon: '⚖️',
    description: 'Équilibré (recommandé)',
    details: [
      'Actions régulières et équilibrées',
      'Remises moyennes (jusqu\'à 20%)',
      'Validation sur les actions sensibles',
    ],
  },
  {
    value: 'aggressive',
    label: 'Agressif',
    icon: '🚀',
    description: 'Proactif et généreux',
    details: [
      'Actions fréquentes et proactives',
      'Remises généreuses (jusqu\'à 50%)',
      'Maximum d\'autonomie',
    ],
  },
  {
    value: 'custom',
    label: 'Personnalisé',
    icon: '⚙️',
    description: 'Configuration manuelle',
    details: ['Configure tout toi-même', 'Pour les experts'],
  },
];

const toneOptions = [
  { value: 'friendly', label: 'Amical' },
  { value: 'informative', label: 'Informatif' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'final', label: 'Dernier recours' },
];

const agentLabels: Record<AgentType, string> = {
  recovery: 'Recovery Agent',
  retention: 'Retention Agent',
  conversion: 'Conversion Agent',
};

const agentDescriptions: Record<AgentType, string> = {
  recovery: 'Configure la stratégie de récupération des paiements',
  retention: 'Configure la stratégie de rétention des clients',
  conversion: 'Configure la stratégie de conversion des prospects',
};

// Action types per agent for HITL rules
const agentActionTypes: Record<AgentType, { type: string; label: string; canAuto: boolean; warning?: string }[]> = {
  recovery: [
    { type: 'send_email', label: 'Envoyer un email', canAuto: true },
    { type: 'offer_discount', label: 'Proposer une réduction', canAuto: true },
    { type: 'apply_discount', label: 'Appliquer une réduction Stripe', canAuto: false, warning: 'Action financière' },
    { type: 'offer_delay', label: 'Proposer un délai de paiement', canAuto: true },
  ],
  retention: [
    { type: 'send_email', label: 'Envoyer un email', canAuto: true },
    { type: 'offer_discount', label: 'Proposer une réduction', canAuto: true },
    { type: 'apply_discount', label: 'Appliquer une réduction Stripe', canAuto: false, warning: 'Action financière' },
    { type: 'offer_pause', label: 'Proposer une pause', canAuto: true },
    { type: 'apply_pause', label: 'Mettre en pause l\'abonnement', canAuto: false, warning: 'Action sensible' },
    { type: 'process_refund', label: 'Effectuer un remboursement', canAuto: false, warning: 'Toujours validation requise' },
  ],
  conversion: [
    { type: 'send_email', label: 'Envoyer un email', canAuto: true },
    { type: 'offer_discount', label: 'Proposer une réduction', canAuto: true },
    { type: 'extend_trial', label: 'Prolonger le trial', canAuto: true },
    { type: 'apply_discount', label: 'Appliquer une réduction Stripe', canAuto: false, warning: 'Action financière' },
  ],
};

export default function AgentConfigPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const agentType = type as AgentType;

  const [activeTab, setActiveTab] = useState<ConfigTab>('activation');
  const [config, setConfig] = useState<AgentConfigData>({ ...defaultConfig, agent_type: agentType });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidAgent = ['recovery', 'retention', 'conversion'].includes(agentType);

  const loadConfig = useCallback(async () => {
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

      const { data: configData, error: configError } = await supabase
        .from('agent_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', agentType)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        console.error('Error loading config:', configError);
      }

      if (configData) {
        setConfig({
          ...defaultConfig,
          ...configData,
          agent_type: agentType,
          notification_channels: configData.notification_channels || ['app'],
          recovery_sequence: configData.recovery_sequence || defaultConfig.recovery_sequence,
          recovery_exclusions: configData.recovery_exclusions || defaultConfig.recovery_exclusions,
          retention_triggers: configData.retention_triggers || defaultConfig.retention_triggers,
          conversion_triggers: configData.conversion_triggers || defaultConfig.conversion_triggers,
          offers_config: { ...defaultConfig.offers_config, ...configData.offers_config },
          limits_config: { ...defaultConfig.limits_config, ...configData.limits_config },
          action_rules: configData.action_rules || [],
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [agentType]);

  useEffect(() => {
    if (isValidAgent) {
      loadConfig();
    }
  }, [isValidAgent, loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Connexion non disponible');
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Non authentifié');
        setSaving(false);
        return;
      }

      const configToSave = {
        user_id: user.id,
        agent_type: agentType,
        is_active: config.is_active,
        confidence_level: config.confidence_level,
        notification_channels: config.notification_channels,
        strategy_template: config.strategy_template,
        recovery_sequence: config.recovery_sequence,
        recovery_exclusions: config.recovery_exclusions,
        retention_triggers: config.retention_triggers,
        retention_approach: config.retention_approach,
        retention_ask_reason: config.retention_ask_reason,
        conversion_triggers: config.conversion_triggers,
        trial_warning_days: config.trial_warning_days,
        freemium_conversion_days: config.freemium_conversion_days,
        offers_config: config.offers_config,
        limits_config: config.limits_config,
        action_rules: config.action_rules,
        updated_at: new Date().toISOString(),
      };

      const { error: saveError } = await supabase
        .from('agent_config')
        .upsert(configToSave, { onConflict: 'user_id,agent_type' });

      if (saveError) {
        console.error('Error saving config:', saveError);
        setError('Erreur lors de la sauvegarde');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateOffers = <K extends keyof OffersConfig>(key: K, value: OffersConfig[K]) => {
    setConfig(prev => ({
      ...prev,
      offers_config: { ...prev.offers_config, [key]: value },
    }));
  };

  const updateLimits = <K extends keyof LimitsConfig>(key: K, value: LimitsConfig[K]) => {
    setConfig(prev => ({
      ...prev,
      limits_config: { ...prev.limits_config, [key]: value },
    }));
  };

  const updateRecoveryStep = (index: number, updates: Partial<RecoveryStep>) => {
    const newSequence = [...config.recovery_sequence];
    newSequence[index] = { ...newSequence[index], ...updates };
    updateConfig('recovery_sequence', newSequence);
  };

  const toggleNotificationChannel = (channel: NotificationChannel) => {
    const channels = config.notification_channels;
    if (channels.includes(channel)) {
      updateConfig('notification_channels', channels.filter(c => c !== channel));
    } else {
      updateConfig('notification_channels', [...channels, channel]);
    }
  };

  const getActionRule = (actionType: string): ActionRule => {
    return config.action_rules.find(r => r.action_type === actionType) || {
      action_type: actionType,
      approval_mode: 'always',
    };
  };

  const updateActionRule = (actionType: string, mode: ApprovalMode, threshold?: number) => {
    const existingRules = config.action_rules.filter(r => r.action_type !== actionType);
    updateConfig('action_rules', [...existingRules, { action_type: actionType, approval_mode: mode, threshold }]);
  };

  if (!isValidAgent) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent non trouvé</h1>
          <p className="text-gray-500 mb-6">Le type d&apos;agent &quot;{type}&quot; n&apos;existe pas.</p>
          <Button onClick={() => router.push('/dashboard')}>Retour au dashboard</Button>
        </div>
      </div>
    );
  }

  const agentVisualConfig = getAgentConfig(agentType);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <AgentIcon type={agentType} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agentLabels[agentType]}</h1>
            <p className="text-gray-500">{agentDescriptions[agentType]}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Configuration sauvegardée avec succès
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Activation Tab */}
        {activeTab === 'activation' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Activation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-medium text-gray-900">Agent actif</p>
                    <p className="text-sm text-gray-500">L&apos;agent travaille en arrière-plan quand activé</p>
                  </div>
                  <button
                    onClick={() => updateConfig('is_active', !config.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.is_active ? agentVisualConfig.color : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Notifications</h4>
                  <p className="text-sm text-gray-500 mb-4">Où veux-tu être notifié des actions ?</p>
                  <div className="space-y-3">
                    {[
                      { value: 'app' as const, label: 'Dans l\'app', available: true },
                      { value: 'email' as const, label: 'Par email', available: true },
                      { value: 'slack' as const, label: 'Slack', available: false },
                      { value: 'whatsapp' as const, label: 'WhatsApp', available: false },
                    ].map(channel => (
                      <label key={channel.value} className={`flex items-center gap-3 ${!channel.available ? 'opacity-50' : ''}`}>
                        <input
                          type="checkbox"
                          checked={config.notification_channels.includes(channel.value)}
                          onChange={() => channel.available && toggleNotificationChannel(channel.value)}
                          disabled={!channel.available}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{channel.label}</span>
                        {!channel.available && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">bientôt</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <Card>
            <CardHeader>
              <CardTitle>Template de stratégie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-6">
                Choisis un template de départ, tu pourras le personnaliser dans l&apos;onglet &quot;Stratégie&quot;
              </p>
              <div className="space-y-4">
                {strategyTemplates.map(template => (
                  <button
                    key={template.value}
                    onClick={() => updateConfig('strategy_template', template.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      config.strategy_template === template.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{template.label}</span>
                          {template.value === 'moderate' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Recommandé</span>
                          )}
                          {config.strategy_template === template.value && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Actif</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        <ul className="mt-2 space-y-1">
                          {template.details.map((detail, i) => (
                            <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stratégie Tab */}
        {activeTab === 'strategie' && (
          <>
            {agentType === 'recovery' && (
              <Card>
                <CardHeader>
                  <CardTitle>Séquence de relance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure les étapes de ta séquence de relance après un paiement échoué
                  </p>
                  <div className="space-y-4">
                    {config.recovery_sequence.map((step, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Relance {index + 1}</span>
                          {index === config.recovery_sequence.length - 1 && (
                            <span className="text-xs text-gray-400">(dernière)</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Délai après échec</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={step.delay_days}
                                onChange={(e) => updateRecoveryStep(index, { delay_days: parseInt(e.target.value) || 0 })}
                                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                              />
                              <span className="text-sm text-gray-500">jour{step.delay_days > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Ton</label>
                            <select
                              value={step.tone}
                              onChange={(e) => updateRecoveryStep(index, { tone: e.target.value })}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                              {toneOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {index >= 2 && (
                          <div className="mt-3 space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={step.include_offer || false}
                                onChange={(e) => updateRecoveryStep(index, { include_offer: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                              />
                              <span className="text-sm text-gray-600">Proposer une offre de récupération</span>
                            </label>
                            {index === config.recovery_sequence.length - 1 && (
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={step.mention_suspension || false}
                                  onChange={(e) => updateRecoveryStep(index, { mention_suspension: e.target.checked })}
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                                />
                                <span className="text-sm text-gray-600">Mentionner la suspension du compte</span>
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {agentType === 'retention' && (
              <Card>
                <CardHeader>
                  <CardTitle>Déclencheurs de rétention</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">Quand l&apos;agent doit-il intervenir ?</p>
                  <div className="space-y-3">
                    {[
                      { value: 'cancel_pending', label: 'Annulation programmée', desc: 'Client qui a demandé l\'annulation' },
                      { value: 'downgrade', label: 'Downgrade de plan', desc: 'Client qui passe à un plan inférieur' },
                      { value: 'expiring_soon', label: 'Subscription qui expire bientôt', desc: 'Sans renouvellement prévu' },
                    ].map(trigger => (
                      <label key={trigger.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.retention_triggers.includes(trigger.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateConfig('retention_triggers', [...config.retention_triggers, trigger.value]);
                            } else {
                              updateConfig('retention_triggers', config.retention_triggers.filter(t => t !== trigger.value));
                            }
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{trigger.label}</span>
                          <p className="text-xs text-gray-500">{trigger.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Approche</h4>
                    <div className="space-y-2">
                      {[
                        { value: 'empathetic', label: 'Empathique', desc: '"On comprend, comment peut-on t\'aider ?"' },
                        { value: 'winback', label: 'Win-back', desc: '"Tu vas nous manquer, voici ce qu\'on propose"' },
                        { value: 'direct', label: 'Direct', desc: '"Avant de partir, considère ces options"' },
                      ].map(approach => (
                        <label key={approach.value} className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={config.retention_approach === approach.value}
                            onChange={() => updateConfig('retention_approach', approach.value)}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{approach.label}</span>
                            <span className="text-xs text-gray-500 ml-2">{approach.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {agentType === 'conversion' && (
              <Card>
                <CardHeader>
                  <CardTitle>Déclencheurs de conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={config.conversion_triggers.includes('trial_ending')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateConfig('conversion_triggers', [...config.conversion_triggers, 'trial_ending']);
                          } else {
                            updateConfig('conversion_triggers', config.conversion_triggers.filter(t => t !== 'trial_ending'));
                          }
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Fin de période d&apos;essai</span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Intervenir</span>
                          <input
                            type="number"
                            min="1"
                            max="14"
                            value={config.trial_warning_days}
                            onChange={(e) => updateConfig('trial_warning_days', parseInt(e.target.value) || 3)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                          />
                          <span className="text-xs text-gray-500">jours avant la fin</span>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={config.conversion_triggers.includes('freemium_inactive')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateConfig('conversion_triggers', [...config.conversion_triggers, 'freemium_inactive']);
                          } else {
                            updateConfig('conversion_triggers', config.conversion_triggers.filter(t => t !== 'freemium_inactive'));
                          }
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Utilisateurs freemium</span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Intervenir après</span>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={config.freemium_conversion_days}
                            onChange={(e) => updateConfig('freemium_conversion_days', parseInt(e.target.value) || 7)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                          />
                          <span className="text-xs text-gray-500">jours sans conversion</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Offres Tab */}
        {activeTab === 'offres' && (
          <Card>
            <CardHeader>
              <CardTitle>Offres {agentType === 'recovery' ? 'de récupération' : agentType === 'retention' ? 'de rétention' : 'de conversion'}</CardTitle>
            </CardHeader>
            <CardContent>
              {agentType === 'recovery' && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={config.offers_config.discount_enabled}
                        onChange={(e) => updateOffers('discount_enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-gray-900">Proposer une remise si paiement rapide</span>
                    </label>
                    {config.offers_config.discount_enabled && (
                      <div className="ml-7 p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Remise de</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={config.offers_config.discount_percent || 10}
                            onChange={(e) => updateOffers('discount_percent', parseInt(e.target.value) || 10)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Maximum absolu :</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={config.offers_config.max_discount || 20}
                            onChange={(e) => updateOffers('max_discount', parseInt(e.target.value) || 20)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={config.offers_config.delay_enabled}
                        onChange={(e) => updateOffers('delay_enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-gray-900">Proposer un délai de paiement</span>
                    </label>
                    {config.offers_config.delay_enabled && (
                      <div className="ml-7 flex items-center gap-3">
                        <span className="text-sm text-gray-600">Délai maximum :</span>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={config.offers_config.delay_days || 7}
                          onChange={(e) => updateOffers('delay_days', parseInt(e.target.value) || 7)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                        <span className="text-sm text-gray-600">jours supplémentaires</span>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.offers_config.payment_method_change}
                      onChange={(e) => updateOffers('payment_method_change', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-900">Proposer de changer de moyen de paiement</span>
                  </label>
                </div>
              )}

              {agentType === 'retention' && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={config.offers_config.retention_discount_enabled}
                        onChange={(e) => updateOffers('retention_discount_enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-gray-900">Proposer une réduction temporaire</span>
                    </label>
                    {config.offers_config.retention_discount_enabled && (
                      <div className="ml-7 p-4 bg-gray-50 rounded-lg flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-gray-600">Réduction de</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={config.offers_config.retention_discount_percent || 20}
                          onChange={(e) => updateOffers('retention_discount_percent', parseInt(e.target.value) || 20)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                        <span className="text-sm text-gray-600">% pendant</span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={config.offers_config.retention_discount_months || 3}
                          onChange={(e) => updateOffers('retention_discount_months', parseInt(e.target.value) || 3)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                        <span className="text-sm text-gray-600">mois</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={config.offers_config.pause_enabled}
                        onChange={(e) => updateOffers('pause_enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-gray-900">Proposer une pause d&apos;abonnement</span>
                    </label>
                    {config.offers_config.pause_enabled && (
                      <div className="ml-7 p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Durée maximum :</span>
                          <input
                            type="number"
                            min="1"
                            max="6"
                            value={config.offers_config.pause_max_months || 3}
                            onChange={(e) => updateOffers('pause_max_months', parseInt(e.target.value) || 3)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                          />
                          <span className="text-sm text-gray-600">mois</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Pause à prix réduit :</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={config.offers_config.pause_price_percent || 50}
                            onChange={(e) => updateOffers('pause_price_percent', parseInt(e.target.value) || 50)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                          />
                          <span className="text-sm text-gray-600">% du prix normal</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.offers_config.downgrade_enabled}
                      onChange={(e) => updateOffers('downgrade_enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-900">Proposer un downgrade vers un plan inférieur</span>
                  </label>
                </div>
              )}

              {agentType === 'conversion' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Réduction premier achat</h4>
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Réduction mensuelle :</span>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={config.offers_config.first_purchase_discount || 20}
                          onChange={(e) => updateOffers('first_purchase_discount', parseInt(e.target.value) || 20)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Réduction annuelle :</span>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={config.offers_config.annual_discount || 30}
                          onChange={(e) => updateOffers('annual_discount', parseInt(e.target.value) || 30)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={config.offers_config.trial_extension_enabled}
                        onChange={(e) => updateOffers('trial_extension_enabled', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-gray-900">Proposer une extension de trial</span>
                    </label>
                    {config.offers_config.trial_extension_enabled && (
                      <div className="ml-7 flex items-center gap-3">
                        <span className="text-sm text-gray-600">Durée :</span>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={config.offers_config.trial_extension_days || 7}
                          onChange={(e) => updateOffers('trial_extension_days', parseInt(e.target.value) || 7)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        />
                        <span className="text-sm text-gray-600">jours supplémentaires</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Limites Tab */}
        {activeTab === 'limites' && (
          <Card>
            <CardHeader>
              <CardTitle>Limites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Limites globales</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-48">Budget max de remises/mois :</span>
                      <input
                        type="number"
                        min="0"
                        value={config.limits_config.max_budget_month || ''}
                        onChange={(e) => updateLimits('max_budget_month', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Illimité"
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                      />
                      <span className="text-sm text-gray-500">€</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-48">Actions max par jour :</span>
                      <input
                        type="number"
                        min="1"
                        value={config.limits_config.max_actions_day}
                        onChange={(e) => updateLimits('max_actions_day', parseInt(e.target.value) || 50)}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Limites par client</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-48">Max emails par semaine :</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.limits_config.max_emails_client_week}
                        onChange={(e) => updateLimits('max_emails_client_week', parseInt(e.target.value) || 3)}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-48">Max offres par an :</span>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={config.limits_config.max_offers_client_year}
                        onChange={(e) => updateLimits('max_offers_client_year', parseInt(e.target.value) || 4)}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Heures d&apos;envoi</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">Envoyer uniquement entre</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={config.limits_config.send_hours_start}
                        onChange={(e) => updateLimits('send_hours_start', parseInt(e.target.value) || 9)}
                        className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                      />
                      <span className="text-sm text-gray-600">h et</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={config.limits_config.send_hours_end}
                        onChange={(e) => updateLimits('send_hours_end', parseInt(e.target.value) || 19)}
                        className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                      />
                      <span className="text-sm text-gray-600">h</span>
                    </div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.limits_config.no_weekend}
                        onChange={(e) => updateLimits('no_weekend', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-600">Ne pas envoyer le week-end</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Tab (HITL) */}
        {activeTab === 'validation' && (
          <Card>
            <CardHeader>
              <CardTitle>Validation humaine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Niveau de confiance global</h4>
                  <div className="space-y-3">
                    {[
                      { value: 'review_all' as const, label: 'Je valide tout', desc: 'Chaque action nécessite ton approbation' },
                      { value: 'auto_with_copy' as const, label: 'Auto avec copie', desc: 'L\'agent agit, tu reçois une copie de chaque action' },
                      { value: 'full_auto' as const, label: 'Full auto', desc: 'L\'agent agit en totale autonomie' },
                    ].map(level => (
                      <button
                        key={level.value}
                        onClick={() => updateConfig('confidence_level', level.value)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          config.confidence_level === level.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            config.confidence_level === level.value ? 'border-indigo-500' : 'border-gray-300'
                          }`}>
                            {config.confidence_level === level.value && (
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${config.confidence_level === level.value ? 'text-indigo-700' : 'text-gray-900'}`}>
                              {level.label}
                            </p>
                            <p className="text-sm text-gray-500">{level.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Règles par type d&apos;action</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Même en mode &quot;Full auto&quot;, certaines actions peuvent nécessiter une validation
                  </p>
                  <div className="space-y-3">
                    {agentActionTypes[agentType].map(action => {
                      const rule = getActionRule(action.type);
                      return (
                        <div key={action.type} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{action.label}</span>
                            {action.warning && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {action.warning}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {action.canAuto && (
                              <button
                                onClick={() => updateActionRule(action.type, 'auto')}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                  rule.approval_mode === 'auto'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                Auto
                              </button>
                            )}
                            <button
                              onClick={() => updateActionRule(action.type, 'always')}
                              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                rule.approval_mode === 'always' || !action.canAuto
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              Validation requise
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation & Save */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <Link
            href={`/dashboard/agents/${agentType}/history`}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Voir l&apos;historique de cet agent
          </Link>
          <Button onClick={handleSave} disabled={saving} className="min-w-[150px]">
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sauvegarde...
              </span>
            ) : (
              'Sauvegarder'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
