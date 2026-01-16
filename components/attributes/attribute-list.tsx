'use client';

import { useState } from 'react';
import {
  UserAttribute,
  systemAttributes,
  predefinedAttributes,
  customAttributes,
} from '@/lib/mock-data';
import { AttributeEditor } from './attribute-editor';

export function AttributeList() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<UserAttribute | null>(null);
  const [activePredef, setActivePredef] = useState<Record<string, boolean>>(
    Object.fromEntries(predefinedAttributes.map((a) => [a.id, a.isActive]))
  );

  const handleEdit = (attr: UserAttribute) => {
    setEditingAttribute(attr);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingAttribute(null);
    setIsEditorOpen(true);
  };

  const togglePredefined = (attrId: string) => {
    setActivePredef((prev) => ({ ...prev, [attrId]: !prev[attrId] }));
  };

  return (
    <div className="space-y-8">
      {/* System Attributes */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">🔒</span>
            <h3 className="font-semibold text-gray-900">ATTRIBUTS SYSTEME</h3>
            <span className="text-xs text-gray-500">(non modifiables)</span>
          </div>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase">
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Source</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Utilise dans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {systemAttributes.map((attr) => (
                <tr key={attr.id}>
                  <td className="py-2.5 text-gray-900">{attr.name}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      attr.source === 'stripe' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {attr.source === 'stripe' ? 'Stripe' : 'Systeme'}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-500 capitalize">{getTypeLabel(attr.type)}</td>
                  <td className="py-2.5 text-gray-500">
                    {attr.usedInSegments} segments, {attr.usedInAutomations} automations
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>⚠️</span>
            Ces attributs sont synchronises automatiquement et ne peuvent pas etre modifies manuellement.
          </p>
        </div>
      </div>

      {/* Predefined Attributes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📋</span>
            <h3 className="font-semibold text-gray-900">ATTRIBUTS PREDEFINIS</h3>
          </div>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase">
                <th className="pb-3 font-medium w-12">Actif</th>
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Options</th>
                <th className="pb-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {predefinedAttributes.map((attr) => (
                <tr key={attr.id} className={!activePredef[attr.id] ? 'opacity-50' : ''}>
                  <td className="py-2.5">
                    <button
                      onClick={() => togglePredefined(attr.id)}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        activePredef[attr.id] ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                        activePredef[attr.id] ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </td>
                  <td className="py-2.5 text-gray-900">{attr.name}</td>
                  <td className="py-2.5 text-gray-500 capitalize">{getTypeLabel(attr.type)}</td>
                  <td className="py-2.5 text-gray-500">
                    {attr.options ? attr.options.slice(0, 3).join(', ') + (attr.options.length > 3 ? '...' : '') : '—'}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(attr)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Attributes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">✨</span>
            <h3 className="font-semibold text-gray-900">ATTRIBUTS CUSTOM</h3>
          </div>
        </div>
        <div className="p-4">
          {customAttributes.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase">
                  <th className="pb-3 font-medium">Nom</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Options</th>
                  <th className="pb-3 font-medium">Utilise</th>
                  <th className="pb-3 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customAttributes.map((attr) => (
                  <tr key={attr.id}>
                    <td className="py-2.5 text-gray-900">{attr.name}</td>
                    <td className="py-2.5 text-gray-500 capitalize">{getTypeLabel(attr.type)}</td>
                    <td className="py-2.5 text-gray-500">
                      {attr.options ? attr.options.join(', ') : '—'}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {attr.usedInSegments} seg.
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(attr)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">Aucun attribut custom cree.</p>
          )}
          <button
            onClick={handleCreate}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un attribut custom
          </button>
        </div>
      </div>

      {/* Editor Modal */}
      <AttributeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        attribute={editingAttribute}
      />
    </div>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: 'Texte',
    number: 'Nombre',
    date: 'Date',
    select: 'Liste',
    boolean: 'Oui/Non',
  };
  return labels[type] || type;
}
