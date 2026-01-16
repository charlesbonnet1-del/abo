'use client';

import { useState, useEffect } from 'react';
import { UserAttribute, AttributeType } from '@/lib/mock-data';

interface AttributeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  attribute?: UserAttribute | null;
}

export function AttributeEditor({ isOpen, onClose, attribute }: AttributeEditorProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState<AttributeType>('text');
  const [options, setOptions] = useState<string[]>(['']);
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');

  useEffect(() => {
    if (attribute) {
      setName(attribute.name);
      setKey(attribute.key);
      setType(attribute.type);
      setOptions(attribute.options || ['']);
      setIsRequired(attribute.isRequired);
      setDefaultValue(attribute.defaultValue?.toString() || '');
    } else {
      setName('');
      setKey('');
      setType('text');
      setOptions(['']);
      setIsRequired(false);
      setDefaultValue('');
    }
  }, [attribute, isOpen]);

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáâäã]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôöõ]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!attribute) {
      setKey(generateKey(value));
    }
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving attribute:', {
      name,
      key,
      type,
      options: type === 'select' ? options.filter(Boolean) : undefined,
      isRequired,
      defaultValue: defaultValue || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!attribute;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Modifier l\'attribut' : 'Creer un attribut'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;attribut
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Potentiel upsell"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cle technique (auto-generee)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                />
                <button
                  onClick={() => setKey(generateKey(name))}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Regenerer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="space-y-2">
                {[
                  { value: 'text', label: 'Texte libre' },
                  { value: 'number', label: 'Nombre' },
                  { value: 'date', label: 'Date' },
                  { value: 'select', label: 'Liste deroulante' },
                  { value: 'boolean', label: 'Oui/Non' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={option.value}
                      checked={type === option.value}
                      onChange={(e) => setType(e.target.value as AttributeType)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options for select type */}
            {type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options de la liste
                </label>
                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                      {options.length > 1 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter une option
                  </button>
                </div>
              </div>
            )}

            {/* Default value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valeur par defaut (optionnel)
              </label>
              {type === 'select' ? (
                <select
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selectionner...</option>
                  {options.filter(Boolean).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : type === 'boolean' ? (
                <select
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selectionner...</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              ) : (
                <input
                  type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              )}
            </div>

            {/* Required checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Obligatoire (doit etre renseigne pour chaque user)
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!name || !key}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Enregistrer' : 'Creer l\'attribut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
