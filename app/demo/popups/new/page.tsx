'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  PopupType,
  PopupPosition,
  PopupSize,
  PopupTriggerType,
  PopupDesign,
  PopupTargeting,
  PopupTrigger,
  PopupFrequency,
  PopupABTest,
} from '@/lib/mock-data';

const STEPS = [
  { id: 1, name: 'Type', description: 'Choisir le type de popup' },
  { id: 2, name: 'Design', description: 'Personnaliser l\'apparence' },
  { id: 3, name: 'Ciblage', description: 'Definir l\'audience' },
  { id: 4, name: 'A/B Test', description: 'Configurer les variantes' },
];

const popupTypes: { type: PopupType; label: string; description: string; icon: string; color: string }[] = [
  { type: 'upsell', label: 'Upsell', description: 'Proposer un upgrade de plan', icon: '⬆️', color: '#6366f1' },
  { type: 'promo', label: 'Promo', description: 'Offre promotionnelle ou code promo', icon: '🏷️', color: '#f59e0b' },
  { type: 'survey', label: 'Survey', description: 'NPS ou enquete de satisfaction', icon: '📊', color: '#10b981' },
  { type: 'feedback', label: 'Feedback', description: 'Collecter des retours utilisateurs', icon: '💬', color: '#8b5cf6' },
  { type: 'announcement', label: 'Annonce', description: 'Nouvelle feature ou mise a jour', icon: '📢', color: '#3b82f6' },
  { type: 'exit_intent', label: 'Exit Intent', description: 'Retenir les visiteurs qui partent', icon: '🚪', color: '#ef4444' },
  { type: 'onboarding', label: 'Onboarding', description: 'Guide les nouveaux utilisateurs', icon: '🎓', color: '#06b6d4' },
];

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

const triggerTypes: { value: PopupTriggerType; label: string; description: string }[] = [
  { value: 'page_load', label: 'Chargement page', description: 'Afficher immediatement' },
  { value: 'delay', label: 'Delai', description: 'Attendre X secondes' },
  { value: 'scroll', label: 'Scroll', description: 'Apres X% de scroll' },
  { value: 'exit_intent', label: 'Exit Intent', description: 'Quand la souris quitte la page' },
  { value: 'click', label: 'Clic', description: 'Sur clic d\'un element' },
  { value: 'custom', label: 'Evenement custom', description: 'Event JavaScript personnalise' },
];

const frequencyOptions: { value: PopupFrequency['per']; label: string }[] = [
  { value: 'session', label: 'par session' },
  { value: 'day', label: 'par jour' },
  { value: 'week', label: 'par semaine' },
  { value: 'month', label: 'par mois' },
  { value: 'total', label: 'au total' },
];

interface FormData {
  name: string;
  type: PopupType | null;
  design: Partial<PopupDesign>;
  targeting: PopupTargeting;
  trigger: PopupTrigger;
  frequency: PopupFrequency;
  abTest: PopupABTest;
}

