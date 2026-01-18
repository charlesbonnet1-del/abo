'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  mockPopups,
  PopupType,
  PopupPosition,
  PopupSize,
  PopupTriggerType,
  PopupDesign,
  PopupTargeting,
  PopupTrigger,
  PopupFrequency,
  PopupABTest,
  formatCurrency,
} from '@/lib/mock-data';

const positions: { value: PopupPosition; label: string }[] = [
  { value: 'center', label: 'Centre' },
  { value: 'bottom-right', label: 'Bas-droite' },
  { value: 'bottom-left', label: 'Bas-gauche' },
  { value: 'top-right', label: 'Haut-droite' },
  { value: 'top-left', label: 'Haut-gauche' },
  { value: 'bottom-bar', label: 'Barre bas' },
  { value: 'top-bar', label: 'Barre haut' },
];

const sizes: { value: PopupSize; label: string }[] = [
  { value: 'small', label: 'Petit' },
  { value: 'medium', label: 'Moyen' },
  { value: 'large', label: 'Grand' },
];

const triggerTypes: { value: PopupTriggerType; label: string }[] = [
  { value: 'page_load', label: 'Chargement page' },
  { value: 'delay', label: 'Delai' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'exit_intent', label: 'Exit Intent' },
  { value: 'click', label: 'Clic' },
  { value: 'custom', label: 'Evenement custom' },
];

const frequencyOptions: { value: PopupFrequency['per']; label: string }[] = [
  { value: 'session', label: 'par session' },
  { value: 'day', label: 'par jour' },
  { value: 'week', label: 'par semaine' },
  { value: 'month', label: 'par mois' },
  { value: 'total', label: 'au total' },
];

const typeLabels: Record<PopupType, string> = {
  upsell: 'Upsell',
  promo: 'Promo',
  survey: 'Survey',
  feedback: 'Feedback',
  announcement: 'Annonce',
  exit_intent: 'Exit Intent',
  onboarding: 'Onboarding',
};

const typeColors: Record<PopupType, string> = {
  upsell: '#6366f1',
  promo: '#f59e0b',
  survey: '#10b981',
  feedback: '#8b5cf6',
  announcement: '#3b82f6',
  exit_intent: '#ef4444',
  onboarding: '#06b6d4',
};

interface FormData {
  name: string;
  type: PopupType;
  design: PopupDesign;
  targeting: PopupTargeting;
  trigger: PopupTrigger;
  frequency: PopupFrequency;
  abTest: PopupABTest;
}

