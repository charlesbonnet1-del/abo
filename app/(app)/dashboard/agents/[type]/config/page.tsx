'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AgentIcon, getAgentConfig } from '@/components/ui/AgentIcon';

type AgentType = 'recovery' | 'retention' | 'conversion';
type ConfidenceLevel = 'review_all' | 'auto_with_copy' | 'full_auto';
type NotificationChannel = 'app' | 'email' | 'slack' | 'whatsapp';
type ApprovalMode = 'always' | 'auto' | 'never';

interface AgentConfigData {
  id?: string;
  user_id?: string;
  agent_type: AgentType;
  is_active: boolean;
  confidence_level: ConfidenceLevel;
  notification_channels: NotificationChannel[];
  // Recovery-specific settings
  recovery_delays?: number[];
  // Conversion-specific settings
  trial_warning_days?: number;
  freemium_conversion_days?: number;
  // Retention-specific settings
  churn_risk_threshold?: number;
}

interface ActionRule {
  id?: string;
  agent_config_id?: string;
  action_type: string;
  requires_approval: boolean;
  max_auto_amount: number | null;
  approval_mode?: ApprovalMode;
}

// Agent-specific action rules
const agentActionTypes: Record<AgentType, { type: string; label: string; hasAmount?: boolean; amountUnit?: string; warning?: string }[]> = {
  recovery: [
    { type: 'send_reminder_email', label: 'Envoyer un email de relance' },
    { type: 'send_sms_reminder', label: 'Envoyer un SMS' },
    { type: 'offer_payment_extension', label: 'Proposer un delai de paiement' },
    { type: 'update_payment_method_request', label: 'Demander mise a jour CB' },
  ],
  retention: [
    { type: 'send_winback_email', label: 'Envoyer un email de reconquete' },
    { type: 'offer_discount', label: 'Offrir une reduction', hasAmount: true, amountUnit: '%' },
    { type: 'offer_pause', label: 'Proposer une pause d\'abonnement' },
    { type: 'offer_downgrade', label: 'Proposer un downgrade de plan' },
  ],
  conversion: [
    { type: 'send_upgrade_email', label: 'Envoyer une proposition d\'upgrade' },
    { type: 'offer_trial_extension', label: 'Prolonger la periode d\'essai' },
    { type: 'offer_first_month_discount', label: 'Offrir une reduction 1er mois', hasAmount: true, amountUnit: '%' },
    { type: 'send_feature_highlight', label: 'Mettre en avant une feature' },
  ],
};

const agentLabels: Record<AgentType, string> = {
  recovery: 'Recovery Agent',
  retention: 'Retention Agent',
  conversion: 'Conversion Agent',
};

const agentDescriptions: Record<AgentType, string> = {
  recovery: 'Recupere les paiements echoues et relance les clients',
  retention: 'Retient les clients sur le point de partir',
  conversion: 'Convertit les essais en abonnements payants',
};

const confidenceLevels: { value: ConfidenceLevel; label: string; description: string }[] = [
  { value: 'review_all', label: 'Je valide tout', description: 'Chaque action necessite ton approbation' },
  { value: 'auto_with_copy', label: 'Auto avec copie', description: 'L\'agent agit, tu recois une copie de chaque action' },
  { value: 'full_auto', label: 'Full auto', description: 'L\'agent agit en totale autonomie' },
];

const notificationChannels: { value: NotificationChannel; label: string; available: boolean }[] = [
  { value: 'app', label: 'Dans l\'app', available: true },
  { value: 'email', label: 'Par email', available: true },
  { value: 'slack', label: 'Slack', available: false },
  { value: 'whatsapp', label: 'WhatsApp', available: false },
];