export default function NewPopupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: null,
    design: {
      position: 'center',
      size: 'medium',
      title: '',
      description: '',
      primaryButton: { text: 'Valider', color: '#6366f1' },
      backgroundColor: '#ffffff',
      borderRadius: 12,
      overlay: true,
      overlayColor: 'rgba(0,0,0,0.5)',
    },
    targeting: {
      excludeConverted: true,
      excludeClosed: true,
      excludeSeen: false,
    },
    trigger: {
      type: 'delay',
      delay: 5,
    },
    frequency: {
      max: 1,
      per: 'session',
    },
    abTest: {
      enabled: false,
      variants: [],
      stopCondition: { type: 'confidence', value: 95 },
    },
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.type !== null && formData.name.trim() !== '';
      case 2:
        return formData.design.title && formData.design.primaryButton?.text;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving popup:', formData);
    alert('Popup sauvegarde ! (simulation)');
  };

  const selectedTypeInfo = popupTypes.find((t) => t.type === formData.type);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/popups"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau Popup</h1>
          <p className="text-gray-500 mt-1">Creez un popup en 4 etapes</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    currentStep > step.id
                      ? 'bg-emerald-500 text-white'
                      : currentStep === step.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {/* Step 1: Type */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Choisissez le type de popup</h2>

            {/* Popup Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du popup</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Upgrade Black Friday"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popupTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => setFormData({ ...formData, type: type.type })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.type === type.type
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${type.color}20` }}
                  >
                    <span className="text-xl">{type.icon}</span>
                  </div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Design */}
        {currentStep === 2 && (
          <div className="grid grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Design du popup</h2>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <select
                  value={formData.design.position || 'center'}
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
                  value={formData.design.title || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      design: { ...formData.design, title: e.target.value },
                    })
                  }
                  placeholder="Ex: Passez au plan Growth"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.design.description || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      design: { ...formData.design, description: e.target.value },
                    })
                  }
                  placeholder="Ex: Debloquez les automations avancees..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Primary Button */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bouton principal</label>
                  <input
                    type="text"
                    value={formData.design.primaryButton?.text || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        design: {
                          ...formData.design,
                          primaryButton: { ...formData.design.primaryButton!, text: e.target.value },
                        },
                      })
                    }
                    placeholder="Ex: Upgrader"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.design.primaryButton?.color || '#6366f1'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          design: {
                            ...formData.design,
                            primaryButton: { ...formData.design.primaryButton!, color: e.target.value },
                          },
                        })
                      }
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.design.primaryButton?.color || '#6366f1'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          design: {
                            ...formData.design,
                            primaryButton: { ...formData.design.primaryButton!, color: e.target.value },
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

            {/* Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Apercu</h3>
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
                  {selectedTypeInfo && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${selectedTypeInfo.color}20` }}
                    >
                      <span>{selectedTypeInfo.icon}</span>
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {formData.design.title || 'Titre du popup'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {formData.design.description || 'Description du popup...'}
                  </p>
                  <button
                    className="w-full py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: formData.design.primaryButton?.color || '#6366f1' }}
                  >
                    {formData.design.primaryButton?.text || 'Bouton'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Targeting */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Ciblage et declenchement</h2>

            <div className="grid grid-cols-2 gap-8">
              {/* Targeting */}
              <div className="space-y-5">
                <h3 className="font-medium text-gray-900">Audience</h3>

                {/* Segment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Segment (optionnel)</label>
                  <select
                    value={formData.targeting.segmentId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targeting: {
                          ...formData.targeting,
                          segmentId: e.target.value || undefined,
                          segmentName: e.target.value ? 'Hot leads freemium' : undefined,
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

                {/* Exclusions */}
                <div className="space-y-3">
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

              {/* Trigger & Frequency */}
              <div className="space-y-5">
                <h3 className="font-medium text-gray-900">Declenchement</h3>

                {/* Trigger Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quand afficher</label>
                  <div className="space-y-2">
                    {triggerTypes.map((trigger) => (
                      <button
                        key={trigger.value}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            trigger: { ...formData.trigger, type: trigger.value },
                          })
                        }
                        className={`w-full p-3 rounded-lg text-left transition-colors border ${
                          formData.trigger.type === trigger.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm text-gray-900">{trigger.label}</p>
                        <p className="text-xs text-gray-500">{trigger.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delay Config */}
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
                      min={0}
                      max={300}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Scroll Config */}
                {formData.trigger.type === 'scroll' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pourcentage de scroll</label>
                    <input
                      type="number"
                      value={formData.trigger.scrollPercent || 50}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          trigger: { ...formData.trigger, scrollPercent: parseInt(e.target.value) || 0 },
                        })
                      }
                      min={0}
                      max={100}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequence d&apos;affichage</label>
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
                      min={1}
                      max={100}
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
            </div>
          </div>
        )}

        {/* Step 4: A/B Test */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">A/B Testing (optionnel)</h2>

            {/* Enable Toggle */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="enableAB"
                checked={formData.abTest.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    abTest: { ...formData.abTest, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="enableAB" className="font-medium text-gray-900">
                Activer l&apos;A/B Testing
              </label>
            </div>

            {formData.abTest.enabled && (
              <div className="space-y-6">
                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Variantes</h3>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          abTest: {
                            ...formData.abTest,
                            variants: [
                              ...formData.abTest.variants,
                              {
                                id: `var_${Date.now()}`,
                                name: `Variante ${String.fromCharCode(65 + formData.abTest.variants.length)}`,
                                changes: '',
                                trafficPercent: 50,
                              },
                            ],
                          },
                        })
                      }
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                      + Ajouter variante
                    </button>
                  </div>

                  {formData.abTest.variants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                      <p className="text-gray-500 text-sm">
                        Ajoutez des variantes pour tester differentes versions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Original */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">Original (Controle)</span>
                            <p className="text-sm text-gray-500 mt-0.5">Version de base</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {100 - formData.abTest.variants.reduce((sum, v) => sum + v.trafficPercent, 0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {formData.abTest.variants.map((variant, index) => (
                        <div key={variant.id} className="p-4 bg-white rounded-xl border border-gray-200">
                          <div className="flex items-center gap-4">
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => {
                                const newVariants = [...formData.abTest.variants];
                                newVariants[index].name = e.target.value;
                                setFormData({
                                  ...formData,
                                  abTest: { ...formData.abTest, variants: newVariants },
                                });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              placeholder="Nom de la variante"
                            />
                            <input
                              type="text"
                              value={variant.changes}
                              onChange={(e) => {
                                const newVariants = [...formData.abTest.variants];
                                newVariants[index].changes = e.target.value;
                                setFormData({
                                  ...formData,
                                  abTest: { ...formData.abTest, variants: newVariants },
                                });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              placeholder="Changements (ex: Titre different)"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={variant.trafficPercent}
                                onChange={(e) => {
                                  const newVariants = [...formData.abTest.variants];
                                  newVariants[index].trafficPercent = parseInt(e.target.value) || 0;
                                  setFormData({
                                    ...formData,
                                    abTest: { ...formData.abTest, variants: newVariants },
                                  });
                                }}
                                min={0}
                                max={100}
                                className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center"
                              />
                              <span className="text-sm text-gray-600">%</span>
                            </div>
                            <button
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  abTest: {
                                    ...formData.abTest,
                                    variants: formData.abTest.variants.filter((_, i) => i !== index),
                                  },
                                })
                              }
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stop Condition */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Condition d&apos;arret</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { type: 'confidence', label: 'Confiance %', defaultValue: 95 },
                      { type: 'impressions', label: 'Impressions', defaultValue: 1000 },
                      { type: 'days', label: 'Jours', defaultValue: 14 },
                      { type: 'manual', label: 'Manuel', defaultValue: undefined },
                    ].map((condition) => (
                      <button
                        key={condition.type}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            abTest: {
                              ...formData.abTest,
                              stopCondition: {
                                type: condition.type as 'confidence' | 'impressions' | 'days' | 'manual',
                                value: condition.defaultValue,
                              },
                            },
                          })
                        }
                        className={`p-3 rounded-lg text-center transition-colors border ${
                          formData.abTest.stopCondition.type === condition.type
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{condition.label}</p>
                      </button>
                    ))}
                  </div>
                  {formData.abTest.stopCondition.type !== 'manual' && (
                    <div className="mt-3">
                      <input
                        type="number"
                        value={formData.abTest.stopCondition.value || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            abTest: {
                              ...formData.abTest,
                              stopCondition: {
                                ...formData.abTest.stopCondition,
                                value: parseInt(e.target.value) || 0,
                              },
                            },
                          })
                        }
                        className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {!formData.abTest.enabled && (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p>Activez l&apos;A/B testing pour optimiser les performances de votre popup</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Retour
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Sauvegarder brouillon
          </button>
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                canProceed()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-indigo-200 text-indigo-400 cursor-not-allowed'
              }`}
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Publier le popup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
