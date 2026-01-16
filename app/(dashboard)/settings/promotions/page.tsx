'use client';

import { useState } from 'react';
import Link from 'next/link';
import { promoCodes, marketingOperations, formatCurrency, PromoCode, MarketingOperation } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { CoachChips } from '@/components/coach';

type Tab = 'promos' | 'operations';

// Promo Code Create Modal
function CreatePromoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_months'>('percentage');
  const [discountValue, setDiscountValue] = useState('20');

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Creer un code promo</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de reduction</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="discountType"
                    checked={discountType === 'percentage'}
                    onChange={() => setDiscountType('percentage')}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Pourcentage :</span>
                  <input
                    type="number"
                    value={discountType === 'percentage' ? discountValue : ''}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    disabled={discountType !== 'percentage'}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="discountType"
                    checked={discountType === 'fixed'}
                    onChange={() => setDiscountType('fixed')}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Montant fixe :</span>
                  <input
                    type="number"
                    value={discountType === 'fixed' ? discountValue : ''}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    disabled={discountType !== 'fixed'}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  />
                  <span className="text-sm text-gray-500">€</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="discountType"
                    checked={discountType === 'free_months'}
                    onChange={() => setDiscountType('free_months')}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Mois gratuits :</span>
                  <input
                    type="number"
                    value={discountType === 'free_months' ? discountValue : ''}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    disabled={discountType !== 'free_months'}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  />
                  <span className="text-sm text-gray-500">mois</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Applicable sur</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700">Tous les plans</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duree de la reduction</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="duration" defaultChecked className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Premier paiement uniquement</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="duration" className="text-indigo-600" />
                  <span className="text-sm text-gray-700">3 premiers mois</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="duration" className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Permanent (lifetime)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Validite</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="validity" defaultChecked className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Permanent</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="validity" className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Periode limitee</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Limite d&apos;utilisations</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="limit" defaultChecked className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Illimite</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="limit" className="text-indigo-600" />
                  <span className="text-sm text-gray-700">Maximum :</span>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Creer le code
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Marketing Operation Create Modal
function CreateOperationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Creer une operation marketing</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                placeholder="Summer Sale 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date debut</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code promo associe</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Selectionner un code existant</option>
                {promoCodes.map((promo) => (
                  <option key={promo.id} value={promo.id}>{promo.code} (-{promo.discountValue}%)</option>
                ))}
              </select>
              <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700">
                + Creer un nouveau code
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segment cible</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="seg_2">Freemium actifs (4 users)</option>
                <option value="seg_3">Trials actifs (3 users)</option>
                <option value="seg_1">Tous les users (20 users)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Communication</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700">Email de lancement (debut operation)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700">Email de relance (J-2 avant fin)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700">Email derniere chance (dernier jour)</span>
                </label>
              </div>
              <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700">
                Configurer les emails →
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Objectifs (optionnel)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Conversions visees</label>
                  <input
                    type="number"
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">MRR vise (€)</label>
                  <input
                    type="number"
                    placeholder="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Creer l&apos;operation
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Promo Code Row
function PromoCodeRow({ promo }: { promo: PromoCode }) {
  const isExpired = promo.validUntil && new Date(promo.validUntil) < new Date();
  const statusLabel = promo.isActive && !isExpired ? 'Actif' : 'Expire';
  const statusColor = promo.isActive && !isExpired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';

  const getDiscountLabel = () => {
    switch (promo.discountType) {
      case 'percentage':
        return `-${promo.discountValue}%`;
      case 'fixed':
        return `-${promo.discountValue}€`;
      case 'free_months':
        return `${promo.discountValue} mois gratuits`;
    }
  };

  const getValidityLabel = () => {
    if (!promo.validFrom && !promo.validUntil) return 'Permanent';
    if (promo.validFrom && promo.validUntil) {
      return `${new Date(promo.validFrom).toLocaleDateString('fr-FR')} - ${new Date(promo.validUntil).toLocaleDateString('fr-FR')}`;
    }
    return 'Permanent';
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="p-4 font-mono font-medium text-gray-900">{promo.code}</td>
      <td className="p-4 text-gray-600">{getDiscountLabel()}</td>
      <td className="p-4 text-gray-600">{getValidityLabel()}</td>
      <td className="p-4 text-gray-600">
        {promo.currentUses} / {promo.maxUses || '∞'}
      </td>
      <td className="p-4">
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </td>
      <td className="p-4">
        <button className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

// Marketing Operation Card
function OperationCard({ operation }: { operation: MarketingOperation }) {
  const statusConfig = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
    scheduled: { label: 'Planifiee', color: 'bg-blue-100 text-blue-700' },
    active: { label: 'En cours', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Terminee', color: 'bg-purple-100 text-purple-700' },
  };

  const status = statusConfig[operation.status];
  const hasResults = operation.results.conversions > 0;
  const retentionWarning = operation.results.retentionM3 < 60 && hasResults;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <h3 className="font-semibold text-gray-900">{operation.name}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(operation.startDate).toLocaleDateString('fr-FR')} - {new Date(operation.endDate).toLocaleDateString('fr-FR')} • Code: {operation.promoCode}
            </p>
            <p className="text-sm text-gray-500">
              Segment cible: {operation.targetSegmentName}
            </p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {hasResults && (
        <div className="p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Resultats :</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-lg font-bold text-gray-900">{operation.results.conversions}</p>
              <p className="text-xs text-gray-500">conversions</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(operation.results.mrrGenerated)}</p>
              <p className="text-xs text-gray-500">MRR genere</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{operation.results.roi}%</p>
              <p className="text-xs text-gray-500">ROI</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${retentionWarning ? 'text-red-600' : 'text-gray-900'}`}>
                {operation.results.retentionM3}%
                {retentionWarning && ' ⚠️'}
              </p>
              <p className="text-xs text-gray-500">Retention M3</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('promos');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);

  const coachQuestions = [
    {
      text: 'Quelle promo fonctionne le mieux ?',
      mockAnswer: `**Classement par LTV genere :**\n\n🥇 **FRIEND25** (parrainage)\n- 45 utilisations\n- LTV moyen : 620€\n- Retention M6 : 62%\n\n🥈 **WELCOME20** (nouveaux)\n- 156 utilisations\n- LTV moyen : 380€\n- Retention M6 : 52%\n\n🔴 **LAUNCH50** (a eviter)\n- LTV moyen : 145€\n- Retention M6 : 16%\n- Trop de chasseurs de promo`,
    },
    {
      text: 'Impact sur la retention ?',
      mockAnswer: `**Impact promos sur la retention :**\n\n**Sans promo :** 75% retention M3\n**Avec promo :** 55% retention M3 moyenne\n\n**Par code :**\n- FRIEND25 : 82% (-7% vs sans promo) ✅\n- WELCOME20 : 70% (-5%) ✅\n- BLACKFRIDAY : 62% (-13%) ⚠️\n- LAUNCH50 : 45% (-30%) 🔴\n\n**Recommandation :**\n- Limiter les grosses promos\n- Privilegier le parrainage\n- Ajouter engagement minimum`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/settings" className="hover:text-gray-700">Parametres</Link>
        <span>/</span>
        <span className="text-gray-900">Promotions</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Operations</h1>
          <p className="text-gray-500 mt-1">Gerez vos codes promo et operations marketing</p>
        </div>
        <button
          onClick={() => activeTab === 'promos' ? setShowPromoModal(true) : setShowOperationModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {activeTab === 'promos' ? 'Nouvelle promo' : 'Nouvelle operation'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('promos')}
          className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'promos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Codes promo
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'operations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Operations marketing
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          {activeTab === 'promos' ? (
            <Card className="overflow-hidden p-0">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Codes promo actifs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Code</th>
                      <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Reduction</th>
                      <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Validite</th>
                      <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Utilisations</th>
                      <th className="text-left p-4 font-medium text-gray-500 bg-gray-50">Status</th>
                      <th className="text-left p-4 font-medium text-gray-500 bg-gray-50"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((promo) => (
                      <PromoCodeRow key={promo.id} promo={promo} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {marketingOperations.map((operation) => (
                <OperationCard key={operation.id} operation={operation} />
              ))}
            </div>
          )}
        </div>

        {/* Coach Sidebar */}
        <div className="xl:col-span-1">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✨</span>
              <h3 className="font-semibold text-gray-900">Coach Promos</h3>
            </div>
            <CoachChips questions={coachQuestions} />
          </Card>

          {/* Stats */}
          <Card className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Codes actifs</span>
                <span className="font-medium text-gray-900">
                  {promoCodes.filter(p => p.isActive).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Utilisations totales</span>
                <span className="font-medium text-gray-900">
                  {promoCodes.reduce((sum, p) => sum + p.currentUses, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Operations completees</span>
                <span className="font-medium text-gray-900">
                  {marketingOperations.filter(o => o.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">MRR genere total</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(marketingOperations.reduce((sum, o) => sum + o.results.mrrGenerated, 0))}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreatePromoModal isOpen={showPromoModal} onClose={() => setShowPromoModal(false)} />
      <CreateOperationModal isOpen={showOperationModal} onClose={() => setShowOperationModal(false)} />
    </div>
  );
}
