'use client';

interface HumorSelectorProps {
  value: 'none' | 'subtle' | 'yes';
  onChange: (value: 'none' | 'subtle' | 'yes') => void;
  label?: string;
}

const options = [
  { value: 'none', label: 'Jamais' },
  { value: 'subtle', label: 'Subtil' },
  { value: 'yes', label: 'Oui, assumé' },
] as const;

export function HumorSelector({ value, onChange, label }: HumorSelectorProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
      )}
      <div className="flex gap-3">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-indigo-500' : 'border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </div>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
