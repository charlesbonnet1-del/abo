// Types
export type SubscriberStatus = 'active' | 'at_risk' | 'churned' | 'trial';

export type EventType = 'payment' | 'failed' | 'cancel' | 'note' | 'ai_comment' | 'subscription_start' | 'plan_change';

export interface Event {
  id: string;
  type: EventType;
  date: string;
  amount?: number;
  message?: string;
}

export interface Note {
  id: string;
  date: string;
  content: string;
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  plan: string;
  mrr: number;
  health: number;
  status: SubscriberStatus;
  since: string;
  nextPayment: string;
  cardExpiry?: string;
  ltv: number;
  tags: string[];
  notes: Note[];
  events: Event[];
}

export interface User {
  firstName: string;
  email: string;
  companyName: string;
}

export interface GlobalMetrics {
  mrr: number;
  mrrChange: number;
  totalSubscribers: number;
  subscribersChange: number;
  churnRate: number;
  churnRateChange: number;
  avgLtv: number;
  avgLtvChange: number;
}

export interface TodoAction {
  id: string;
  type: 'payment_failed' | 'anniversary' | 'trial_ending' | 'card_expiring';
  title: string;
  description: string;
  subscriberId: string;
  priority: 'high' | 'medium' | 'low';
}

// Mock User
export const currentUser: User = {
  firstName: 'Marie',
  email: 'marie@monproduit.io',
  companyName: 'MonProduit SaaS',
};

// Global Metrics
export const globalMetrics: GlobalMetrics = {
  mrr: 4850,
  mrrChange: 12.5,
  totalSubscribers: 47,
  subscribersChange: 8,
  churnRate: 3.2,
  churnRateChange: -0.8,
  avgLtv: 890,
  avgLtvChange: 5.2,
};

