'use client';

import { useState } from 'react';
import {
  UserAttribute,
  UserAttributeValues,
  predefinedAttributes,
  customAttributes,
} from '@/lib/mock-data';

interface UserAttributesProps {
  userId: string;
  initialValues: UserAttributeValues;
  onSave?: (values: UserAttributeValues) => void;
}

export function UserAttributes({ initialValues, onSave }: UserAttributesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<UserAttributeValues>(initialValues);

  const activeAttributes = [...predefinedAttributes, ...customAttributes].filter(
    (attr) => attr.isActive
  );

  const handleChange = (key: string, value: string | number | boolean | null) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave?.(values);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValues(initialValues);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">✏️</span>
          <h3 className="font-semibold text-gray-900">ATTRIBUTS PERSONNALISES</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Editer
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {activeAttributes.map((attr) => (
            <div key={attr.id} className="flex items-center gap-4">
              <label className="w-40 text-sm text-gray-600 flex-shrink-0">
                {attr.name}
              </label>
              <div className="flex-1">
                {isEditing ? (
                  <AttributeInput
                    attribute={attr}
                    value={values[attr.key]}
                    onChange={(value) => handleChange(attr.key, value)}
                  />
                ) : (
                  <AttributeDisplay
                    attribute={attr}
                    value={values[attr.key]}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Sauvegarder les modifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AttributeInputProps {
  attribute: UserAttribute;
  value: string | number | boolean | null | undefined;
  onChange: (value: string | number | boolean | null) => void;
}

function AttributeInput({ attribute, value, onChange }: AttributeInputProps) {
  switch (attribute.type) {
    case 'select':
      return (
        <select
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Selectionner...</option>
          {attribute.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'boolean':
      return (
        <select
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Non renseigne</option>
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
      );
    case 'number':
      return (
        <input
          type="number"
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      );
    default:
      return (
        <input
          type="text"
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      );
  }
}

interface AttributeDisplayProps {
  attribute: UserAttribute;
  value: string | number | boolean | null | undefined;
}

function AttributeDisplay({ attribute, value }: AttributeDisplayProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 text-sm">—</span>;
  }

  if (attribute.type === 'boolean') {
    return (
      <span className={`text-sm ${value ? 'text-green-600' : 'text-gray-600'}`}>
        {value ? 'Oui' : 'Non'}
      </span>
    );
  }

  if (attribute.type === 'select') {
    return (
      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm">
        {value.toString()}
      </span>
    );
  }

  return <span className="text-sm text-gray-900">{value.toString()}</span>;
}
