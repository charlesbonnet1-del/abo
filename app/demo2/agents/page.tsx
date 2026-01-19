'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

interface Agent {
  id: string;
  name: string;
  description: string;
  color: 'blue' | 'emerald' | 'amber';
  icon: string;
  enabled: boolean;
  stats: {
    primary: { label: string; value: string };
    secondary: { label: string; value: string };
    revenue: { label: string; value: string };
  };
  recentActions: {
    text: string;
    timestamp: string;
    result: 'success' | 'pending' | 'failed';
  }[];
  instructions: string;
}

const initialAgents: Agent[] = [
  {
    id: 'conversion',
    name: 'Conversion Agent',
    description: 'Convertit les utilisateurs Freemium et Trial en clients payants grace a des offres personnalisees et un nurturing intelligent.',
    color: 'blue',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    enabled: true,
    stats: {
      primary: { label: 'Conversions ce mois', value: '12' },
      secondary: { label: 'Taux de conversion', value: '34%' },
      revenue: { label: 'MRR genere', value: '+348€' },
    },
    recentActions: [
      { text: 'Offre acceptee par Lucas (Trial J+12)', timestamp: 'Il y a 1h', result: 'success' },
      { text: 'Email nurturing envoye a Pierre', timestamp: 'Il y a 4h', result: 'success' },
      { text: 'Offre envoyee a Marie (Freemium)', timestamp: 'Il y a 6h', result: 'pending' },
    ],
    instructions: 'Adopte un ton amical et professionnel. Mets en avant la valeur ajoutee plutot que le prix. Propose des essais gratuits prolonges avant de proposer une reduction.',
  },
  {
    id: 'retention',
    name: 'Retention Agent',
    description: 'Detecte les signaux de churn et intervient proactivement pour retenir les utilisateurs a risque.',
    color: 'emerald',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    enabled: true,
    stats: {
      primary: { label: 'Churns evites', value: '5' },
      secondary: { label: 'Utilisateurs sauves', value: '71%' },
      revenue: { label: 'MRR preserve', value: '245€' },
    },
    recentActions: [
      { text: 'Email de support envoye a Marc (Score 28)', timestamp: 'Il y a 2 min', result: 'success' },
      { text: 'Risque detecte pour Marie (Score 35)', timestamp: 'Il y a 2h', result: 'pending' },
      { text: 'Appel programme avec Sophie', timestamp: 'Hier', result: 'success' },
    ],
    instructions: 'Sois empathique et solution-oriented. Propose de l\'aide technique avant les reductions. Escalade vers un humain si le score tombe sous 20.',
  },
  {
    id: 'recovery',
    name: 'Recovery Agent',
    description: 'Gere automatiquement les echecs de paiement et recupere le revenu perdu.',
    color: 'amber',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    enabled: true,
    stats: {
      primary: { label: 'Paiements recuperes', value: '8' },
      secondary: { label: 'Taux de recuperation', value: '73%' },
      revenue: { label: 'Revenue recupere', value: '1,247€' },
    },
    recentActions: [
      { text: 'Paiement recupere pour Sophie (+49€)', timestamp: 'Il y a 15 min', result: 'success' },
      { text: 'Echec - CB invalide pour Jean', timestamp: 'Il y a 3h', result: 'failed' },
      { text: 'Relance envoyee a Thomas', timestamp: 'Il y a 5h', result: 'pending' },
    ],
    instructions: 'Reste neutre et informatif. Rappelle la valeur du service. Propose des solutions alternatives (autre CB, PayPal). Maximum 3 relances par echec.',
  },
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'bg-blue-100 text-blue-600',
    toggle: 'bg-blue-600',
    light: 'bg-blue-100',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: 'bg-emerald-100 text-emerald-600',
    toggle: 'bg-emerald-600',
    light: 'bg-emerald-100',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'bg-amber-100 text-amber-600',
    toggle: 'bg-amber-600',
    light: 'bg-amber-100',
  },
};

const resultColors = {
  success: 'text-emerald-600',
  pending: 'text-amber-600',
  failed: 'text-red-500',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const toggleAgent = (id: string) => {
    setAgents(agents.map(agent =>
      agent.id === id ? { ...agent, enabled: !agent.enabled } : agent
    ));
  };

  const activeCount = agents.filter(a => a.enabled).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
          <p className="text-slate-500 mt-1">Configure tes agents autonomes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-600">{activeCount} agent{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Global Stats */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 mb-8 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-1">Actions ce mois</p>
            <p className="text-3xl font-bold">156</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Taux de succes</p>
            <p className="text-3xl font-bold">78%</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Revenue impact</p>
            <p className="text-3xl font-bold text-emerald-400">+1,840€</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Temps economise</p>
            <p className="text-3xl font-bold">12h</p>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="space-y-6">
        {agents.map((agent) => {
          const colors = colorClasses[agent.color];
          const isExpanded = expandedAgent === agent.id;

          return (
            <Card key={agent.id} className={`overflow-hidden transition-all ${!agent.enabled ? 'opacity-60' : ''}`}>
              {/* Agent Header */}
              <div className={`p-6 ${colors.bg} border-b ${colors.border}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={agent.icon} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{agent.name}</h2>
                      <p className="text-sm text-slate-600 mt-1 max-w-xl">{agent.description}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      agent.enabled ? colors.toggle : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        agent.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{agent.stats.primary.label}</p>
                    <p className={`text-2xl font-bold ${colors.text}`}>{agent.stats.primary.value}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{agent.stats.secondary.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{agent.stats.secondary.value}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{agent.stats.revenue.label}</p>
                    <p className="text-2xl font-bold text-emerald-600">{agent.stats.revenue.value}</p>
                  </div>
                </div>
              </div>

              {/* Recent Actions & Settings */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-900">Actions recentes</h3>
                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    {isExpanded ? 'Masquer les instructions' : 'Voir les instructions'}
                  </button>
                </div>

                <div className="space-y-3">
                  {agent.recentActions.map((action, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          action.result === 'success' ? 'bg-emerald-500' :
                          action.result === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-slate-700">{action.text}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${resultColors[action.result]}`}>
                          {action.result === 'success' ? 'Succes' : action.result === 'pending' ? 'En cours' : 'Echec'}
                        </span>
                        <span className="text-xs text-slate-400">{action.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expandable Instructions */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-medium text-slate-900 mb-3">Instructions contextuelles</h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 italic">&quot;{agent.instructions}&quot;</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      Ces instructions guident le ton et le comportement de l&apos;agent. Modifie-les dans les parametres.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="mt-8 p-4 bg-slate-100 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-slate-600">
              Les agents fonctionnent de maniere <strong>autonome</strong>. Ils analysent tes donnees en temps reel
              et executent des actions basees sur leurs instructions et les meilleures pratiques.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Tu gardes le controle total : active/desactive chaque agent, ajuste les instructions, et revois l&apos;historique des actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