// Subscribers
export const subscribers: Subscriber[] = [
  {
    id: 'sub_001',
    name: 'Thomas Dubois',
    email: 'thomas@startup.io',
    plan: 'Pro',
    mrr: 49,
    health: 92,
    status: 'active',
    since: '2024-03-15',
    nextPayment: '2025-02-15',
    ltv: 588,
    tags: ['early-adopter', 'feedback-actif'],
    notes: [
      { id: 'n1', date: '2025-01-10', content: 'A demandé une feature de reporting avancé' },
      { id: 'n2', date: '2024-11-22', content: 'Très satisfait du support' },
    ],
    events: [
      { id: 'e1', type: 'payment', date: '2025-01-15', amount: 49 },
      { id: 'e2', type: 'ai_comment', date: '2025-01-12', message: 'Usage en hausse de 40% ce mois-ci. Client très engagé.' },
      { id: 'e3', type: 'payment', date: '2024-12-15', amount: 49 },
      { id: 'e4', type: 'payment', date: '2024-11-15', amount: 49 },
      { id: 'e5', type: 'subscription_start', date: '2024-03-15', message: 'Début abonnement Pro' },
    ],
  },
  {
    id: 'sub_002',
    name: 'Sophie Martin',
    email: 'sophie@agence-web.fr',
    plan: 'Business',
    mrr: 149,
    health: 45,
    status: 'at_risk',
    since: '2024-01-08',
    nextPayment: '2025-02-08',
    cardExpiry: '02/2025',
    ltv: 1937,
    tags: ['agence', 'multi-projets'],
    notes: [
      { id: 'n1', date: '2025-01-08', content: 'A mentionné regarder la concurrence' },
      { id: 'n2', date: '2024-12-15', content: 'Ticket support non résolu depuis 5 jours' },
    ],
    events: [
      { id: 'e1', type: 'ai_comment', date: '2025-01-14', message: 'Attention : connexions en baisse de 60%. Carte expire bientôt. Risque de churn élevé.' },
      { id: 'e2', type: 'payment', date: '2025-01-08', amount: 149 },
      { id: 'e3', type: 'note', date: '2025-01-08', message: 'Client frustré par temps de réponse support' },
      { id: 'e4', type: 'payment', date: '2024-12-08', amount: 149 },
      { id: 'e5', type: 'subscription_start', date: '2024-01-08', message: 'Début abonnement Business' },
    ],
  },
  {
    id: 'sub_003',
    name: 'Lucas Bernard',
    email: 'lucas@freelance.com',
    plan: 'Starter',
    mrr: 19,
    health: 78,
    status: 'active',
    since: '2024-06-22',
    nextPayment: '2025-02-22',
    ltv: 152,
    tags: ['freelance'],
    notes: [
      { id: 'n1', date: '2024-09-10', content: 'Intéressé par upgrade si croissance' },
    ],
    events: [
      { id: 'e1', type: 'payment', date: '2025-01-22', amount: 19 },
      { id: 'e2', type: 'payment', date: '2024-12-22', amount: 19 },
      { id: 'e3', type: 'subscription_start', date: '2024-06-22', message: 'Début abonnement Starter' },
    ],
  },
  {
    id: 'sub_004',
    name: 'Emma Petit',
    email: 'emma@ecommerce-shop.fr',
    plan: 'Pro',
    mrr: 49,
    health: 88,
    status: 'active',
    since: '2024-02-14',
    nextPayment: '2025-02-14',
    ltv: 588,
    tags: ['ecommerce', 'api-user'],
    notes: [
      { id: 'n1', date: '2025-01-05', content: '1 an d\'anniversaire le mois prochain!' },
    ],
    events: [
      { id: 'e1', type: 'payment', date: '2025-01-14', amount: 49 },
      { id: 'e2', type: 'ai_comment', date: '2025-01-10', message: 'Anniversaire 1 an dans 1 mois. Bon moment pour proposer upgrade ou récompense fidélité.' },
      { id: 'e3', type: 'payment', date: '2024-12-14', amount: 49 },
      { id: 'e4', type: 'subscription_start', date: '2024-02-14', message: 'Début abonnement Pro' },
    ],
  },
  {
    id: 'sub_005',
    name: 'Antoine Moreau',
    email: 'antoine@techcorp.io',
    plan: 'Business',
    mrr: 149,
    health: 95,
    status: 'active',
    since: '2023-11-20',
    nextPayment: '2025-02-20',
    ltv: 2235,
    tags: ['enterprise', 'champion'],
    notes: [
      { id: 'n1', date: '2024-12-01', content: 'A recommandé 2 autres clients' },
      { id: 'n2', date: '2024-08-15', content: 'Super satisfait, veut étude de cas' },
    ],
    events: [
      { id: 'e1', type: 'payment', date: '2025-01-20', amount: 149 },
      { id: 'e2', type: 'ai_comment', date: '2025-01-18', message: 'Client ambassadeur idéal. A référé 2 clients. Proposer programme de parrainage.' },
      { id: 'e3', type: 'payment', date: '2024-12-20', amount: 149 },
      { id: 'e4', type: 'plan_change', date: '2024-06-20', message: 'Upgrade Pro → Business' },
      { id: 'e5', type: 'subscription_start', date: '2023-11-20', message: 'Début abonnement Pro' },
    ],
  },
  {
    id: 'sub_006',
    name: 'Julie Leroy',
    email: 'julie@startup-rh.com',
    plan: 'Pro',
    mrr: 0,
    health: 65,
    status: 'trial',
    since: '2025-01-05',
    nextPayment: '2025-02-05',
    ltv: 0,
    tags: ['trial', 'rh-tech'],
    notes: [
      { id: 'n1', date: '2025-01-12', content: 'A posé beaucoup de questions sur l\'intégration' },
    ],
    events: [
      { id: 'e1', type: 'ai_comment', date: '2025-01-14', message: 'Trial se termine dans 3 semaines. Usage modéré. Envoyer guide d\'onboarding.' },
      { id: 'e2', type: 'subscription_start', date: '2025-01-05', message: 'Début période d\'essai Pro' },
    ],
  },
  {
    id: 'sub_007',
    name: 'Marc Dupont',
    email: 'marc@consultant.fr',
    plan: 'Starter',
    mrr: 19,
    health: 32,
    status: 'at_risk',
    since: '2024-04-10',
    nextPayment: '2025-02-10',
    ltv: 190,
    tags: ['consultant'],
    notes: [
      { id: 'n1', date: '2025-01-05', content: 'Paiement échoué ce matin' },
    ],
    events: [
      { id: 'e1', type: 'failed', date: '2025-01-10', amount: 19, message: 'Paiement échoué - Fonds insuffisants' },
      { id: 'e2', type: 'ai_comment', date: '2025-01-10', message: 'Paiement échoué. Relancer rapidement pour éviter interruption de service.' },
      { id: 'e3', type: 'payment', date: '2024-12-10', amount: 19 },
      { id: 'e4', type: 'payment', date: '2024-11-10', amount: 19 },
      { id: 'e5', type: 'subscription_start', date: '2024-04-10', message: 'Début abonnement Starter' },
    ],
  },
  {
    id: 'sub_008',
    name: 'Camille Rousseau',
    email: 'camille@design-studio.fr',
    plan: 'Pro',
    mrr: 0,
    health: 0,
    status: 'churned',
    since: '2024-02-28',
    nextPayment: '-',
    ltv: 490,
    tags: ['design', 'churned'],
    notes: [
      { id: 'n1', date: '2024-12-28', content: 'A annulé car pas assez de temps pour utiliser' },
    ],
    events: [
      { id: 'e1', type: 'cancel', date: '2024-12-28', message: 'Abonnement annulé par le client' },
      { id: 'e2', type: 'ai_comment', date: '2024-12-28', message: 'Churn évitable ? Client peu engagé depuis 2 mois. Recontacter dans 3 mois.' },
      { id: 'e3', type: 'payment', date: '2024-11-28', amount: 49 },
      { id: 'e4', type: 'subscription_start', date: '2024-02-28', message: 'Début abonnement Pro' },
    ],
  },
  {
    id: 'sub_009',
    name: 'Pierre Lambert',
    email: 'pierre@saas-analytics.io',
    plan: 'Business',
    mrr: 149,
    health: 85,
    status: 'active',
    since: '2024-05-15',
    nextPayment: '2025-02-15',
    ltv: 1341,
    tags: ['analytics', 'tech-savvy'],
    notes: [
      { id: 'n1', date: '2024-10-20', content: 'Utilise beaucoup l\'API' },
    ],
    events: [
      { id: 'e1', type: 'payment', date: '2025-01-15', amount: 149 },
      { id: 'e2', type: 'payment', date: '2024-12-15', amount: 149 },
      { id: 'e3', type: 'plan_change', date: '2024-09-15', message: 'Upgrade Pro → Business' },
      { id: 'e4', type: 'subscription_start', date: '2024-05-15', message: 'Début abonnement Pro' },
    ],
  },
  {
    id: 'sub_010',
    name: 'Claire Fontaine',
    email: 'claire@coaching-pro.fr',
    plan: 'Starter',
    mrr: 0,
    health: 72,
    status: 'trial',
    since: '2025-01-10',
    nextPayment: '2025-02-10',
    ltv: 0,
    tags: ['trial', 'coaching'],
    notes: [],
    events: [
      { id: 'e1', type: 'ai_comment', date: '2025-01-14', message: 'Nouveau trial. Bon engagement initial. Surveiller conversion.' },
      { id: 'e2', type: 'subscription_start', date: '2025-01-10', message: 'Début période d\'essai Starter' },
    ],
  },
];

