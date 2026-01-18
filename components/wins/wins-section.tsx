'use client';

import { useState } from 'react';
import { mockWins } from '@/lib/mock-data';
import { WinsCard } from './wins-card';
import { WinsModal } from './wins-modal';

export function WinsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6 border border-emerald-200/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vos gains ce mois</h2>
              <p className="text-sm text-gray-500">Grace a vos automations et actions</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Voir detail
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <WinsCard
            icon="💰"
            title="MRR sauve"
            mainValue={`${(mockWins.mrrSaved.amount / 1000).toFixed(1)}k€`}
            subValue={`${mockWins.mrrSaved.churnsAvoided} churns evites ${mockWins.mrrSaved.details}`}
            color="green"
          />
          <WinsCard
            icon="📈"
            title="Expansion"
            mainValue={`${mockWins.expansion.amount}€`}
            subValue={`${mockWins.expansion.upsellCount} upsells ${mockWins.expansion.source}`}
            color="blue"
          />
          <WinsCard
            icon="🔄"
            title="Paiements recuperes"
            mainValue={`${mockWins.paymentsRecovered.recovered}/${mockWins.paymentsRecovered.total}`}
            subValue={`${mockWins.paymentsRecovered.successRate}% de succes`}
            color="purple"
          />
          <WinsCard
            icon="👥"
            title="Trials convertis"
            mainValue={`${mockWins.trialsConverted.count}`}
            subValue={`+${mockWins.trialsConverted.vsWithoutAutomations} vs sans automations | +${(mockWins.trialsConverted.mrrGenerated / 1000).toFixed(1)}k€ MRR`}
            color="amber"
          />
          <WinsCard
            icon="⏰"
            title="Temps economise"
            mainValue={`~${mockWins.timeSaved.hours}h`}
            subValue={`${mockWins.timeSaved.actionsAutomated} actions automatisees`}
            color="cyan"
          />
        </div>
      </div>

      <WinsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