export default function EditPopupPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<'design' | 'targeting' | 'stats'>('design');
  const [formData, setFormData] = useState<FormData | null>(null);

  const popup = mockPopups.find((p) => p.id === resolvedParams.id);

  useEffect(() => {
    if (popup) {
      setFormData({
        name: popup.name,
        type: popup.type,
        design: popup.design,
        targeting: popup.targeting,
        trigger: popup.trigger,
        frequency: popup.frequency,
        abTest: popup.abTest || {
          enabled: false,
          variants: [],
          stopCondition: { type: 'confidence', value: 95 },
        },
      });
    }
  }, [popup]);

  if (!popup || !formData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <p className="text-gray-500">Popup non trouve</p>
          <Link href="/popups" className="text-indigo-600 hover:underline mt-2 inline-block">
            Retour a la liste
          </Link>
        </div>
      </div>
    );
  }

  const conversionRate =
    popup.stats.impressions > 0
      ? ((popup.stats.conversions / popup.stats.impressions) * 100).toFixed(1)
      : '0';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/popups"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{popup.name}</h1>
              <span
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${typeColors[popup.type]}20`,
                  color: typeColors[popup.type],
                }}
              >
                {typeLabels[popup.type]}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{popup.design.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Dupliquer
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card className="text-center">
          <p className="text-sm text-gray-500">Impressions</p>
          <p className="text-2xl font-bold text-gray-900">{popup.stats.impressions.toLocaleString()}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Clics</p>
          <p className="text-2xl font-bold text-gray-900">{popup.stats.clicks.toLocaleString()}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Conversions</p>
          <p className="text-2xl font-bold text-emerald-600">{popup.stats.conversions}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Taux conv.</p>
          <p className="text-2xl font-bold text-indigo-600">{conversionRate}%</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            {popup.stats.revenue > 0 ? formatCurrency(popup.stats.revenue) : '-'}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'design', label: 'Design' },
          { id: 'targeting', label: 'Ciblage' },
          { id: 'stats', label: 'Statistiques' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'design' | 'targeting' | 'stats')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Design du popup</h2>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <select
                  value={formData.design.position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      design: { ...formData.design, position: e.target.value as PopupPosition },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taille</label>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          design: { ...formData.design, size: size.value },
                        })
                      }
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        formData.design.size === size.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <input
                  type="text"
                  value={formData.design.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      design: { ...formData.design, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.design.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      design: { ...formData.design, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Button */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bouton</label>
                  <input
                    type="text"
                    value={formData.design.primaryButton.text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        design: {
                          ...formData.design,
                          primaryButton: { ...formData.design.primaryButton, text: e.target.value },
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.design.primaryButton.color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          design: {
                            ...formData.design,
                            primaryButton: { ...formData.design.primaryButton, color: e.target.value },
                          },
                        })
                      }
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.design.primaryButton.color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          design: {
                            ...formData.design,
                            primaryButton: { ...formData.design.primaryButton, color: e.target.value },
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Overlay */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="overlay"
                  checked={formData.design.overlay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      design: { ...formData.design, overlay: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="overlay" className="text-sm text-gray-700">
                  Afficher un overlay sombre
                </label>
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Apercu</h2>
            <div className="relative bg-gray-100 rounded-xl h-80 overflow-hidden">
              {formData.design.overlay && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: formData.design.overlayColor || 'rgba(0,0,0,0.5)' }}
                />
              )}
              <div
                className={`absolute bg-white shadow-xl p-6 ${
                  formData.design.size === 'small'
                    ? 'w-64'
                    : formData.design.size === 'large'
                    ? 'w-96'
                    : 'w-80'
                } ${
                  formData.design.position === 'center'
                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                    : formData.design.position === 'bottom-right'
                    ? 'bottom-4 right-4'
                    : formData.design.position === 'bottom-left'
                    ? 'bottom-4 left-4'
                    : formData.design.position === 'top-right'
                    ? 'top-4 right-4'
                    : formData.design.position === 'top-left'
                    ? 'top-4 left-4'
                    : formData.design.position === 'bottom-bar'
                    ? 'bottom-0 left-0 right-0 w-full'
                    : 'top-0 left-0 right-0 w-full'
                }`}
                style={{
                  borderRadius: formData.design.borderRadius || 12,
                  backgroundColor: formData.design.backgroundColor || '#ffffff',
                }}
              >
                <h4 className="font-semibold text-gray-900 mb-2">{formData.design.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{formData.design.description}</p>
                <button
                  className="w-full py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: formData.design.primaryButton.color }}
                >
                  {formData.design.primaryButton.text}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Targeting Tab */}
      {activeTab === 'targeting' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Audience */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
                <select
                  value={formData.targeting.segmentId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targeting: {
                        ...formData.targeting,
                        segmentId: e.target.value || undefined,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tous les visiteurs</option>
                  <option value="seg_9">Hot leads freemium</option>
                  <option value="seg_10">Power users</option>
                  <option value="seg_11">Churning risk</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="excludeConverted"
                    checked={formData.targeting.excludeConverted}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targeting: { ...formData.targeting, excludeConverted: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="excludeConverted" className="text-sm text-gray-700">
                    Exclure les utilisateurs deja convertis
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="excludeClosed"
                    checked={formData.targeting.excludeClosed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targeting: { ...formData.targeting, excludeClosed: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="excludeClosed" className="text-sm text-gray-700">
                    Exclure ceux qui ont ferme le popup
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="excludeSeen"
                    checked={formData.targeting.excludeSeen}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targeting: { ...formData.targeting, excludeSeen: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="excludeSeen" className="text-sm text-gray-700">
                    Exclure ceux qui ont deja vu le popup
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Trigger */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Declenchement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.trigger.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trigger: { ...formData.trigger, type: e.target.value as PopupTriggerType },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {triggerTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.trigger.type === 'delay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delai (secondes)</label>
                  <input
                    type="number"
                    value={formData.trigger.delay || 5}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger: { ...formData.trigger, delay: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {formData.trigger.type === 'scroll' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scroll %</label>
                  <input
                    type="number"
                    value={formData.trigger.scrollPercent || 50}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger: { ...formData.trigger, scrollPercent: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequence</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.frequency.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frequency: { ...formData.frequency, max: parseInt(e.target.value) || 1 },
                      })
                    }
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">fois</span>
                  <select
                    value={formData.frequency.per}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frequency: { ...formData.frequency, per: e.target.value as PopupFrequency['per'] },
                      })
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {frequencyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Statistiques detaillees</h2>

          <div className="grid grid-cols-2 gap-8">
            {/* Funnel */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Funnel de conversion</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Impressions</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="font-medium w-16 text-right">{popup.stats.impressions.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Clics</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${popup.stats.impressions > 0 ? (popup.stats.clicks / popup.stats.impressions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium w-16 text-right">{popup.stats.clicks.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversions</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${popup.stats.impressions > 0 ? (popup.stats.conversions / popup.stats.impressions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium w-16 text-right">{popup.stats.conversions}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rates */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Taux</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-sm text-gray-500">CTR</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {popup.stats.impressions > 0
                      ? ((popup.stats.clicks / popup.stats.impressions) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl text-center">
                  <p className="text-sm text-indigo-600">Taux conversion</p>
                  <p className="text-2xl font-bold text-indigo-600">{conversionRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          {popup.stats.revenue > 0 && (
            <div className="mt-8 p-6 bg-emerald-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Revenue genere</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">
                    {formatCurrency(popup.stats.revenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-emerald-600">Revenue par conversion</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {popup.stats.conversions > 0
                      ? formatCurrency(popup.stats.revenue / popup.stats.conversions)
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