// Today's Actions
export const todayActions: TodoAction[] = [
  {
    id: 'action_001',
    type: 'payment_failed',
    title: 'Paiement échoué',
    description: 'Marc Dupont - 19€ - Fonds insuffisants',
    subscriberId: 'sub_007',
    priority: 'high',
  },
  {
    id: 'action_002',
    type: 'anniversary',
    title: 'Anniversaire 1 an',
    description: 'Emma Petit fête bientôt 1 an d\'abonnement',
    subscriberId: 'sub_004',
    priority: 'medium',
  },
  {
    id: 'action_003',
    type: 'trial_ending',
    title: 'Fin de trial',
    description: 'Julie Leroy - Trial Pro se termine dans 3 semaines',
    subscriberId: 'sub_006',
    priority: 'medium',
  },
  {
    id: 'action_004',
    type: 'card_expiring',
    title: 'CB expire bientôt',
    description: 'Sophie Martin - Carte expire en février',
    subscriberId: 'sub_002',
    priority: 'high',
  },
];

// AI Insight for dashboard
export const aiInsight = {
  title: 'Ce que je remarque',
  message: 'Sophie Martin (Business, 149€/mois) montre des signes de désengagement : -60% de connexions ce mois, ticket support ouvert depuis 5 jours, et elle a mentionné regarder la concurrence. Sa carte expire aussi en février. Je te recommande de la contacter personnellement cette semaine.',
  subscriberId: 'sub_002',
};