export default function AgentConfigPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const router = useRouter();
  const agentType = type as AgentType;

  const [config, setConfig] = useState<AgentConfigData>({
    agent_type: agentType,
    is_active: false,
    confidence_level: 'review_all',
    notification_channels: ['app'],
    // Recovery defaults
    recovery_delays: [0, 1, 3, 7],
    // Conversion defaults
    trial_warning_days: 3,
    freemium_conversion_days: 7,
    // Retention defaults
    churn_risk_threshold: 70,
  });

  const [rules, setRules] = useState<ActionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate agent type
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

      // Load agent config
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
          ...configData,
          notification_channels: configData.notification_channels || ['app'],
          recovery_delays: configData.recovery_delays || [0, 1, 3, 7],
          trial_warning_days: configData.trial_warning_days || 3,
          freemium_conversion_days: configData.freemium_conversion_days || 7,
          churn_risk_threshold: configData.churn_risk_threshold || 70,
        });

        // Load action rules
        const { data: rulesData, error: rulesError } = await supabase
          .from('agent_action_rules')
          .select('*')
          .eq('agent_config_id', configData.id);

        if (rulesError) {
          console.error('Error loading rules:', rulesError);
        }

        if (rulesData) {
          // Convert DB format to UI format
          const formattedRules = rulesData.map(rule => ({
            ...rule,
            approval_mode: getApprovalMode(rule),
          }));
          setRules(formattedRules);
        }
      }

      // Initialize default rules if none exist
      if (!configData || rules.length === 0) {
        initializeDefaultRules();
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentType]);

  useEffect(() => {
    if (isValidAgent) {
      loadConfig();
    }
  }, [isValidAgent, loadConfig]);

  const getApprovalMode = (rule: { requires_approval: boolean; max_auto_amount: number | null }): ApprovalMode => {
    if (rule.requires_approval && rule.max_auto_amount === null) return 'always';
    if (!rule.requires_approval) return 'never';
    return 'auto';
  };

  const initializeDefaultRules = () => {
    const defaultRules = agentActionTypes[agentType].map(action => ({
      action_type: action.type,
      requires_approval: true,
      max_auto_amount: null,
      approval_mode: 'always' as ApprovalMode,
    }));
    setRules(defaultRules);
  };

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
        setError('Non authentifie');
        setSaving(false);
        return;
      }

      // Upsert agent config
      const configToSave = {
        user_id: user.id,
        agent_type: agentType,
        is_active: config.is_active,
        confidence_level: config.confidence_level,
        notification_channels: config.notification_channels,
        // Agent-specific settings
        recovery_delays: config.recovery_delays,
        trial_warning_days: config.trial_warning_days,
        freemium_conversion_days: config.freemium_conversion_days,
        churn_risk_threshold: config.churn_risk_threshold,
        updated_at: new Date().toISOString(),
      };

      const { data: savedConfig, error: configError } = await supabase
        .from('agent_config')
        .upsert(configToSave, { onConflict: 'user_id,agent_type' })
        .select()
        .single();

      if (configError) {
        console.error('Error saving config:', configError);
        setError('Erreur lors de la sauvegarde de la configuration');
        setSaving(false);
        return;
      }

      // Delete existing rules and insert new ones
      await supabase
        .from('agent_action_rules')
        .delete()
        .eq('agent_config_id', savedConfig.id);

      // Insert new rules
      const rulesToSave = rules.map(rule => ({
        agent_config_id: savedConfig.id,
        action_type: rule.action_type,
        requires_approval: rule.approval_mode === 'always' || rule.approval_mode === 'auto',
        max_auto_amount: rule.approval_mode === 'auto' ? rule.max_auto_amount : null,
      }));

      const { error: rulesError } = await supabase
        .from('agent_action_rules')
        .insert(rulesToSave);

      if (rulesError) {
        console.error('Error saving rules:', rulesError);
        setError('Erreur lors de la sauvegarde des regles');
      } else {
        setSaveSuccess(true);
        setConfig(prev => ({ ...prev, id: savedConfig.id }));
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

  const toggleNotificationChannel = (channel: NotificationChannel) => {
    setConfig(prev => {
      const channels = prev.notification_channels;
      if (channels.includes(channel)) {
        return { ...prev, notification_channels: channels.filter(c => c !== channel) };
      } else {
        return { ...prev, notification_channels: [...channels, channel] };
      }
    });
  };

  const updateRule = (actionType: string, updates: Partial<ActionRule>) => {
    setRules(prev => prev.map(rule =>
      rule.action_type === actionType ? { ...rule, ...updates } : rule
    ));
  };

  if (!isValidAgent) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent non trouve</h1>
          <p className="text-gray-500 mb-6">Le type d&apos;agent &quot;{type}&quot; n&apos;existe pas.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  const agentVisualConfig = getAgentConfig(agentType);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
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
        <div className="flex items-center gap-3">
          <AgentIcon type={agentType} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agentLabels[agentType]}</h1>
            <p className="text-gray-500">{agentDescriptions[agentType]}</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Success message */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Configuration sauvegardee avec succes
        </div>
      )}

      <div className="space-y-6">
        {/* Activation */}
        <Card>
          <CardHeader>
            <CardTitle>Activation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Agent actif</p>
                <p className="text-sm text-gray-500">L&apos;agent travaille en arriere-plan quand active</p>
              </div>
              <button
                onClick={() => updateConfig('is_active', !config.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.is_active ? agentVisualConfig.color : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Agent-specific settings */}
        {agentType === 'recovery' && (
          <Card>
            <CardHeader>
              <CardTitle>Sequence de relance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Configure les delais entre chaque email de relance apres un paiement echoue
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(config.recovery_delays || [0, 1, 3, 7]).map((delay, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Email {index + 1}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={delay}
                        onChange={(e) => {
                          const newDelays = [...(config.recovery_delays || [0, 1, 3, 7])];
                          newDelays[index] = parseInt(e.target.value) || 0;
                          updateConfig('recovery_delays', newDelays);
                        }}
                        className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                      <span className="text-sm text-gray-500">jour{delay > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                0 = immediat, 1 = 1 jour apres l&apos;echec, etc.
              </p>
            </CardContent>
          </Card>
        )}

        {agentType === 'conversion' && (
          <Card>
            <CardHeader>
              <CardTitle>Parametres de conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alerte fin de periode d&apos;essai
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={config.trial_warning_days || 3}
                    onChange={(e) => updateConfig('trial_warning_days', parseInt(e.target.value) || 3)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-sm text-gray-500">jours avant expiration du trial</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  L&apos;agent enverra un email X jours avant la fin de la periode d&apos;essai
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relance utilisateurs freemium
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.freemium_conversion_days || 7}
                    onChange={(e) => updateConfig('freemium_conversion_days', parseInt(e.target.value) || 7)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-sm text-gray-500">jours apres inscription</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Envoyer une proposition d&apos;upgrade aux utilisateurs freemium apres X jours
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {agentType === 'retention' && (
          <Card>
            <CardHeader>
              <CardTitle>Parametres de retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil de risque de churn
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.churn_risk_threshold || 70}
                    onChange={(e) => updateConfig('churn_risk_threshold', parseInt(e.target.value) || 70)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-sm text-gray-500">% de probabilite</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  L&apos;agent interviendra quand le risque de churn depasse ce seuil
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Niveau de confiance */}
        <Card>
          <CardHeader>
            <CardTitle>Niveau de confiance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confidenceLevels.map((level) => (
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
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        config.confidence_level === level.value
                          ? 'border-indigo-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {config.confidence_level === level.value && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        config.confidence_level === level.value ? 'text-indigo-700' : 'text-gray-900'
                      }`}>
                        {level.label}
                      </p>
                      <p className="text-sm text-gray-500">{level.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Ou veux-tu etre notifie des actions ?</p>
            <div className="space-y-3">
              {notificationChannels.map((channel) => (
                <label
                  key={channel.value}
                  className={`flex items-center gap-3 ${!channel.available ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={config.notification_channels.includes(channel.value)}
                    onChange={() => channel.available && toggleNotificationChannel(channel.value)}
                    disabled={!channel.available}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{channel.label}</span>
                  {!channel.available && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">bientot</span>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regles d'approbation */}
        <Card>
          <CardHeader>
            <CardTitle>Regles d&apos;approbation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Configure quelles actions necessitent ton approbation</p>
            <div className="space-y-4">
              {agentActionTypes[agentType].map((action) => {
                const rule = rules.find(r => r.action_type === action.type) || {
                  action_type: action.type,
                  requires_approval: true,
                  max_auto_amount: null,
                  approval_mode: 'always' as ApprovalMode,
                };

                return (
                  <div key={action.type} className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-900 mb-3">{action.label}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateRule(action.type, { approval_mode: 'always', requires_approval: true, max_auto_amount: null })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          rule.approval_mode === 'always'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Toujours demander
                      </button>
                      {action.hasAmount ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateRule(action.type, { approval_mode: 'auto', requires_approval: true, max_auto_amount: rule.max_auto_amount || 10 })}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              rule.approval_mode === 'auto'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            Auto jusqu&apos;a
                          </button>
                          {rule.approval_mode === 'auto' && (
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={rule.max_auto_amount || 10}
                                onChange={(e) => updateRule(action.type, { max_auto_amount: parseInt(e.target.value) || 0 })}
                                className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center"
                                min="0"
                                max="100"
                              />
                              <span className="ml-1 text-sm text-gray-500">{action.amountUnit}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => updateRule(action.type, { approval_mode: 'auto', requires_approval: false, max_auto_amount: null })}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            rule.approval_mode === 'auto'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          Auto
                        </button>
                      )}
                      <button
                        onClick={() => updateRule(action.type, { approval_mode: 'never', requires_approval: false, max_auto_amount: null })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          rule.approval_mode === 'never'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Jamais
                      </button>
                    </div>
                    {action.warning && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {action.warning}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation links */}
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
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[150px]"
          >
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
