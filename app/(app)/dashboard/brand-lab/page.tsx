'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TagInput } from '@/components/ui/TagInput';
import { ToneSlider } from '@/components/ui/ToneSlider';
import { TextAreaList } from '@/components/ui/TextAreaList';
import { HumorSelector } from '@/components/ui/HumorSelector';
import { ProductsTab } from '@/components/brand-lab/ProductsTab';
import { PlansTab } from '@/components/brand-lab/PlansTab';

// Types
type Tab = 'entreprise' | 'produits' | 'plans' | 'objectifs' | 'voix' | 'segments';
type ProductType = 'saas' | 'mobile_app' | 'ecommerce' | 'service' | 'marketplace' | 'media' | 'other';
type TargetAudience = 'freelance' | 'startup' | 'pme' | 'enterprise' | 'b2c' | 'mixed';
type SegmentStrategy = 'conservative' | 'moderate' | 'aggressive';

interface Feature {
  id: string;
  name: string;
  description: string;
  value_prop: string;
  paid_only: boolean;
}

interface Objective {
  id: string;
  type: 'use_feature' | 'invite_collaborators' | 'connect_integration' | 'usage_level' | 'upgrade' | 'annual' | 'custom';
  config: Record<string, string | number>;
  custom_description?: string;
}

interface Segment {
  id: string;
  name: string;
  conditions: string;
  strategy: SegmentStrategy;
}

interface BrandSettings {
  id?: string;
  user_id?: string;
  // Mon entreprise
  company_name: string;
  product_type: ProductType;
  product_description: string;
  industry: string;
  target_audience: TargetAudience;
  // Mon produit
  features: Feature[];
  aha_moment_known: boolean;
  aha_moment_description: string;
  plans_metadata: Record<string, { description: string; segment: string }>;
  // Mes objectifs
  objectives: Objective[];
  // Ma voix
  language: string;
  tone: 'formal' | 'neutral' | 'casual' | 'friendly';
  humor: 'none' | 'subtle' | 'yes';
  values: string[];
  never_say: string[];
  always_mention: string[];
  example_emails: string[];
  signature: string;
  // Segments
  segmentation_enabled: boolean;
  segments: Segment[];
  segment_by_ltv: {
    bronze: { max: number };
    silver: { min: number; max: number };
    gold: { min: number };
  };
  segment_by_plan: Record<string, string>;
}

const defaultSettings: BrandSettings = {
  company_name: '',
  product_type: 'saas',
  product_description: '',
  industry: '',
  target_audience: 'pme',
  features: [],
  aha_moment_known: false,
  aha_moment_description: '',
  plans_metadata: {},
  objectives: [],
  language: 'fr',
  tone: 'neutral',
  humor: 'subtle',
  values: [],
  never_say: [],
  always_mention: [],
  example_emails: [],
  signature: 'Cordialement,\nL\'équipe {company_name}',
  segmentation_enabled: false,
  segments: [],
  segment_by_ltv: {
    bronze: { max: 500 },
    silver: { min: 500, max: 2000 },
    gold: { min: 2000 },
  },
  segment_by_plan: {},
};

const tabs: { id: Tab; label: string }[] = [
  { id: 'entreprise', label: 'Mon entreprise' },
  { id: 'produits', label: 'Produits' },
  { id: 'plans', label: 'Plans' },
  { id: 'objectifs', label: 'Mes objectifs' },
  { id: 'voix', label: 'Ma voix' },
  { id: 'segments', label: 'Segments' },
];

const productTypes: { value: ProductType; label: string }[] = [
  { value: 'saas', label: 'SaaS (logiciel en ligne)' },
  { value: 'mobile_app', label: 'Application mobile' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'service', label: 'Service / Agence' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'media', label: 'Média / Contenu' },
  { value: 'other', label: 'Autre' },
];

const targetAudiences: { value: TargetAudience; label: string }[] = [
  { value: 'freelance', label: 'Freelances / Solopreneurs' },
  { value: 'startup', label: 'Startups' },
  { value: 'pme', label: 'PME' },
  { value: 'enterprise', label: 'Grandes entreprises' },
  { value: 'b2c', label: 'Particuliers (B2C)' },
  { value: 'mixed', label: 'Mixte' },
];

