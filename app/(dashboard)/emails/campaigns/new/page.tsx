'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockSegments } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

export default function NewCampaignPage() {
  const [step, setStep] = useState(1);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now');

  const selectedSegmentData = mockSegments.find(s => s.id === selectedSegment);

  const handleCreate = () => {
    if (!selectedSegment || !subject) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    alert(`Campagne créée ! Redirection vers l'éditeur... (simulation)`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/emails"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle campagne</h1>
          <p className="text-gray-500 mt-1">Étape {step} sur 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${
              s <= step ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Destinataires */}
      {step === 1 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Destinataires</h2>
            <p className="text-sm text-gray-500">Sélectionnez le segment à cibler</p>
          </div>

          <div className="space-y-3">
            {mockSegments.slice(0, 8).map((segment) => (
              <label
                key={segment.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedSegment === segment.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="segment"
                    value={segment.id}
                    checked={selectedSegment === segment.id}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    className="text-indigo-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{segment.name}</p>
                    <p className="text-sm text-gray-500">{segment.description}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {segment.userCount} users
                </span>
              </label>
            ))}
          </div>

          <Link
            href="/segments"
            className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un nouveau segment
          </Link>

          {selectedSegment && (
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700">
                <span className="font-semibold">📊 Estimation :</span>{' '}
                {selectedSegmentData?.userCount} destinataires
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Contenu */}
      {step === 2 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Contenu</h2>
            <p className="text-sm text-gray-500">Définissez le sujet et le contenu de votre email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sujet de l&apos;email *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: 🚀 Nouvelle feature disponible !"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Variables disponibles : {'{'}first_name{'}'}, {'{'}company{'}'}, {'{'}plan{'}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texte de preview (optionnel)
            </label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Ex: Découvrez comment cette feature va changer votre quotidien..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Ce texte apparaît après le sujet dans la liste des emails
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="font-medium text-gray-900">{subject || 'Sujet de votre email'}</p>
              <p className="text-sm text-gray-500 truncate">
                {previewText || 'Texte de preview...'}
              </p>
            </div>
          </div>

          <div className="p-4 border border-indigo-200 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-800">
              <span className="font-semibold">💡 Astuce :</span> Le contenu de l&apos;email sera édité
              dans l&apos;éditeur drag & drop à l&apos;étape suivante.
            </p>
          </div>
        </Card>
      )}

      {/* Step 3: Envoi */}
      {step === 3 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Envoi</h2>
            <p className="text-sm text-gray-500">Choisissez quand envoyer votre campagne</p>
          </div>

          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                sendOption === 'now'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="sendOption"
                value="now"
                checked={sendOption === 'now'}
                onChange={() => setSendOption('now')}
                className="mt-1 text-indigo-600"
              />
              <div>
                <p className="font-medium text-gray-900">Envoyer maintenant</p>
                <p className="text-sm text-gray-500">
                  L&apos;email sera envoyé immédiatement après validation
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                sendOption === 'schedule'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="sendOption"
                value="schedule"
                checked={sendOption === 'schedule'}
                onChange={() => setSendOption('schedule')}
                className="mt-1 text-indigo-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Programmer l&apos;envoi</p>
                <p className="text-sm text-gray-500 mb-3">
                  Choisissez une date et heure d&apos;envoi
                </p>
                {sendOption === 'schedule' && (
                  <div className="flex gap-3">
                    <input
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="time"
                      defaultValue="10:00"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Recap */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Récapitulatif</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Segment :</dt>
                <dd className="font-medium text-gray-900">{selectedSegmentData?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Destinataires :</dt>
                <dd className="font-medium text-gray-900">{selectedSegmentData?.userCount} users</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Sujet :</dt>
                <dd className="font-medium text-gray-900 truncate max-w-[200px]">{subject}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Envoi :</dt>
                <dd className="font-medium text-gray-900">
                  {sendOption === 'now' ? 'Immédiat' : 'Programmé'}
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Précédent
          </button>
        ) : (
          <Link
            href="/emails"
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </Link>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !selectedSegment) || (step === 2 && !subject)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Suivant →
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => alert('Test envoyé à demo@abo.app ! (simulation)')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Envoyer un test
            </button>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {sendOption === 'now' ? 'Envoyer' : 'Programmer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
