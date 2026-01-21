'use client';

interface TextAreaListProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  maxItems?: number;
}

export function TextAreaList({
  value,
  onChange,
  label,
  description,
  placeholder = 'Écris ton exemple ici...',
  maxItems = 5
}: TextAreaListProps) {
  const handleChange = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  const addItem = () => {
    if (value.length < maxItems) {
      onChange([...value, '']);
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      )}

      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="relative">
            <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Exemple {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
              <textarea
                value={item}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full px-3 py-2 text-sm outline-none resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {value.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un exemple
        </button>
      )}
    </div>
  );
}
