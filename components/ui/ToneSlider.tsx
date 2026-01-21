'use client';

interface ToneSliderProps {
  value: 'formal' | 'neutral' | 'casual' | 'friendly';
  onChange: (value: 'formal' | 'neutral' | 'casual' | 'friendly') => void;
  label?: string;
}

const tones = [
  { value: 'formal', label: 'Formel' },
  { value: 'neutral', label: 'Neutre' },
  { value: 'casual', label: 'Décontracté' },
  { value: 'friendly', label: 'Amical' },
] as const;

export function ToneSlider({ value, onChange, label }: ToneSliderProps) {
  const currentIndex = tones.findIndex(t => t.value === value);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2" />

        {/* Active track */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-indigo-500 rounded-full -translate-y-1/2 transition-all duration-200"
          style={{ width: `${(currentIndex / (tones.length - 1)) * 100}%` }}
        />

        {/* Options */}
        <div className="relative flex justify-between">
          {tones.map((tone, index) => {
            const isActive = tone.value === value;
            const isPassed = index <= currentIndex;

            return (
              <button
                key={tone.value}
                type="button"
                onClick={() => onChange(tone.value)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500 border-indigo-500 scale-125'
                      : isPassed
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'bg-white border-gray-300 group-hover:border-indigo-300'
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {tone.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
