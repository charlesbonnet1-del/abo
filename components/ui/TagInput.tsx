'use client';

import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  maxTags?: number;
}

export function TagInput({ value, onChange, placeholder = 'Appuyer Entrée pour ajouter', label, maxTags = 10 }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue && !value.includes(trimmedValue) && value.length < maxTags) {
        onChange([...value, trimmedValue]);
        setInputValue('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="border border-gray-200 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length >= maxTags ? 'Maximum atteint' : placeholder}
          disabled={value.length >= maxTags}
          className="w-full outline-none text-sm placeholder-gray-400 disabled:bg-transparent disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
