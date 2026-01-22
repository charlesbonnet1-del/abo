'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TagInput } from '@/components/ui/TagInput';
import { ToneSlider } from '@/components/ui/ToneSlider';
import { TextAreaList } from '@/components/ui/TextAreaList';
import { HumorSelector } from '@/components/ui/HumorSelector';

interface BrandSettings {
  id?: string;
  user_id?: string;
  company_name: string;
  language: string;
  tone: 'formal' | 'neutral' | 'casual' | 'friendly';
  humor: 'none' | 'subtle' | 'yes';
  values: string[];
  never_say: string[];
  always_mention: string[];
  example_emails: string[];
  signature: string;
  // Agent configuration
  recovery_delays: number[];
  trial_warning_days: number;
  freemium_conversion_days: number;
}

const defaultSettings: BrandSettings = {
  company_name: '',
  language: 'fr',
  tone: 'neutral',
  humor: 'subtle',
  values: [],
  never_say: [],
  always_mention: [],
  example_emails: [],
  signature: 'Cordialement,\nL\'équipe {company_name}',
  // Agent configuration defaults
  recovery_delays: [0, 1, 3, 7],
  trial_warning_days: 3,
  freemium_conversion_days: 7,
};

const languages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];

export default function BrandLabPage() {
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
          values: data.values || [],
          never_say: data.never_say || [],
          always_mention: data.always_mention || [],
          example_emails: data.example_emails || [],
          recovery_delays: data.recovery_delays || [0, 1, 3, 7],
          trial_warning_days: data.trial_warning_days || 3,
          freemium_conversion_days: data.freemium_conversion_days || 7,
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

      const settingsToSave = {
        user_id: user.id,
        company_name: settings.company_name,
        language: settings.language,
        tone: settings.tone,
        humor: settings.humor,
        values: settings.values,
        never_say: settings.never_say,
        always_mention: settings.always_mention,
        example_emails: settings.example_emails,
        signature: settings.signature,
        recovery_delays: settings.recovery_delays,
        trial_warning_days: settings.trial_warning_days,
        freemium_conversion_days: settings.freemium_conversion_days,
        updated_at: new Date().toISOString(),
      };

      const { error: saveError } = await supabase
        .from('brand_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' });

      if (saveError) {
        console.error('Error saving settings:', saveError);
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

  const updateSettings = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Lab</h1>
            <p className="text-gray-500">Configure la personnalité de tes agents IA</p>
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
          Paramètres sauvegardés avec succès
        </div>
      )}

      <div className="space-y-6">
        {/* Identité */}
        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue principale
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings('language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Ton & Style */}
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
          </CardContent>
        </Card>

        {/* Valeurs & Contraintes */}
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

        {/* Exemples d'emails */}
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

        {/* Signature */}
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
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Utilise {'{company_name}'} pour insérer automatiquement le nom de ton entreprise
            </p>
          </CardContent>
        </Card>

        {/* Configuration des agents */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration des agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recovery delays */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recovery Agent - Delais de relance (jours apres echec)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {settings.recovery_delays.map((delay, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Etape {index + 1}:</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={delay}
                      onChange={(e) => {
                        const newDelays = [...settings.recovery_delays];
                        newDelays[index] = parseInt(e.target.value) || 0;
                        updateSettings('recovery_delays', newDelays);
                      }}
                      className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <span className="text-xs text-gray-500">j</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Exemple: 0 = immediat, 1 = 1 jour apres, etc.
              </p>
            </div>

            {/* Conversion Agent settings */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alerte fin de trial
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={settings.trial_warning_days}
                    onChange={(e) => updateSettings('trial_warning_days', parseInt(e.target.value) || 3)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-sm text-gray-500">jours avant expiration</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relance freemium apres
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.freemium_conversion_days}
                    onChange={(e) => updateSettings('freemium_conversion_days', parseInt(e.target.value) || 7)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-sm text-gray-500">jours d&apos;inactivite</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
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