const industries = [
  'Marketing & Communication',
  'Tech & Logiciel',
  'E-commerce & Retail',
  'Finance & Assurance',
  'Santé & Bien-être',
  'Education & Formation',
  'Immobilier',
  'Média & Divertissement',
  'Industrie & Manufacturing',
  'Services professionnels',
  'Autre',
];

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];

export default function BrandLabPage() {
  const [activeTab, setActiveTab] = useState<Tab>('entreprise');
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
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

      const { data, error: fetchError } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error loading settings:', fetchError);
        setError('Erreur lors du chargement des paramètres');
      }

      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          features: data.features || [],
          objectives: data.objectives || [],
          values: data.values || [],
          never_say: data.never_say || [],
          always_mention: data.always_mention || [],
          example_emails: data.example_emails || [],
          segments: data.segments || [],
          segment_by_ltv: data.segment_by_ltv || defaultSettings.segment_by_ltv,
          segment_by_plan: data.segment_by_plan || {},
          plans_metadata: data.plans_metadata || {},
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

      // Explicitly list columns to avoid sending extra fields (id, created_at)
      const settingsToSave = {
        user_id: user.id,
        company_name: settings.company_name,
        product_type: settings.product_type,
        product_description: settings.product_description,
        industry: settings.industry,
        target_audience: settings.target_audience,
        features: settings.features,
        aha_moment_known: settings.aha_moment_known,
        aha_moment_description: settings.aha_moment_description,
        plans_metadata: settings.plans_metadata,
        objectives: settings.objectives,
        language: settings.language,
        tone: settings.tone,
        humor: settings.humor,
        values: settings.values,
        never_say: settings.never_say,
        always_mention: settings.always_mention,
        example_emails: settings.example_emails,
        signature: settings.signature,
        segmentation_enabled: settings.segmentation_enabled,
        segments: settings.segments,
        segment_by_ltv: settings.segment_by_ltv,
        segment_by_plan: settings.segment_by_plan,
        updated_at: new Date().toISOString(),
      };

      const { error: saveError } = await supabase
        .from('brand_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' });

      if (saveError) {
        console.error('Error saving settings:', saveError);
        setError(`Erreur lors de la sauvegarde : ${saveError.message || saveError.code || 'erreur inconnue'}`);
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

  const updateSettings = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Objective management
  const addObjective = (type: Objective['type']) => {
    const newObjective: Objective = {
      id: crypto.randomUUID(),
      type,
      config: {},
    };
    updateSettings('objectives', [...settings.objectives, newObjective]);
  };

  const updateObjective = (id: string, updates: Partial<Objective>) => {
    updateSettings('objectives', settings.objectives.map(o =>
      o.id === id ? { ...o, ...updates } : o
    ));
  };

  const removeObjective = (id: string) => {
    updateSettings('objectives', settings.objectives.filter(o => o.id !== id));
  };

  const toggleObjective = (type: Objective['type']) => {
    const existing = settings.objectives.find(o => o.type === type);
    if (existing) {
      removeObjective(existing.id);
    } else {
      addObjective(type);
    }
  };

  // Segment management
  const addSegment = () => {
    const newSegment: Segment = {
      id: crypto.randomUUID(),
      name: '',
      conditions: '',
      strategy: 'moderate',
    };
    updateSettings('segments', [...settings.segments, newSegment]);
  };

  const updateSegment = (id: string, updates: Partial<Segment>) => {
    updateSettings('segments', settings.segments.map(s =>
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const removeSegment = (id: string) => {
    updateSettings('segments', settings.segments.filter(s => s.id !== id));
  };

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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Lab</h1>
            <p className="text-gray-500">Plus tu donnes de contexte, plus tes agents seront performants</p>
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
          Paramètres sauvegardés avec succès
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Mon entreprise */}
        {activeTab === 'entreprise' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l&apos;entreprise
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => updateSettings('company_name', e.target.value)}
                    placeholder="Mon Entreprise"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de produit
                  </label>
                  <select
                    value={settings.product_type}
                    onChange={(e) => updateSettings('product_type', e.target.value as ProductType)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description de ton activité
                  </label>
                  <textarea
                    value={settings.product_description}
                    onChange={(e) => updateSettings('product_description', e.target.value)}
                    placeholder="Ex: Nous proposons un outil de gestion de projet pour les équipes marketing..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur / Industrie
                  </label>
                  <select
                    value={settings.industry}
                    onChange={(e) => updateSettings('industry', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">Sélectionne un secteur</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cible principale
                  </label>
                  <select
                    value={settings.target_audience}
                    onChange={(e) => updateSettings('target_audience', e.target.value as TargetAudience)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    {targetAudiences.map(audience => (
                      <option key={audience.value} value={audience.value}>{audience.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Produits (nouveau) */}
        {activeTab === 'produits' && <ProductsTab />}

        {/* Plans (nouveau) */}
        {activeTab === 'plans' && <PlansTab />}

        {/* Mes objectifs */}
        {activeTab === 'objectifs' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Objectifs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Qu&apos;est-ce que tu veux que tes utilisateurs fassent ? Ces objectifs guideront tes agents dans leurs actions.
                </p>
                <div className="space-y-3">
                  {/* Predefined objectives */}
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.objectives.some(o => o.type === 'use_feature')}
                      onChange={() => toggleObjective('use_feature')}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Utiliser une feature clé</span>
                      {settings.objectives.find(o => o.type === 'use_feature') && (
                        <select
                          value={settings.objectives.find(o => o.type === 'use_feature')?.config.feature as string || ''}
                          onChange={(e) => {
                            const obj = settings.objectives.find(o => o.type === 'use_feature');
                            if (obj) updateObjective(obj.id, { config: { feature: e.target.value } });
                          }}
                          className="mt-2 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          <option value="">Sélectionne une feature</option>
                          {settings.features.map(f => (
                            <option key={f.id} value={f.name}>{f.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.objectives.some(o => o.type === 'invite_collaborators')}
                      onChange={() => toggleObjective('invite_collaborators')}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Inviter des collaborateurs</span>
                      {settings.objectives.find(o => o.type === 'invite_collaborators') && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-500">Combien minimum ?</span>
                          <input
                            type="number"
                            min="1"
                            value={settings.objectives.find(o => o.type === 'invite_collaborators')?.config.min as number || 1}
                            onChange={(e) => {
                              const obj = settings.objectives.find(o => o.type === 'invite_collaborators');
                              if (obj) updateObjective(obj.id, { config: { min: parseInt(e.target.value) || 1 } });
                            }}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
                          />
                          <span className="text-sm text-gray-500">personnes</span>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.objectives.some(o => o.type === 'upgrade')}
                      onChange={() => toggleObjective('upgrade')}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Passer sur un plan payant</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.objectives.some(o => o.type === 'annual')}
                      onChange={() => toggleObjective('annual')}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Passer sur un plan annuel</span>
                    </div>
                  </label>
                </div>

                {/* Custom objectives */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Objectifs personnalisés</h4>
                  <div className="space-y-3">
                    {settings.objectives.filter(o => o.type === 'custom').map(obj => (
                      <div key={obj.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={obj.config.name as string || ''}
                              onChange={(e) => updateObjective(obj.id, { config: { ...obj.config, name: e.target.value } })}
                              placeholder="Nom de l'objectif"
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={obj.config.why as string || ''}
                              onChange={(e) => updateObjective(obj.id, { config: { ...obj.config, why: e.target.value } })}
                              placeholder="Pourquoi c'est important"
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeObjective(obj.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addObjective('custom')}
                      className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    >
                      + Ajouter un objectif personnalisé
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Ma voix */}
        {activeTab === 'voix' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Ton & Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ToneSlider
                  value={settings.tone}
                  onChange={(value) => updateSettings('tone', value)}
                  label="Ton de communication"
                />
                <HumorSelector
                  value={settings.humor}
                  onChange={(value) => updateSettings('humor', value)}
                  label="Humour"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue principale
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSettings('language', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valeurs & Contraintes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TagInput
                  value={settings.values}
                  onChange={(value) => updateSettings('values', value)}
                  label="Valeurs de marque (ce qui te définit)"
                  placeholder="Ex: Transparence, Client first..."
                />
                <TagInput
                  value={settings.never_say}
                  onChange={(value) => updateSettings('never_say', value)}
                  label="Ne jamais dire"
                  placeholder="Ex: Malheureusement, Cher client..."
                />
                <TagInput
                  value={settings.always_mention}
                  onChange={(value) => updateSettings('always_mention', value)}
                  label="Toujours mentionner"
                  placeholder="Ex: Support disponible 24/7..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exemples d&apos;emails</CardTitle>
              </CardHeader>
              <CardContent>
                <TextAreaList
                  value={settings.example_emails}
                  onChange={(value) => updateSettings('example_emails', value)}
                  description="Colle ici des emails que tu as écrits pour que l'IA apprenne ton style"
                  placeholder="Bonjour Marie,

J'espère que tout va bien de ton côté..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signature</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={settings.signature}
                  onChange={(e) => updateSettings('signature', e.target.value)}
                  placeholder="Cordialement,
L'équipe {company_name}"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Utilise {'{company_name}'} pour insérer automatiquement le nom de ton entreprise
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Segments */}
        {activeTab === 'segments' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Définis des segments pour appliquer des stratégies différentes selon le profil de tes clients.
                </p>
                <label className="flex items-center gap-3 mb-6">
                  <input
                    type="checkbox"
                    checked={settings.segmentation_enabled}
                    onChange={(e) => updateSettings('segmentation_enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Activer la segmentation</span>
                </label>

                {settings.segmentation_enabled && (
                  <div className="space-y-6">
                    {/* Segments par valeur (LTV) */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Segments par valeur (LTV)</h4>
                      <div className="space-y-3">
                        <div className="p-3 border border-gray-200 rounded-lg flex items-center gap-4">
                          <span className="text-lg">🥉</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">Bronze</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">LTV &lt;</span>
                              <input
                                type="number"
                                value={settings.segment_by_ltv.bronze.max}
                                onChange={(e) => updateSettings('segment_by_ltv', {
                                  ...settings.segment_by_ltv,
                                  bronze: { max: parseInt(e.target.value) || 0 }
                                })}
                                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">€</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 border border-gray-200 rounded-lg flex items-center gap-4">
                          <span className="text-lg">🥈</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">Silver</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">LTV entre</span>
                              <input
                                type="number"
                                value={settings.segment_by_ltv.silver.min}
                                onChange={(e) => updateSettings('segment_by_ltv', {
                                  ...settings.segment_by_ltv,
                                  silver: { ...settings.segment_by_ltv.silver, min: parseInt(e.target.value) || 0 }
                                })}
                                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">€ et</span>
                              <input
                                type="number"
                                value={settings.segment_by_ltv.silver.max}
                                onChange={(e) => updateSettings('segment_by_ltv', {
                                  ...settings.segment_by_ltv,
                                  silver: { ...settings.segment_by_ltv.silver, max: parseInt(e.target.value) || 0 }
                                })}
                                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">€</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 border border-gray-200 rounded-lg flex items-center gap-4">
                          <span className="text-lg">🥇</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">Gold</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">LTV &gt;</span>
                              <input
                                type="number"
                                value={settings.segment_by_ltv.gold.min}
                                onChange={(e) => updateSettings('segment_by_ltv', {
                                  ...settings.segment_by_ltv,
                                  gold: { min: parseInt(e.target.value) || 0 }
                                })}
                                className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">€</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Segments personnalisés */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Segments personnalisés</h4>
                      <div className="space-y-3">
                        {settings.segments.map(segment => (
                          <div key={segment.id} className="p-3 border border-gray-200 rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <input
                                type="text"
                                value={segment.name}
                                onChange={(e) => updateSegment(segment.id, { name: e.target.value })}
                                placeholder="Nom du segment"
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                              />
                              <button
                                onClick={() => removeSegment(segment.id)}
                                className="ml-2 text-sm text-red-600 hover:text-red-700"
                              >
                                Supprimer
                              </button>
                            </div>
                            <input
                              type="text"
                              value={segment.conditions}
                              onChange={(e) => updateSegment(segment.id, { conditions: e.target.value })}
                              placeholder='Condition (ex: Tag "partner" OU email contient "@bigcorp")'
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                            />
                            <select
                              value={segment.strategy}
                              onChange={(e) => updateSegment(segment.id, { strategy: e.target.value as SegmentStrategy })}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                              <option value="conservative">Conservateur</option>
                              <option value="moderate">Modéré</option>
                              <option value="aggressive">Agressif</option>
                            </select>
                          </div>
                        ))}
                        <button
                          onClick={addSegment}
                          className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        >
                          + Ajouter un segment personnalisé
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-4">
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
