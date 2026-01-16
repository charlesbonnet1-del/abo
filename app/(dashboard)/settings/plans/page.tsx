'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

type PlanType = 'free' | 'starter' | 'growth' | 'team' | 'scale';

interface Feature {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'limit';
}

interface PlanConfig {
  [planId: string]: {
    enabled: boolean;
    limit?: number;
  };
}

const features: Feature[] = [
  { id: 'export_pdf', name: 'Export PDF', description: 'Exporter les rapports en PDF', type: 'boolean' },
  { id: 'api_access', name: 'API Access', description: 'Accès à l\'API REST', type: 'boolean' },
  { id: 'sso', name: 'SSO', description: 'Single Sign-On (SAML, OAuth)', type: 'boolean' },
  { id: 'priority_support', name: 'Support prioritaire', description: 'Temps de réponse < 4h', type: 'boolean' },
  { id: 'users_limit', name: 'Utilisateurs', description: 'Nombre max d\'utilisateurs', type: 'limit' },
  { id: 'projects_limit', name: 'Projets', description: 'Nombre max de projets', type: 'limit' },
  { id: 'api_calls', name: 'Appels API / mois', description: 'Quota mensuel d\'appels API', type: 'limit' },
  { id: 'storage_gb', name: 'Stockage (GB)', description: 'Espace de stockage cloud', type: 'limit' },
];

const plans: { id: PlanType; name: string; price: number }[] = [
  { id: 'free', name: 'Free', price: 0 },
  { id: 'starter', name: 'Starter', price: 29 },
  { id: 'growth', name: 'Growth', price: 79 },
  { id: 'team', name: 'Team', price: 149 },
  { id: 'scale', name: 'Scale', price: 299 },
];

// Initial configuration
const initialConfig: Record<string, PlanConfig> = {
  export_pdf: {
    free: { enabled: false },
    starter: { enabled: true },
    growth: { enabled: true },
    team: { enabled: true },
    scale: { enabled: true },
  },
  api_access: {
    free: { enabled: false },
    starter: { enabled: false },
    growth: { enabled: true },
    team: { enabled: true },
    scale: { enabled: true },
  },
  sso: {
    free: { enabled: false },
    starter: { enabled: false },
    growth: { enabled: false },
    team: { enabled: true },
    scale: { enabled: true },
  },
  priority_support: {
    free: { enabled: false },
    starter: { enabled: false },
    growth: { enabled: false },
    team: { enabled: true },
    scale: { enabled: true },
  },
  users_limit: {
    free: { enabled: true, limit: 1 },
    starter: { enabled: true, limit: 3 },
    growth: { enabled: true, limit: 10 },
    team: { enabled: true, limit: 25 },
    scale: { enabled: true, limit: -1 }, // -1 = unlimited
  },
  projects_limit: {
    free: { enabled: true, limit: 1 },
    starter: { enabled: true, limit: 5 },
    growth: { enabled: true, limit: 20 },
    team: { enabled: true, limit: 50 },
    scale: { enabled: true, limit: -1 },
  },
  api_calls: {
    free: { enabled: true, limit: 100 },
    starter: { enabled: true, limit: 1000 },
    growth: { enabled: true, limit: 10000 },
    team: { enabled: true, limit: 50000 },
    scale: { enabled: true, limit: -1 },
  },
  storage_gb: {
    free: { enabled: true, limit: 1 },
    starter: { enabled: true, limit: 10 },
    growth: { enabled: true, limit: 50 },
    team: { enabled: true, limit: 200 },
    scale: { enabled: true, limit: -1 },
  },
};

export default function PlansSettingsPage() {
  const [config, setConfig] = useState(initialConfig);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleFeature = (featureId: string, planId: string) => {
    setConfig((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [planId]: {
          ...prev[featureId][planId],
          enabled: !prev[featureId][planId].enabled,
        },
      },
    }));
    setHasChanges(true);
  };

  const updateLimit = (featureId: string, planId: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setConfig((prev) => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [planId]: {
          ...prev[featureId][planId],
          limit: numValue,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Simulation
    alert('Configuration sauvegardée ! (simulation)');
    setHasChanges(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/settings"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans & Features</h1>
          <p className="text-gray-500 mt-1">Configurez les entitlements pour chaque plan</p>
        </div>
      </div>

      {/* Entitlements Matrix */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50 min-w-[200px]">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-4 font-semibold text-gray-900 bg-gray-50 min-w-[100px]">
                    <div>{plan.name}</div>
                    <div className="text-sm font-normal text-gray-500">
                      {plan.price === 0 ? 'Gratuit' : `${plan.price}€/mois`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={feature.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{feature.name}</div>
                    <div className="text-sm text-gray-500">{feature.description}</div>
                  </td>
                  {plans.map((plan) => {
                    const featureConfig = config[feature.id][plan.id];
                    return (
                      <td key={plan.id} className="p-4 text-center">
                        {feature.type === 'boolean' ? (
                          <button
                            onClick={() => toggleFeature(feature.id, plan.id)}
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                              featureConfig.enabled
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {featureConfig.enabled && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center justify-center">
                            {featureConfig.limit === -1 ? (
                              <button
                                onClick={() => updateLimit(feature.id, plan.id, '0')}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                              >
                                Illimité
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={featureConfig.limit}
                                  onChange={(e) => updateLimit(feature.id, plan.id, e.target.value)}
                                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  min="0"
                                />
                                <button
                                  onClick={() => updateLimit(feature.id, plan.id, '-1')}
                                  className="p-1 text-gray-400 hover:text-indigo-600"
                                  title="Définir comme illimité"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full font-medium shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sauvegarder les modifications
          </button>
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <span className="text-blue-500 text-xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900">Comment ça marche ?</h3>
            <p className="text-sm text-blue-800 mt-1">
              Les entitlements définissent ce que chaque plan peut faire. Quand un user essaie d&apos;accéder
              à une feature non incluse dans son plan, vous pouvez lui proposer un upgrade.
              Utilisez l&apos;API ou le SDK pour vérifier les entitlements côté code.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
