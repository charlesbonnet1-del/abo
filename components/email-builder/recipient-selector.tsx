'use client';

import { useState } from 'react';
import { EmailRecipient, RecipientType } from './types';
import { mockSegments, mockCohorts } from '@/lib/mock-data';

interface RecipientSelectorProps {
  selectedRecipients: EmailRecipient[];
  onSelectRecipients: (recipients: EmailRecipient[]) => void;
}

export function RecipientSelector({
  selectedRecipients,
  onSelectRecipients,
}: RecipientSelectorProps) {
  const [activeTab, setActiveTab] = useState<RecipientType>('segment');
  const [isOpen, setIsOpen] = useState(false);

  const segments: EmailRecipient[] = mockSegments.map((s) => ({
    type: 'segment' as const,
    id: s.id,
    name: s.name,
    count: s.userCount,
  }));

  const cohorts: EmailRecipient[] = mockCohorts.slice(0, 6).map((c) => ({
    type: 'cohort' as const,
    id: c.id,
    name: `Cohorte ${c.period}`,
    count: c.usersCount,
  }));

  const items = activeTab === 'segment' ? segments : cohorts;

  const toggleRecipient = (recipient: EmailRecipient) => {
    const exists = selectedRecipients.find(
      (r) => r.type === recipient.type && r.id === recipient.id
    );

    if (exists) {
      onSelectRecipients(
        selectedRecipients.filter(
          (r) => !(r.type === recipient.type && r.id === recipient.id)
        )
      );
    } else {
      onSelectRecipients([...selectedRecipients, recipient]);
    }
  };

  const isSelected = (recipient: EmailRecipient) =>
    selectedRecipients.some(
      (r) => r.type === recipient.type && r.id === recipient.id
    );

  const totalCount = selectedRecipients.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Destinataires
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {selectedRecipients.length === 0 ? (
          <span className="text-gray-500">Selectionner segments ou cohortes...</span>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {selectedRecipients.slice(0, 3).map((r) => (
                <span
                  key={`${r.type}-${r.id}`}
                  className={`px-2 py-1 text-xs rounded-full ${
                    r.type === 'segment'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {r.name}
                </span>
              ))}
              {selectedRecipients.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{selectedRecipients.length - 3}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{totalCount} users</span>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('segment')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'segment'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Segments ({segments.length})
              </button>
              <button
                onClick={() => setActiveTab('cohort')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'cohort'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Cohortes ({cohorts.length})
              </button>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto">
              {items.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => toggleRecipient(item)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                    isSelected(item) ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected(item)
                          ? activeTab === 'segment'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-emerald-600 bg-emerald-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected(item) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count} users</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedRecipients.length} selection(s) - {totalCount} users
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
              >
                Confirmer
              </button>
            </div>
          </div>
        </>
      )}

      {/* Selected recipients chips */}
      {selectedRecipients.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedRecipients.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                r.type === 'segment'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <span className="text-xs font-medium">{r.name}</span>
              <span className="text-xs opacity-70">({r.count})</span>
              <button
                onClick={() => toggleRecipient(r)}
                className="p-0.5 hover:bg-black/10 rounded"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
