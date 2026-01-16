'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockSegments, MockSegment } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoachInline } from '@/components/coach';

export default function SegmentsPage() {
  const [segments] = useState<MockSegment[]>(mockSegments);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segments</h1>
          <p className="text-gray-500 mt-1">Créez et gérez vos segments d&apos;utilisateurs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer un segment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segments List */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50">Nom</th>
                  <th className="text-left p-4 font-semibold text-gray-900 bg-gray-50 hidden sm:table-cell">Filtres</th>
                  <th className="text-center p-4 font-semibold text-gray-900 bg-gray-50">Users</th>
                  <th className="text-right p-4 font-semibold text-gray-900 bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{segment.name}</span>
                        {segment.isSystem && (
                          <Badge variant="gray" className="text-xs">Système</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{segment.description}</p>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {segment.filterRules.length === 0 ? (
                          <span className="text-sm text-gray-400">Tous</span>
                        ) : (
                          segment.filterRules.slice(0, 2).map((rule, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                            >
                              {rule.field} {rule.operator === 'equals' ? '=' : rule.operator === 'less_than' ? '<' : rule.operator === 'greater_than' ? '>' : rule.operator} {String(rule.value).slice(0, 10)}
                            </span>
                          ))
                        )}
                        {segment.filterRules.length > 2 && (
                          <span className="text-xs text-gray-400">+{segment.filterRules.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm">
                        {segment.userCount}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/segments/${segment.id}`}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          Voir
                        </Link>
                        {!segment.isSystem && (
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Coach Inline */}
        <div className="lg:col-span-1">
          <CoachInline context="segment" />
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Créer un segment</h2>
              <p className="text-gray-500 mt-1">Définissez les critères de votre segment</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du segment</label>
                <input
                  type="text"
                  placeholder="Ex: Users actifs premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Ex: Users payants connectés récemment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Règles de filtrage</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Champ...</option>
                      <option value="status">Statut</option>
                      <option value="plan">Plan</option>
                      <option value="healthScore">Health Score</option>
                      <option value="lastSeenDays">Dernière connexion (jours)</option>
                      <option value="mrr">MRR</option>
                      <option value="tag">Tag</option>
                    </select>
                    <select className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="equals">=</option>
                      <option value="not_equals">!=</option>
                      <option value="greater_than">&gt;</option>
                      <option value="less_than">&lt;</option>
                      <option value="contains">contient</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Valeur"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter une règle
                  </button>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-700">
                  <span className="font-semibold">Preview :</span> ~12 users correspondent à ces critères
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert('Segment créé ! (simulation)');
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Créer le segment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
