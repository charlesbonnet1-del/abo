'use client';

import { useState } from 'react';
import { mockWinDetails, winsHistory, WinDetail } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WinsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  churn_avoided: 'Churn evite',
  upsell: 'Upsell',
  payment_recovered: 'Paiement recupere',
  trial_converted: 'Trial converti',
};

const typeColors: Record<string, string> = {
  churn_avoided: 'bg-emerald-100 text-emerald-700',
  upsell: 'bg-blue-100 text-blue-700',
  payment_recovered: 'bg-purple-100 text-purple-700',
  trial_converted: 'bg-amber-100 text-amber-700',
};

export function WinsModal({ isOpen, onClose }: WinsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'evolution'>('details');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredDetails = filterType === 'all'
    ? mockWinDetails
    : mockWinDetails.filter(d => d.type === filterType);

  const totalMrr = mockWinDetails.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail des gains</h2>
            <p className="text-sm text-gray-500">Ce mois : {totalMrr.toLocaleString()}€ de MRR genere/sauve</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details par action
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'evolution'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Evolution
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <>
              {/* Filter */}
              <div className="flex gap-2 mb-4">
                {['all', 'churn_avoided', 'upsell', 'payment_recovered', 'trial_converted'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filterType === type
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'all' ? 'Tous' : typeLabels[type]}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Montant</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDetails.map((win: WinDetail) => (
                      <tr key={win.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[win.type]}`}>
                            {typeLabels[win.type]}
                          </span>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{win.userName}</p>
                            <p className="text-xs text-gray-500">{win.userEmail}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-sm font-semibold text-emerald-600">+{win.amount}€</span>
                        </td>
                        <td className="py-3 text-sm text-gray-500">
                          {new Date(win.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 text-sm text-gray-600">{win.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'evolution' && (
            <div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={winsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
                    <Tooltip
                      formatter={(value) => [`${Number(value) || 0}€`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mrrSaved"
                      name="MRR Sauve"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expansion"
                      name="Expansion"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="recovered"
                      name="Recupere"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-sm text-emerald-600 font-medium">Total MRR Sauve (6 mois)</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {winsHistory.reduce((sum, w) => sum + w.mrrSaved, 0).toLocaleString()}€
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium">Total Expansion</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {winsHistory.reduce((sum, w) => sum + w.expansion, 0).toLocaleString()}€
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600 font-medium">Total Recupere</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {winsHistory.reduce((sum, w) => sum + w.recovered, 0).toLocaleString()}€
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-4">
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Comment sont calcules ces gains?
          </button>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Comment ameliorer mes resultats?
          </button>
        </div>
      </div>
    </div>
  );
}
