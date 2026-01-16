'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextUser?: {
    name: string;
    email: string;
    status: string;
  } | null;
}

// Pre-defined coach responses based on keywords
const getCoachResponse = (message: string, contextUser?: CoachPanelProps['contextUser']): string => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('churn') || lowerMessage.includes('attrition')) {
    return `Pour réduire le churn, je recommande :\n\n1. **Identifier les signaux faibles** : Baisse d'activité, pas de connexion depuis 7+ jours\n2. **Automatiser les relances** : Email de "tu nous manques" + offre spéciale\n3. **Améliorer l'onboarding** : 40% du churn vient des 30 premiers jours\n4. **Proposer des downgrades** : Mieux vaut un plan moins cher qu'un churn\n\nTu veux que je génère un email de rétention personnalisé ?`;
  }

  if (lowerMessage.includes('risque') || lowerMessage.includes('risk')) {
    if (contextUser) {
      return `Pour ${contextUser.name}, voici mon analyse :\n\n⚠️ **Signaux d'alerte détectés :**\n- Baisse d'activité de 45% sur 2 semaines\n- Pas de nouvelles features utilisées\n- 2 tickets support non résolus\n\n**Actions recommandées :**\n1. Appel de check-in personnalisé\n2. Offrir une session de formation gratuite\n3. Proposer une extension de trial/crédit\n\nTu veux que je prépare un email de relance ?`;
    }
    return `J'ai identifié ${Math.floor(Math.random() * 5) + 3} users à risque cette semaine.\n\n**Causes principales :**\n- Baisse d'engagement (60%)\n- Paiements échoués (25%)\n- Inactivité prolongée (15%)\n\nTu veux voir la liste détaillée ou que je génère des emails de relance ?`;
  }

  if (lowerMessage.includes('email') || lowerMessage.includes('relance')) {
    return `Voici un template d'email de relance que tu peux personnaliser :\n\n---\n**Objet:** On peut en parler ?\n\nSalut {prénom},\n\nJ'ai remarqué que tu n'utilises plus [Produit] autant qu'avant. Est-ce qu'il y a quelque chose qu'on pourrait améliorer ?\n\nSi tu as 15 min cette semaine, je serais ravi d'en discuter.\n\n[Calendly]\n\n---\n\nTu veux que j'ajuste le ton ou le message ?`;
  }

  if (lowerMessage.includes('conversion') || lowerMessage.includes('trial')) {
    return `Pour améliorer ta conversion trial → paid :\n\n📊 **Ton taux actuel : ~24%** (moyenne marché: 15-25%)\n\n**Optimisations suggérées :**\n1. **Email J+1** : Valeur clé du produit\n2. **Email J+7** : Cas d'usage + témoignage\n3. **Email J-3** : Urgence + offre spéciale\n4. **In-app** : Progress bar d'onboarding\n\nTu veux que je crée une séquence d'emails automatisée ?`;
  }

  if (lowerMessage.includes('mrr') || lowerMessage.includes('revenu')) {
    return `Analyse de ton MRR :\n\n📈 **MRR actuel : 12 450€** (+8.5% vs mois dernier)\n\n**Décomposition :**\n- Nouveaux : +2 100€\n- Expansion : +450€\n- Churn : -650€\n- Contraction : -150€\n\n**Projection M+3 :** ~15 000€ si tendance maintenue\n\n💡 **Opportunité :** 12 users Growth pourraient passer Team (potentiel +840€/mois)`;
  }

  // Default response
  return `Je peux t'aider avec :\n\n• 📉 **Réduire le churn** - Identifier et retenir les users à risque\n• 📈 **Améliorer les conversions** - Optimiser trial → paid\n• ✉️ **Générer des emails** - Relance, onboarding, upgrade\n• 🎯 **Analyser un user** - Comprendre son comportement\n\nPose-moi ta question !`;
};

export function CoachPanel({ isOpen, onClose, contextUser }: CoachPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: contextUser
        ? `Je vois que tu regardes le profil de ${contextUser.name}. Comment puis-je t'aider avec ce user ?`
        : `Bonjour ! Je suis ton coach IA. Je peux t'aider à réduire ton churn, améliorer tes conversions, et optimiser ta stratégie d'abonnements.\n\nQu'est-ce que je peux faire pour toi ?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getCoachResponse(input, contextUser);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const quickActions = contextUser
    ? [
        'Analyse ce user',
        'Génère un email de relance',
        'Risque de churn ?',
      ]
    : [
        'Comment réduire mon churn ?',
        'Analyse mes users à risque',
        'Améliorer ma conversion trial',
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 md:bg-transparent"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-semibold">Coach Abo</h3>
              <p className="text-xs text-indigo-200">Ton assistant IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Context Banner */}
        {contextUser && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-700">
              📍 Contexte : <span className="font-medium">{contextUser.name}</span> ({contextUser.status})
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pose ta question..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