// Coach conversation
export const coachConversation = [
  {
    id: 'msg_001',
    role: 'user' as const,
    content: 'Comment je peux réduire mon churn rate ?',
    timestamp: '10:30',
  },
  {
    id: 'msg_002',
    role: 'assistant' as const,
    content: `Ton churn rate actuel est de 3.2%, ce qui est correct mais peut être amélioré. Voici ce que je te suggère en priorité :

1. **Sophie Martin** est ton plus gros risque ce mois-ci (149€/mois). Elle cumule plusieurs signaux d'alerte. Je te recommande un appel cette semaine.

2. **Marc Dupont** a un paiement échoué depuis 5 jours. Une relance personnalisée avec un lien de mise à jour CB serait efficace.

3. Pour les trials (Julie et Claire), envoie un email d'onboarding avec tes 3 features clés.

Tu veux que je te prépare un template d'email pour Sophie ?`,
    timestamp: '10:31',
  },
  {
    id: 'msg_003',
    role: 'user' as const,
    content: 'Oui, prépare-moi un email pour Sophie',
    timestamp: '10:32',
  },
  {
    id: 'msg_004',
    role: 'assistant' as const,
    content: `Voici un template personnalisé pour Sophie :

---

**Objet :** Sophie, on peut faire mieux pour toi

Salut Sophie,

Je voulais prendre de tes nouvelles directement. J'ai vu que tu avais un ticket ouvert depuis quelques jours et je m'en excuse — ce n'est pas le niveau de service que tu mérites avec ton plan Business.

Est-ce que tu aurais 15 minutes cette semaine pour qu'on en parle ? Je veux m'assurer qu'on répond vraiment à tes besoins.

À très vite,
Marie

---

*Conseil : Envoie-le depuis ton email perso, pas un email automatique. Le taux de réponse est 3x meilleur.*`,
    timestamp: '10:33',
  },
];

export const coachSuggestions = [
  'Qui sont mes clients les plus fidèles ?',
  'Comment améliorer ma conversion trial → payant ?',
  'Quels clients pourraient upgrader ?',
  'Analyse mon MRR du dernier trimestre',
];

// Onboarding checklist
export const onboardingChecklist = [
  {
    id: 'step_001',
    title: 'Connecter Stripe',
    description: 'Synchronise tes abonnés et paiements',
    completed: true,
    action: 'Connecté',
  },
  {
    id: 'step_002',
    title: 'Définir tes plans',
    description: 'Configure Starter, Pro, Business...',
    completed: false,
    action: 'Configurer',
  },
  {
    id: 'step_003',
    title: 'Personnaliser les scores de santé',
    description: 'Ajuste les critères selon ton business',
    completed: false,
    action: 'Personnaliser',
  },
  {
    id: 'step_004',
    title: 'Créer ton email de bienvenue',
    description: 'Premier contact avec tes nouveaux abonnés',
    completed: false,
    action: 'Créer',
  },
  {
    id: 'step_005',
    title: 'Configurer les alertes de relance',
    description: 'Ne rate plus jamais un paiement échoué',
    completed: false,
    action: 'Configurer',
  },
];

// Helper functions
export function getSubscriberById(id: string): Subscriber | undefined {
  return subscribers.find((s) => s.id === id);
}

export function getSubscribersByStatus(status: SubscriberStatus): Subscriber[] {
  return subscribers.filter((s) => s.status === status);
}

export function getStatusColor(status: SubscriberStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'at_risk':
      return 'bg-yellow-500';
    case 'churned':
      return 'bg-gray-500';
    case 'trial':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusEmoji(status: SubscriberStatus): string {
  switch (status) {
    case 'active':
      return '🟢';
    case 'at_risk':
      return '🟡';
    case 'churned':
      return '⚫';
    case 'trial':
      return '🔵';
    default:
      return '⚪';
  }
}

export function getStatusLabel(status: SubscriberStatus): string {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'at_risk':
      return 'À risque';
    case 'churned':
      return 'Churné';
    case 'trial':
      return 'Trial';
    default:
      return status;
  }
}

export function getHealthColor(health: number): string {
  if (health >= 80) return 'text-green-600';
  if (health >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function formatDate(dateString: string): string {
  if (dateString === '-') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
