'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockSegments } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

const triggerOptions = [
  { value: 'signup', label: 'Nouveau signup', icon: '👋' },
  { value: 'trial_started', label: 'Trial démarré', icon: '🧪' },
  { value: 'trial_ending', label: 'Trial expire bientôt', icon: '⏰' },
  { value: 'payment_failed', label: 'Paiement échoué', icon: '💳' },
  { value: 'inactive_14d', label: 'Inactif 14 jours', icon: '😴' },
  { value: 'limit_approaching', label: 'Limite approchée', icon: '📈' },
];

export default function NewAutomationPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'event' | 'segment'>('event');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');

  const handleCreate = () => {
    if (!name) {
      alert('Veuillez entrer un nom');
      return;
    }
    alert(`Automation "${name}" créée ! Redirection vers l'éditeur... (simulation)`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/automations"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle automation</h1>
          <p className="text-gray-500 mt-1">Configurez le déclencheur de votre workflow</p>
        </div>
      </div>

      <Card className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de l&apos;automation
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Onboarding Welcome"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optionnel)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Séquence de bienvenue pour les nouveaux inscrits"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Trigger Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de déclencheur
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTriggerType('event')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                triggerType === 'event'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">⚡</span>
              <p className="font-semibold text-gray-900 mt-2">Événement</p>
              <p className="text-sm text-gray-500">Déclenché par une action</p>
            </button>
            <button
              onClick={() => setTriggerType('segment')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                triggerType === 'segment'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">👥</span>
              <p className="font-semibold text-gray-900 mt-2">Segment</p>
              <p className="text-sm text-gray-500">Quand un user entre/sort</p>
            </button>
          </div>
        </div>

        {/* Event Selection */}
        {triggerType === 'event' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Événement déclencheur
            </label>
            <div className="grid grid-cols-2 gap-3">
              {triggerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedEvent(option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors flex items-center gap-3 ${
                    selectedEvent === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium text-gray-900">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Segment Selection */}
        {triggerType === 'segment' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segment
            </label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sélectionner un segment...</option>
              {mockSegments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name} ({segment.userCount} users)
                </option>
              ))}
            </select>

            <div className="mt-3 flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="segmentAction" defaultChecked className="text-indigo-600" />
                <span className="text-sm text-gray-700">Quand un user entre</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="segmentAction" className="text-indigo-600" />
                <span className="text-sm text-gray-700">Quand un user sort</span>
              </label>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Link
          href="/automations"
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Annuler
        </Link>
        <button
          onClick={handleCreate}
          disabled={!name || (triggerType === 'event' && !selectedEvent) || (triggerType === 'segment' && !selectedSegment)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Créer et configurer →
        </button>
      </div>

      {/* Templates suggestion */}
      <Card className="mt-8 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h3 className="font-semibold text-gray-900">Astuce</h3>
            <p className="text-sm text-gray-600 mt-1">
              Gagnez du temps en utilisant un de nos{' '}
              <Link href="/automations/templates" className="text-indigo-600 hover:underline">
                templates pré-configurés
              </Link>
              . Vous pourrez ensuite les personnaliser selon vos besoins.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
