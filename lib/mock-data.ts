// Types
export type UserStatus = 'freemium' | 'trial' | 'active' | 'at_risk' | 'churned';
export type PlanType = 'free' | 'starter' | 'growth' | 'team' | 'scale';

export interface MockEvent {
  id: string;
  type: 'payment_success' | 'payment_failed' | 'subscription_created' | 'subscription_canceled' | 'login' | 'feature_used' | 'limit_reached' | 'email_sent' | 'email_opened';
  description: string;
  occurredAt: string;
  metadata?: Record<string, string | number>;
}

export interface MockNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  status: UserStatus;
  plan: PlanType;
  mrr: number;
  ltv: number;
  healthScore: number;
  createdAt: string;
  lastSeenAt: string;
  trialEndsAt?: string;
  cardExpiresAt?: string;
  events: MockEvent[];
  notes: MockNote[];
  tags: string[];
  features: Record<string, boolean>;
  limits: Record<string, { current: number; max: number }>;
}

export interface MockAlert {
  id: string;
  userId: string;
  type: 'payment_failed' | 'trial_ending' | 'churn_risk' | 'card_expiring' | 'milestone' | 'limit_approaching';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  seen: boolean;
  createdAt: string;
}

export interface MockEmail {
  id: string;
  userId: string;
  subject: string;
  status: 'draft' | 'sent' | 'opened' | 'clicked';
  sentAt?: string;
  openedAt?: string;
  template: string;
}

// Helper functions
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// Mock Users (20 total)
export const mockUsers: MockUser[] = [
  // 6 Freemium users
  {
    id: 'usr_1',
    email: 'marc.dubois@gmail.com',
    name: 'Marc Dubois',
    company: 'Freelance',
    status: 'freemium',
    plan: 'free',
    mrr: 0,
    ltv: 0,
    healthScore: 75,
    createdAt: daysAgo(45),
    lastSeenAt: hoursAgo(2),
    events: [
      { id: 'evt_1_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(2) },
      { id: 'evt_1_2', type: 'feature_used', description: 'Export PDF utilisé', occurredAt: hoursAgo(5), metadata: { feature: 'export_pdf' } },
      { id: 'evt_1_3', type: 'login', description: 'Connexion', occurredAt: daysAgo(1) },
    ],
    notes: [{ id: 'note_1_1', content: 'User très actif, potentiel upgrade', createdAt: daysAgo(5) }],
    tags: ['actif', 'potentiel-upgrade'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 2, max: 3 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_2',
    email: 'sophie.martin@outlook.com',
    name: 'Sophie Martin',
    status: 'freemium',
    plan: 'free',
    mrr: 0,
    ltv: 0,
    healthScore: 45,
    createdAt: daysAgo(30),
    lastSeenAt: daysAgo(7),
    events: [
      { id: 'evt_2_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(7) },
    ],
    notes: [],
    tags: [],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 1, max: 3 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_3',
    email: 'pierre.leroy@free.fr',
    name: 'Pierre Leroy',
    company: 'Leroy Consulting',
    status: 'freemium',
    plan: 'free',
    mrr: 0,
    ltv: 0,
    healthScore: 82,
    createdAt: daysAgo(60),
    lastSeenAt: hoursAgo(12),
    events: [
      { id: 'evt_3_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(12) },
      { id: 'evt_3_2', type: 'feature_used', description: 'Dashboard consulté', occurredAt: hoursAgo(12) },
      { id: 'evt_3_3', type: 'limit_reached', description: 'Limite projets atteinte', occurredAt: daysAgo(2) },
    ],
    notes: [{ id: 'note_3_1', content: 'A atteint la limite, lui proposer upgrade', createdAt: daysAgo(2) }],
    tags: ['limite-atteinte', 'hot-lead'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 3, max: 3 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_4',
    email: 'julie.bernard@yahoo.fr',
    name: 'Julie Bernard',
    status: 'freemium',
    plan: 'free',
    mrr: 0,
    ltv: 0,
    healthScore: 20,
    createdAt: daysAgo(90),
    lastSeenAt: daysAgo(45),
    events: [
      { id: 'evt_4_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(45) },
    ],
    notes: [],
    tags: ['inactif'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 0, max: 3 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_5',
    email: 'thomas.petit@gmail.com',
    name: 'Thomas Petit',
    company: 'Petit Tech',
    status: 'freemium',
    plan: 'free',
    mrr: 0,
    ltv: 0,
    healthScore: 65,
    createdAt: daysAgo(15),
    lastSeenAt: daysAgo(3),
    events: [
      { id: 'evt_5_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(3) },
      { id: 'evt_5_2', type: 'feature_used', description: 'Export utilisé', occurredAt: daysAgo(3) },
    ],
    notes: [],
    tags: [],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 2, max: 3 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_6',
    email: 'emma.richard@proton.me',
    name: 'Emma Richard',
    status: 'freemium',
    plan: 'free',
    mrr: 0,
    ltv: 0,
    healthScore: 55,
    createdAt: daysAgo(20),
    lastSeenAt: daysAgo(5),
    events: [
      { id: 'evt_6_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(5) },
    ],
    notes: [],
    tags: [],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 1, max: 3 }, members: { current: 1, max: 1 } },
  },

  // 3 Trial users
  {
    id: 'usr_7',
    email: 'paul.moreau@acme.io',
    name: 'Paul Moreau',
    company: 'Acme Corp',
    status: 'trial',
    plan: 'growth',
    mrr: 0,
    ltv: 0,
    healthScore: 88,
    createdAt: daysAgo(12),
    lastSeenAt: hoursAgo(1),
    trialEndsAt: daysFromNow(2),
    events: [
      { id: 'evt_7_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(1) },
      { id: 'evt_7_2', type: 'feature_used', description: 'API testée', occurredAt: hoursAgo(3), metadata: { feature: 'api_access' } },
      { id: 'evt_7_3', type: 'subscription_created', description: 'Trial Growth démarré', occurredAt: daysAgo(12) },
    ],
    notes: [{ id: 'note_7_1', content: 'Très engagé, trial expire bientôt', createdAt: daysAgo(1) }],
    tags: ['trial-hot', 'tech-savvy'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: false },
    limits: { projects: { current: 8, max: 50 }, members: { current: 3, max: 5 } },
  },
  {
    id: 'usr_8',
    email: 'claire.dupont@startup.fr',
    name: 'Claire Dupont',
    company: 'StartupXYZ',
    status: 'trial',
    plan: 'starter',
    mrr: 0,
    ltv: 0,
    healthScore: 60,
    createdAt: daysAgo(7),
    lastSeenAt: daysAgo(2),
    trialEndsAt: daysFromNow(7),
    events: [
      { id: 'evt_8_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(2) },
      { id: 'evt_8_2', type: 'subscription_created', description: 'Trial Starter démarré', occurredAt: daysAgo(7) },
    ],
    notes: [],
    tags: ['trial'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 4, max: 10 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_9',
    email: 'lucas.simon@enterprise.com',
    name: 'Lucas Simon',
    company: 'Enterprise Solutions',
    status: 'trial',
    plan: 'team',
    mrr: 0,
    ltv: 0,
    healthScore: 72,
    createdAt: daysAgo(5),
    lastSeenAt: hoursAgo(6),
    trialEndsAt: daysFromNow(9),
    events: [
      { id: 'evt_9_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(6) },
      { id: 'evt_9_2', type: 'feature_used', description: 'Membres ajoutés', occurredAt: daysAgo(1) },
      { id: 'evt_9_3', type: 'subscription_created', description: 'Trial Team démarré', occurredAt: daysAgo(5) },
    ],
    notes: [{ id: 'note_9_1', content: 'Potentiel gros compte, à suivre', createdAt: daysAgo(3) }],
    tags: ['enterprise', 'trial'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: true },
    limits: { projects: { current: 15, max: 200 }, members: { current: 5, max: 20 } },
  },

  // 7 Active users
  {
    id: 'usr_10',
    email: 'marie.lambert@techcorp.fr',
    name: 'Marie Lambert',
    company: 'TechCorp',
    status: 'active',
    plan: 'growth',
    mrr: 79,
    ltv: 948,
    healthScore: 92,
    createdAt: daysAgo(365),
    lastSeenAt: hoursAgo(1),
    events: [
      { id: 'evt_10_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(1) },
      { id: 'evt_10_2', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(5), metadata: { amount: 79 } },
      { id: 'evt_10_3', type: 'feature_used', description: 'API utilisée', occurredAt: daysAgo(1) },
    ],
    notes: [{ id: 'note_10_1', content: 'Cliente fidèle depuis 1 an!', createdAt: daysAgo(30) }],
    tags: ['fidele', 'power-user', 'ambassadeur'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: false },
    limits: { projects: { current: 35, max: 50 }, members: { current: 4, max: 5 } },
  },
  {
    id: 'usr_11',
    email: 'antoine.garcia@agence.com',
    name: 'Antoine Garcia',
    company: 'Agence Digitale',
    status: 'active',
    plan: 'team',
    mrr: 149,
    ltv: 1788,
    healthScore: 85,
    createdAt: daysAgo(400),
    lastSeenAt: hoursAgo(4),
    events: [
      { id: 'evt_11_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(4) },
      { id: 'evt_11_2', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(3), metadata: { amount: 149 } },
    ],
    notes: [],
    tags: ['agence', 'team'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: true },
    limits: { projects: { current: 120, max: 200 }, members: { current: 12, max: 20 } },
  },
  {
    id: 'usr_12',
    email: 'lea.martinez@company.com',
    name: 'Léa Martinez',
    company: 'Company SA',
    status: 'active',
    plan: 'starter',
    mrr: 29,
    ltv: 348,
    healthScore: 78,
    createdAt: daysAgo(365),
    lastSeenAt: daysAgo(1),
    events: [
      { id: 'evt_12_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(1) },
      { id: 'evt_12_2', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(10), metadata: { amount: 29 } },
    ],
    notes: [{ id: 'note_12_1', content: '1 an d\'abonnement, envoyer email félicitations', createdAt: daysAgo(2) }],
    tags: ['anniversaire-1an'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 8, max: 10 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_13',
    email: 'hugo.robert@dev.io',
    name: 'Hugo Robert',
    company: 'DevStudio',
    status: 'active',
    plan: 'growth',
    mrr: 79,
    ltv: 553,
    healthScore: 88,
    createdAt: daysAgo(210),
    lastSeenAt: hoursAgo(8),
    events: [
      { id: 'evt_13_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(8) },
      { id: 'evt_13_2', type: 'feature_used', description: 'API très utilisée', occurredAt: hoursAgo(8) },
      { id: 'evt_13_3', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(15), metadata: { amount: 79 } },
    ],
    notes: [],
    tags: ['api-heavy', 'developer'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: false },
    limits: { projects: { current: 42, max: 50 }, members: { current: 5, max: 5 } },
  },
  {
    id: 'usr_14',
    email: 'camille.thomas@media.fr',
    name: 'Camille Thomas',
    company: 'Media Plus',
    status: 'active',
    plan: 'scale',
    mrr: 299,
    ltv: 3588,
    healthScore: 95,
    createdAt: daysAgo(400),
    lastSeenAt: hoursAgo(2),
    events: [
      { id: 'evt_14_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(2) },
      { id: 'evt_14_2', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(1), metadata: { amount: 299 } },
    ],
    notes: [{ id: 'note_14_1', content: 'Compte enterprise, support prioritaire', createdAt: daysAgo(100) }],
    tags: ['enterprise', 'vip', 'scale'],
    features: { export_pdf: true, api_access: true, sso: true, priority_support: true },
    limits: { projects: { current: 450, max: 9999 }, members: { current: 35, max: 9999 } },
  },
  {
    id: 'usr_15',
    email: 'nathan.durand@shop.com',
    name: 'Nathan Durand',
    company: 'E-Shop Pro',
    status: 'active',
    plan: 'starter',
    mrr: 29,
    ltv: 174,
    healthScore: 70,
    createdAt: daysAgo(180),
    lastSeenAt: daysAgo(3),
    events: [
      { id: 'evt_15_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(3) },
      { id: 'evt_15_2', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(20), metadata: { amount: 29 } },
    ],
    notes: [],
    tags: ['ecommerce'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 6, max: 10 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_16',
    email: 'ines.morel@consulting.fr',
    name: 'Inès Morel',
    company: 'Morel Consulting',
    status: 'active',
    plan: 'team',
    mrr: 149,
    ltv: 894,
    healthScore: 82,
    createdAt: daysAgo(180),
    lastSeenAt: hoursAgo(12),
    events: [
      { id: 'evt_16_1', type: 'login', description: 'Connexion', occurredAt: hoursAgo(12) },
      { id: 'evt_16_2', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(8), metadata: { amount: 149 } },
    ],
    notes: [],
    tags: ['consulting', 'team'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: true },
    limits: { projects: { current: 85, max: 200 }, members: { current: 15, max: 20 } },
  },

  // 2 At Risk users
  {
    id: 'usr_17',
    email: 'marie@startup.fr',
    name: 'Marie Lefebvre',
    company: 'Startup Innovante',
    status: 'at_risk',
    plan: 'growth',
    mrr: 79,
    ltv: 316,
    healthScore: 25,
    createdAt: daysAgo(120),
    lastSeenAt: daysAgo(15),
    cardExpiresAt: daysFromNow(5),
    events: [
      { id: 'evt_17_1', type: 'payment_failed', description: 'Paiement échoué (3ème tentative)', occurredAt: daysAgo(3), metadata: { amount: 79, attempt: 3 } },
      { id: 'evt_17_2', type: 'payment_failed', description: 'Paiement échoué (2ème tentative)', occurredAt: daysAgo(5), metadata: { amount: 79, attempt: 2 } },
      { id: 'evt_17_3', type: 'payment_failed', description: 'Paiement échoué', occurredAt: daysAgo(7), metadata: { amount: 79, attempt: 1 } },
      { id: 'evt_17_4', type: 'login', description: 'Connexion', occurredAt: daysAgo(15) },
    ],
    notes: [
      { id: 'note_17_1', content: '3 paiements échoués, à contacter en urgence', createdAt: daysAgo(3) },
      { id: 'note_17_2', content: 'Tentative appel - pas de réponse', createdAt: daysAgo(1) },
    ],
    tags: ['paiement-echec', 'urgent', 'churn-risk'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: false },
    limits: { projects: { current: 28, max: 50 }, members: { current: 3, max: 5 } },
  },
  {
    id: 'usr_18',
    email: 'julien.blanc@corp.io',
    name: 'Julien Blanc',
    company: 'Corp International',
    status: 'at_risk',
    plan: 'team',
    mrr: 149,
    ltv: 596,
    healthScore: 35,
    createdAt: daysAgo(120),
    lastSeenAt: daysAgo(30),
    events: [
      { id: 'evt_18_1', type: 'login', description: 'Connexion', occurredAt: daysAgo(30) },
      { id: 'evt_18_2', type: 'payment_success', description: 'Paiement réussi', occurredAt: daysAgo(35), metadata: { amount: 149 } },
    ],
    notes: [{ id: 'note_18_1', content: 'Inactif depuis 1 mois, envoyer email de réengagement', createdAt: daysAgo(7) }],
    tags: ['inactif', 'churn-risk'],
    features: { export_pdf: true, api_access: true, sso: false, priority_support: true },
    limits: { projects: { current: 45, max: 200 }, members: { current: 8, max: 20 } },
  },

  // 2 Churned users
  {
    id: 'usr_19',
    email: 'alex.martin@oldclient.com',
    name: 'Alexandre Martin',
    company: 'Old Client SA',
    status: 'churned',
    plan: 'free',
    mrr: 0,
    ltv: 348,
    healthScore: 0,
    createdAt: daysAgo(400),
    lastSeenAt: daysAgo(45),
    events: [
      { id: 'evt_19_1', type: 'subscription_canceled', description: 'Abonnement annulé', occurredAt: daysAgo(30) },
      { id: 'evt_19_2', type: 'login', description: 'Dernière connexion', occurredAt: daysAgo(45) },
    ],
    notes: [{ id: 'note_19_1', content: 'A annulé car trop cher pour lui', createdAt: daysAgo(30) }],
    tags: ['churned', 'price-sensitive'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 0, max: 3 }, members: { current: 1, max: 1 } },
  },
  {
    id: 'usr_20',
    email: 'sarah.cohen@excompany.fr',
    name: 'Sarah Cohen',
    company: 'Ex Company',
    status: 'churned',
    plan: 'free',
    mrr: 0,
    ltv: 174,
    healthScore: 0,
    createdAt: daysAgo(250),
    lastSeenAt: daysAgo(60),
    events: [
      { id: 'evt_20_1', type: 'subscription_canceled', description: 'Abonnement annulé', occurredAt: daysAgo(45) },
      { id: 'evt_20_2', type: 'login', description: 'Dernière connexion', occurredAt: daysAgo(60) },
    ],
    notes: [{ id: 'note_20_1', content: 'Entreprise fermée', createdAt: daysAgo(45) }],
    tags: ['churned'],
    features: { export_pdf: true, api_access: false, sso: false, priority_support: false },
    limits: { projects: { current: 0, max: 3 }, members: { current: 1, max: 1 } },
  },
];

// Mock Alerts (15 alerts)
export const mockAlerts: MockAlert[] = [
  {
    id: 'alert_1',
    userId: 'usr_17',
    type: 'payment_failed',
    message: 'Paiement échoué — marie@startup.fr — 3ème tentative échouée. Risque de churn imminent.',
    severity: 'critical',
    seen: false,
    createdAt: hoursAgo(2),
  },
  {
    id: 'alert_2',
    userId: 'usr_7',
    type: 'trial_ending',
    message: 'Trial expire dans 2 jours — paul.moreau@acme.io — User très engagé, forte probabilité de conversion.',
    severity: 'warning',
    seen: false,
    createdAt: hoursAgo(5),
  },
  {
    id: 'alert_3',
    userId: 'usr_18',
    type: 'churn_risk',
    message: 'Inactif depuis 30 jours — julien.blanc@corp.io — Aucune connexion, risque de churn.',
    severity: 'warning',
    seen: false,
    createdAt: hoursAgo(12),
  },
  {
    id: 'alert_4',
    userId: 'usr_17',
    type: 'card_expiring',
    message: 'Carte expire dans 5 jours — marie@startup.fr — Déjà en échec de paiement.',
    severity: 'critical',
    seen: false,
    createdAt: hoursAgo(24),
  },
  {
    id: 'alert_5',
    userId: 'usr_12',
    type: 'milestone',
    message: '1 an d\'abonnement — lea.martinez@company.com — Envoyer un email de félicitations.',
    severity: 'info',
    seen: false,
    createdAt: daysAgo(2),
  },
  {
    id: 'alert_6',
    userId: 'usr_3',
    type: 'limit_approaching',
    message: 'Limite projets atteinte — pierre.leroy@free.fr — Opportunité d\'upgrade.',
    severity: 'info',
    seen: true,
    createdAt: daysAgo(2),
  },
  {
    id: 'alert_7',
    userId: 'usr_13',
    type: 'limit_approaching',
    message: 'Limite membres atteinte — hugo.robert@dev.io — 5/5 membres utilisés.',
    severity: 'info',
    seen: true,
    createdAt: daysAgo(3),
  },
  {
    id: 'alert_8',
    userId: 'usr_8',
    type: 'trial_ending',
    message: 'Trial expire dans 7 jours — claire.dupont@startup.fr — Engagement moyen.',
    severity: 'info',
    seen: true,
    createdAt: daysAgo(3),
  },
  {
    id: 'alert_9',
    userId: 'usr_9',
    type: 'trial_ending',
    message: 'Trial expire dans 9 jours — lucas.simon@enterprise.com — Potentiel enterprise.',
    severity: 'info',
    seen: true,
    createdAt: daysAgo(4),
  },
  {
    id: 'alert_10',
    userId: 'usr_1',
    type: 'milestone',
    message: 'User freemium très actif — marc.dubois@gmail.com — 45 jours d\'utilisation régulière.',
    severity: 'info',
    seen: true,
    createdAt: daysAgo(5),
  },
  {
    id: 'alert_11',
    userId: 'usr_10',
    type: 'milestone',
    message: '1 an de fidélité — marie.lambert@techcorp.fr — Ambassadrice potentielle.',
    severity: 'info',
    seen: true,
    createdAt: daysAgo(5),
  },
  {
    id: 'alert_12',
    userId: 'usr_14',
    type: 'milestone',
    message: '3000€ LTV atteint — camille.thomas@media.fr — Client VIP.',
    severity: 'info',
    seen: true,
    createdAt: daysAgo(7),
  },
  {
    id: 'alert_13',
    userId: 'usr_4',
    type: 'churn_risk',
    message: 'Inactif depuis 45 jours — julie.bernard@yahoo.fr — User freemium dormant.',
    severity: 'warning',
    seen: true,
    createdAt: daysAgo(10),
  },
  {
    id: 'alert_14',
    userId: 'usr_19',
    type: 'churn_risk',
    message: 'Abonnement annulé — alex.martin@oldclient.com — Raison: prix.',
    severity: 'warning',
    seen: true,
    createdAt: daysAgo(30),
  },
  {
    id: 'alert_15',
    userId: 'usr_20',
    type: 'churn_risk',
    message: 'Abonnement annulé — sarah.cohen@excompany.fr — Entreprise fermée.',
    severity: 'warning',
    seen: true,
    createdAt: daysAgo(45),
  },
];

// Mock Emails (10 emails)
export const mockEmails: MockEmail[] = [
  {
    id: 'email_1',
    userId: 'usr_10',
    subject: 'Bienvenue sur Abo!',
    status: 'opened',
    sentAt: daysAgo(365),
    openedAt: daysAgo(365),
    template: 'welcome',
  },
  {
    id: 'email_2',
    userId: 'usr_17',
    subject: 'Action requise: mettre à jour votre moyen de paiement',
    status: 'sent',
    sentAt: daysAgo(3),
    template: 'payment_failed',
  },
  {
    id: 'email_3',
    userId: 'usr_7',
    subject: 'Votre trial expire bientôt!',
    status: 'opened',
    sentAt: daysAgo(1),
    openedAt: hoursAgo(12),
    template: 'trial_ending',
  },
  {
    id: 'email_4',
    userId: 'usr_18',
    subject: 'Vous nous manquez!',
    status: 'sent',
    sentAt: daysAgo(7),
    template: 'reengagement',
  },
  {
    id: 'email_5',
    userId: 'usr_12',
    subject: 'Félicitations pour votre 1ère année!',
    status: 'clicked',
    sentAt: daysAgo(2),
    openedAt: daysAgo(2),
    template: 'anniversary',
  },
  {
    id: 'email_6',
    userId: 'usr_3',
    subject: 'Débloquez plus de projets avec Starter',
    status: 'opened',
    sentAt: daysAgo(5),
    openedAt: daysAgo(4),
    template: 'upgrade_proposal',
  },
  {
    id: 'email_7',
    userId: 'usr_11',
    subject: 'Bienvenue sur Abo!',
    status: 'opened',
    sentAt: daysAgo(400),
    openedAt: daysAgo(400),
    template: 'welcome',
  },
  {
    id: 'email_8',
    userId: 'usr_14',
    subject: 'Bienvenue sur Abo!',
    status: 'clicked',
    sentAt: daysAgo(400),
    openedAt: daysAgo(400),
    template: 'welcome',
  },
  {
    id: 'email_9',
    userId: 'usr_8',
    subject: 'Bienvenue sur Abo!',
    status: 'opened',
    sentAt: daysAgo(7),
    openedAt: daysAgo(7),
    template: 'welcome',
  },
  {
    id: 'email_10',
    userId: 'usr_9',
    subject: 'Bienvenue sur Abo!',
    status: 'opened',
    sentAt: daysAgo(5),
    openedAt: daysAgo(5),
    template: 'welcome',
  },
];

// Email templates
export const emailTemplates = [
  { id: 'welcome', name: 'Bienvenue', description: 'Email de bienvenue pour les nouveaux users' },
  { id: 'trial_ending', name: 'Trial expire', description: 'Rappel avant fin de trial' },
  { id: 'payment_failed', name: 'Paiement échoué', description: 'Relance après échec de paiement' },
  { id: 'reengagement', name: 'Réengagement', description: 'Email pour users inactifs' },
  { id: 'anniversary', name: 'Anniversaire', description: 'Félicitations pour X années' },
  { id: 'upgrade_proposal', name: 'Proposition upgrade', description: 'Invitation à passer au plan supérieur' },
];

// Plans configuration
export const plansConfig = {
  plans: ['free', 'starter', 'growth', 'team', 'scale'] as const,
  planNames: {
    free: 'Free',
    starter: 'Starter',
    growth: 'Growth',
    team: 'Team',
    scale: 'Scale',
  },
  planPrices: {
    free: 0,
    starter: 29,
    growth: 79,
    team: 149,
    scale: 299,
  },
  features: {
    export_pdf: { name: 'Export PDF', free: true, starter: true, growth: true, team: true, scale: true },
    api_access: { name: 'Accès API', free: false, starter: false, growth: true, team: true, scale: true },
    sso: { name: 'SSO', free: false, starter: false, growth: false, team: false, scale: true },
    priority_support: { name: 'Support prioritaire', free: false, starter: false, growth: false, team: true, scale: true },
  },
  limits: {
    projects: { name: 'Projets', free: 3, starter: 10, growth: 50, team: 200, scale: 9999 },
    members: { name: 'Membres', free: 1, starter: 1, growth: 5, team: 20, scale: 9999 },
  },
};

// Helper functions
export function getUserById(id: string): MockUser | undefined {
  return mockUsers.find(u => u.id === id);
}

export function getAlertsByUserId(userId: string): MockAlert[] {
  return mockAlerts.filter(a => a.userId === userId);
}

export function getEmailsByUserId(userId: string): MockEmail[] {
  return mockEmails.filter(e => e.userId === userId);
}

export function getUsersByStatus(status: UserStatus): MockUser[] {
  return mockUsers.filter(u => u.status === status);
}

export function getUnseenAlerts(): MockAlert[] {
  return mockAlerts.filter(a => !a.seen);
}

// Calculate stats
export function getStats() {
  const activeUsers = mockUsers.filter(u => u.status === 'active');
  const totalMRR = activeUsers.reduce((sum, u) => sum + u.mrr, 0);
  const churnedCount = mockUsers.filter(u => u.status === 'churned').length;
  const totalPaidEver = activeUsers.length + churnedCount;
  const churnRate = totalPaidEver > 0 ? (churnedCount / totalPaidEver) * 100 : 0;

  const trialUsers = mockUsers.filter(u => u.status === 'trial');
  const trialConversionRate = 23; // mocked

  return {
    mrr: totalMRR,
    mrrGrowth: 12, // mocked %
    activeUsersCount: activeUsers.length,
    activeUsersGrowth: 8, // mocked %
    churnRate: churnRate.toFixed(1),
    trialConversionRate,
    totalUsers: mockUsers.length,
    freemiumCount: mockUsers.filter(u => u.status === 'freemium').length,
    trialCount: trialUsers.length,
    atRiskCount: mockUsers.filter(u => u.status === 'at_risk').length,
    churnedCount,
  };
}

// MRR history (mocked)
export const mrrHistory = [
  { month: 'Août', mrr: 890 },
  { month: 'Sept', mrr: 950 },
  { month: 'Oct', mrr: 1020 },
  { month: 'Nov', mrr: 1080 },
  { month: 'Déc', mrr: 1150 },
  { month: 'Jan', mrr: 1241 },
];

// Format helpers
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'il y a quelques minutes';
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('fr-FR');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

// ============================================
// NEW: Segments
// ============================================

export interface FilterRule {
  field: 'status' | 'plan' | 'healthScore' | 'lastSeenDays' | 'mrr' | 'createdDays' | 'tag';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: string | number | string[];
}

export interface MockSegment {
  id: string;
  name: string;
  description: string;
  filterRules: FilterRule[];
  userCount: number;
  createdAt: string;
  isSystem: boolean; // true = predefined, can't delete
}

export const mockSegments: MockSegment[] = [
  {
    id: 'seg_1',
    name: 'Tous les users',
    description: 'Tous les utilisateurs de la plateforme',
    filterRules: [],
    userCount: mockUsers.length,
    createdAt: daysAgo(365),
    isSystem: true,
  },
  {
    id: 'seg_2',
    name: 'Freemium actifs',
    description: 'Users freemium connectés dans les 7 derniers jours',
    filterRules: [
      { field: 'status', operator: 'equals', value: 'freemium' },
      { field: 'lastSeenDays', operator: 'less_than', value: 7 },
    ],
    userCount: 4,
    createdAt: daysAgo(180),
    isSystem: true,
  },
  {
    id: 'seg_3',
    name: 'Trials expiring soon',
    description: 'Users en trial qui expire dans 3 jours ou moins',
    filterRules: [
      { field: 'status', operator: 'equals', value: 'trial' },
    ],
    userCount: 1,
    createdAt: daysAgo(180),
    isSystem: true,
  },
  {
    id: 'seg_4',
    name: 'À risque',
    description: 'Users avec un health score inférieur à 30',
    filterRules: [
      { field: 'healthScore', operator: 'less_than', value: 30 },
    ],
    userCount: 2,
    createdAt: daysAgo(180),
    isSystem: true,
  },
  {
    id: 'seg_5',
    name: 'Payants inactifs',
    description: 'Users actifs mais pas connectés depuis 14+ jours',
    filterRules: [
      { field: 'status', operator: 'equals', value: 'active' },
      { field: 'lastSeenDays', operator: 'greater_than', value: 14 },
    ],
    userCount: 0,
    createdAt: daysAgo(90),
    isSystem: true,
  },
  {
    id: 'seg_6',
    name: 'Nouveaux ce mois',
    description: 'Users créés dans les 30 derniers jours',
    filterRules: [
      { field: 'createdDays', operator: 'less_than', value: 30 },
    ],
    userCount: 4,
    createdAt: daysAgo(60),
    isSystem: true,
  },
  {
    id: 'seg_7',
    name: 'Plan Growth+',
    description: 'Users sur plan Growth, Team ou Scale',
    filterRules: [
      { field: 'plan', operator: 'in', value: ['growth', 'team', 'scale'] },
    ],
    userCount: 8,
    createdAt: daysAgo(60),
    isSystem: true,
  },
  {
    id: 'seg_8',
    name: 'Churnés récents',
    description: 'Users churnés dans les 30 derniers jours',
    filterRules: [
      { field: 'status', operator: 'equals', value: 'churned' },
    ],
    userCount: 1,
    createdAt: daysAgo(30),
    isSystem: true,
  },
  {
    id: 'seg_9',
    name: 'Hot leads freemium',
    description: 'Freemium avec limite atteinte, prêts pour upgrade',
    filterRules: [
      { field: 'status', operator: 'equals', value: 'freemium' },
      { field: 'tag', operator: 'contains', value: 'limite-atteinte' },
    ],
    userCount: 1,
    createdAt: daysAgo(15),
    isSystem: false,
  },
  {
    id: 'seg_10',
    name: 'Power users',
    description: 'Users très actifs avec health score > 85',
    filterRules: [
      { field: 'healthScore', operator: 'greater_than', value: 85 },
    ],
    userCount: 5,
    createdAt: daysAgo(10),
    isSystem: false,
  },
];

export function getSegmentById(id: string): MockSegment | undefined {
  return mockSegments.find(s => s.id === id);
}

// ============================================
// NEW: Cohorts
// ============================================

export interface MockCohort {
  id: string;
  period: string; // "2024-01", "2024-02", etc.
  usersCount: number;
  retention: number[]; // [100, 85, 72, 65, 60, 58, 55, 52, 50, 48, 45, 43] — 12 mois
  avgMrr: number;
  avgLtv: number;
  churnRate: number;
}

// Generate realistic cohorts for the last 12 months
const generateCohorts = (): MockCohort[] => {
  const cohorts: MockCohort[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 7); // "2024-01"

    // Base values with some variance
    const baseUsers = 80 + Math.floor(Math.random() * 60);

    // Generate retention curve (diminishing)
    const retention: number[] = [100];
    let currentRetention = 100;
    for (let m = 1; m <= 11; m++) {
      if (m <= 12 - i) {
        // Monthly drop between 5-15% initially, then 2-5% later
        const drop = m <= 3 ? (5 + Math.random() * 10) : (2 + Math.random() * 3);
        currentRetention = Math.max(30, currentRetention - drop);
        retention.push(Math.round(currentRetention));
      }
    }

    cohorts.push({
      id: `cohort_${monthStr}`,
      period: monthStr,
      usersCount: baseUsers,
      retention,
      avgMrr: 45 + Math.floor(Math.random() * 30),
      avgLtv: 180 + Math.floor(Math.random() * 150),
      churnRate: 100 - retention[retention.length - 1],
    });
  }

  return cohorts;
};

export const mockCohorts: MockCohort[] = generateCohorts();

// ============================================
// NEW: Automations
// ============================================

export interface AutomationTrigger {
  type: 'event' | 'segment_enter' | 'segment_exit' | 'date_based';
  event?: 'signup' | 'trial_started' | 'trial_ending' | 'payment_failed' | 'subscription_canceled' | 'inactive_7d' | 'inactive_14d' | 'plan_upgraded' | 'plan_downgraded' | 'limit_approaching';
  segmentId?: string;
  daysOffset?: number;
}

export interface AutomationStep {
  id: string;
  order: number;
  type: 'wait' | 'email' | 'condition' | 'tag' | 'webhook';
  config: {
    days?: number;
    hours?: number;
    subject?: string;
    templateId?: string;
    field?: string;
    operator?: string;
    value?: string | number;
    tagName?: string;
    tagAction?: 'add' | 'remove';
    webhookUrl?: string;
  };
  trueBranchSteps?: AutomationStep[];
  falseBranchSteps?: AutomationStep[];
}

export interface MockAutomation {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  isActive: boolean;
  isTemplate: boolean;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    inProgress: number;
  };
  createdAt: string;
}

export const mockAutomations: MockAutomation[] = [
  // 1. Onboarding Welcome
  {
    id: 'auto_1',
    name: 'Onboarding Welcome',
    description: 'Séquence de bienvenue pour les nouveaux inscrits',
    trigger: { type: 'event', event: 'signup' },
    steps: [
      { id: 's1_1', order: 1, type: 'email', config: { subject: 'Bienvenue sur {app_name} !', templateId: 'welcome' } },
      { id: 's1_2', order: 2, type: 'wait', config: { days: 2 } },
      { id: 's1_3', order: 3, type: 'email', config: { subject: 'Comment ça se passe ?', templateId: 'checkin' } },
      { id: 's1_4', order: 4, type: 'wait', config: { days: 5 } },
      {
        id: 's1_5',
        order: 5,
        type: 'condition',
        config: { field: 'lastSeenDays', operator: 'greater_than', value: 5 },
        trueBranchSteps: [
          { id: 's1_5a', order: 1, type: 'email', config: { subject: 'On peut vous aider ?', templateId: 'reengagement' } },
        ],
        falseBranchSteps: [],
      },
    ],
    isActive: true,
    isTemplate: true,
    stats: { sent: 12400, opened: 5580, clicked: 1240, converted: 620, inProgress: 847 },
    createdAt: daysAgo(365),
  },
  // 2. Trial Nurturing
  {
    id: 'auto_2',
    name: 'Trial Nurturing',
    description: 'Accompagnement pendant la période de trial',
    trigger: { type: 'event', event: 'trial_started' },
    steps: [
      { id: 's2_1', order: 1, type: 'email', config: { subject: '5 astuces pour bien démarrer', templateId: 'trial_tips_1' } },
      { id: 's2_2', order: 2, type: 'wait', config: { days: 3 } },
      { id: 's2_3', order: 3, type: 'email', config: { subject: 'Avez-vous essayé cette feature ?', templateId: 'trial_tips_2' } },
      { id: 's2_4', order: 4, type: 'wait', config: { days: 7 } },
      { id: 's2_5', order: 5, type: 'email', config: { subject: 'Votre trial expire bientôt', templateId: 'trial_ending' } },
    ],
    isActive: true,
    isTemplate: true,
    stats: { sent: 3200, opened: 1664, clicked: 480, converted: 192, inProgress: 52 },
    createdAt: daysAgo(300),
  },
  // 3. Trial Ending Urgence
  {
    id: 'auto_3',
    name: 'Trial Ending Urgence',
    description: 'Séquence urgente 3 jours avant fin de trial',
    trigger: { type: 'event', event: 'trial_ending' },
    steps: [
      { id: 's3_1', order: 1, type: 'email', config: { subject: '⏰ Plus que 3 jours de trial !', templateId: 'trial_urgency' } },
      { id: 's3_2', order: 2, type: 'wait', config: { days: 1 } },
      {
        id: 's3_3',
        order: 3,
        type: 'condition',
        config: { field: 'status', operator: 'equals', value: 'active' },
        trueBranchSteps: [],
        falseBranchSteps: [
          { id: 's3_3a', order: 1, type: 'email', config: { subject: 'Dernière chance : -20% sur votre abonnement', templateId: 'trial_last_chance' } },
        ],
      },
    ],
    isActive: true,
    isTemplate: true,
    stats: { sent: 890, opened: 534, clicked: 178, converted: 89, inProgress: 12 },
    createdAt: daysAgo(250),
  },
  // 4. Paiement échoué
  {
    id: 'auto_4',
    name: 'Paiement échoué',
    description: 'Relance après échec de paiement',
    trigger: { type: 'event', event: 'payment_failed' },
    steps: [
      { id: 's4_1', order: 1, type: 'email', config: { subject: '⚠️ Problème avec votre paiement', templateId: 'payment_failed' } },
      { id: 's4_2', order: 2, type: 'tag', config: { tagName: 'payment-issue', tagAction: 'add' } },
      { id: 's4_3', order: 3, type: 'wait', config: { days: 2 } },
      {
        id: 's4_4',
        order: 4,
        type: 'condition',
        config: { field: 'tag', operator: 'contains', value: 'payment-issue' },
        trueBranchSteps: [
          { id: 's4_4a', order: 1, type: 'email', config: { subject: 'Votre compte sera suspendu dans 5 jours', templateId: 'payment_reminder' } },
          { id: 's4_4b', order: 2, type: 'wait', config: { days: 3 } },
          { id: 's4_4c', order: 3, type: 'email', config: { subject: 'Dernier avertissement', templateId: 'payment_final' } },
        ],
        falseBranchSteps: [
          { id: 's4_4d', order: 1, type: 'tag', config: { tagName: 'payment-issue', tagAction: 'remove' } },
        ],
      },
    ],
    isActive: true,
    isTemplate: true,
    stats: { sent: 456, opened: 365, clicked: 228, converted: 182, inProgress: 8 },
    createdAt: daysAgo(200),
  },
  // 5. Réactivation inactifs
  {
    id: 'auto_5',
    name: 'Réactivation inactifs',
    description: 'Réengager les users inactifs depuis 14+ jours',
    trigger: { type: 'event', event: 'inactive_14d' },
    steps: [
      { id: 's5_1', order: 1, type: 'email', config: { subject: 'On ne vous voit plus 😢', templateId: 'reengagement' } },
      { id: 's5_2', order: 2, type: 'wait', config: { days: 5 } },
      {
        id: 's5_3',
        order: 3,
        type: 'condition',
        config: { field: 'lastSeenDays', operator: 'greater_than', value: 14 },
        trueBranchSteps: [
          { id: 's5_3a', order: 1, type: 'email', config: { subject: '🎁 Offre spéciale : 1 mois gratuit', templateId: 'winback_offer' } },
        ],
        falseBranchSteps: [],
      },
    ],
    isActive: false,
    isTemplate: true,
    stats: { sent: 890, opened: 267, clicked: 89, converted: 36, inProgress: 0 },
    createdAt: daysAgo(180),
  },
  // 6. Churn Prevention
  {
    id: 'auto_6',
    name: 'Churn Prevention',
    description: 'Prévention du churn pour users à risque',
    trigger: { type: 'segment_enter', segmentId: 'seg_4' },
    steps: [
      { id: 's6_1', order: 1, type: 'tag', config: { tagName: 'at_risk', tagAction: 'add' } },
      { id: 's6_2', order: 2, type: 'email', config: { subject: 'Comment pouvons-nous vous aider ?', templateId: 'churn_prevention' } },
      { id: 's6_3', order: 3, type: 'wait', config: { days: 3 } },
      {
        id: 's6_4',
        order: 4,
        type: 'condition',
        config: { field: 'healthScore', operator: 'greater_than', value: 40 },
        trueBranchSteps: [
          { id: 's6_4a', order: 1, type: 'tag', config: { tagName: 'at_risk', tagAction: 'remove' } },
        ],
        falseBranchSteps: [
          { id: 's6_4b', order: 1, type: 'webhook', config: { webhookUrl: 'https://slack.com/webhook/alert-churn' } },
        ],
      },
    ],
    isActive: true,
    isTemplate: true,
    stats: { sent: 234, opened: 152, clicked: 47, converted: 23, inProgress: 15 },
    createdAt: daysAgo(150),
  },
  // 7. Upgrade Nudge
  {
    id: 'auto_7',
    name: 'Upgrade Nudge',
    description: 'Inciter à l\'upgrade quand limite atteinte',
    trigger: { type: 'event', event: 'limit_approaching' },
    steps: [
      { id: 's7_1', order: 1, type: 'email', config: { subject: 'Vous approchez de votre limite', templateId: 'limit_warning' } },
      { id: 's7_2', order: 2, type: 'wait', config: { days: 2 } },
      { id: 's7_3', order: 3, type: 'email', config: { subject: '🚀 Passez au niveau supérieur', templateId: 'upgrade_proposal' } },
    ],
    isActive: true,
    isTemplate: true,
    stats: { sent: 567, opened: 340, clicked: 170, converted: 68, inProgress: 23 },
    createdAt: daysAgo(120),
  },
  // 8. Anniversaire abonnement
  {
    id: 'auto_8',
    name: 'Anniversaire abonnement',
    description: 'Célébrer 1 an d\'abonnement',
    trigger: { type: 'date_based', daysOffset: 365 },
    steps: [
      { id: 's8_1', order: 1, type: 'email', config: { subject: '🎉 1 an ensemble !', templateId: 'anniversary' } },
      { id: 's8_2', order: 2, type: 'tag', config: { tagName: 'loyal_customer', tagAction: 'add' } },
    ],
    isActive: true,
    isTemplate: true,
    stats: { sent: 145, opened: 116, clicked: 58, converted: 29, inProgress: 0 },
    createdAt: daysAgo(100),
  },
];

export function getAutomationById(id: string): MockAutomation | undefined {
  return mockAutomations.find(a => a.id === id);
}

export function getActiveAutomations(): MockAutomation[] {
  return mockAutomations.filter(a => a.isActive);
}

export function getAutomationTemplates(): MockAutomation[] {
  return mockAutomations.filter(a => a.isTemplate);
}

// ============================================
// NEW: Coach Questions (contextual)
// ============================================

export interface CoachQuestion {
  id: string;
  context: 'dashboard' | 'user_detail' | 'cohorts' | 'segment' | 'automation' | 'alert' | 'email';
  relatedTo?: string;
  question: string;
  mockAnswer: string;
}

export const coachQuestions: CoachQuestion[] = [
  // Dashboard questions
  {
    id: 'cq_1',
    context: 'dashboard',
    relatedTo: 'churn',
    question: 'Pourquoi mon churn a augmenté ce mois ?',
    mockAnswer: `Votre churn a augmenté de 0.5% ce mois pour plusieurs raisons :\n\n**Causes principales identifiées :**\n1. **2 échecs de paiement** non résolus (marie@startup.fr, julien.blanc@corp.io)\n2. **Inactivité croissante** : 3 users payants n'ont pas été connectés depuis 14+ jours\n3. **Fin de trial sans conversion** : 2 trials ont expiré sans upgrade\n\n**Actions recommandées :**\n- Relancer immédiatement les 2 users en échec de paiement\n- Activer l'automation "Réactivation inactifs"\n- Analyser pourquoi les trials n'ont pas converti`,
  },
  {
    id: 'cq_2',
    context: 'dashboard',
    relatedTo: 'trial_conversion',
    question: 'Comment améliorer ma conversion trial ?',
    mockAnswer: `Votre taux de conversion trial→paid est de 23%, légèrement au-dessus de la moyenne (15-25%).\n\n**Pour l'améliorer :**\n1. **Onboarding renforcé** : Vos users qui complètent l'onboarding convertissent 3x plus\n2. **Contact J+3** : Les trials contactés au jour 3 ont 40% plus de chances de convertir\n3. **Demo personnalisée** : Proposer un call pour les trials enterprise\n4. **Réduire les frictions** : 15% abandonnent à l'étape de paiement\n\n**Quick win :** Activez l'automation "Trial Nurturing" si ce n'est pas fait.`,
  },
  {
    id: 'cq_3',
    context: 'dashboard',
    relatedTo: 'priority',
    question: 'Quels users dois-je contacter en priorité ?',
    mockAnswer: `**🔴 Urgence immédiate (aujourd'hui) :**\n1. **marie@startup.fr** — 3 paiements échoués, risque churn imminent\n2. **paul.moreau@acme.io** — Trial expire dans 2 jours, très engagé\n\n**🟡 Cette semaine :**\n3. **julien.blanc@corp.io** — Inactif 30 jours, compte Team (149€/mois)\n4. **pierre.leroy@free.fr** — Limite atteinte, prêt pour upgrade\n\n**🟢 À planifier :**\n5. **lea.martinez@company.com** — 1 an d'abo, envoyer félicitations`,
  },
  {
    id: 'cq_4',
    context: 'dashboard',
    relatedTo: 'mrr',
    question: 'Comment augmenter mon MRR rapidement ?',
    mockAnswer: `Votre MRR actuel est de 1 241€ (+12% vs mois dernier). Voici comment l'accélérer :\n\n**Opportunités immédiates :**\n1. **Upgrades potentiels** : 4 users Starter approchent de leurs limites → +116€/mois si upgrade Growth\n2. **Freemium hot** : 2 freemium très actifs prêts pour Trial → potentiel +158€/mois\n3. **Récupération churn** : 1 user churné récemment, raison "prix" → offrir promo\n\n**Potentiel MRR additionnel : +274€/mois** si vous convertissez ces opportunités.`,
  },
  {
    id: 'cq_5',
    context: 'dashboard',
    relatedTo: 'health',
    question: 'Quel est l\'état de santé de ma base users ?',
    mockAnswer: `**Vue d'ensemble :**\n- 🟢 **Excellente santé (>70)** : 12 users (60%)\n- 🟡 **Attention (40-70)** : 5 users (25%)\n- 🔴 **À risque (<40)** : 3 users (15%)\n\n**Répartition par statut :**\n- Freemium : 6 users, santé moyenne 57\n- Trial : 3 users, santé moyenne 73 (bon signe !)\n- Active : 7 users, santé moyenne 84\n- At risk : 2 users, santé moyenne 30\n\n**Tendance :** Légère amélioration vs mois dernier (+2 points moyens)`,
  },

  // User detail questions
  {
    id: 'cq_10',
    context: 'user_detail',
    question: 'Quel est le risque de churn de ce user ?',
    mockAnswer: `**Analyse du risque de churn :**\n\nBasé sur les signaux comportementaux, ce user présente un risque **modéré à élevé** :\n\n**Signaux négatifs :**\n- Baisse d'activité de 35% sur 2 semaines\n- 0 features premium utilisées ce mois\n- Pas de réponse aux 2 derniers emails\n\n**Signaux positifs :**\n- Abonné depuis 8 mois (engagement long terme)\n- Jamais eu d'échec de paiement\n\n**Score de risque : 65/100**\n\n**Recommandation :** Contact proactif dans les 48h pour comprendre ses besoins.`,
  },
  {
    id: 'cq_11',
    context: 'user_detail',
    question: 'Quel email lui envoyer ?',
    mockAnswer: `Basé sur le profil et l'historique de ce user, je recommande :\n\n**Template suggéré : "Check-in personnalisé"**\n\n---\n**Objet :** {prénom}, on peut en parler ?\n\nSalut {prénom},\n\nJ'ai remarqué que tu utilises moins {app_name} ces derniers temps. Est-ce qu'il y a quelque chose qu'on pourrait améliorer ?\n\nSi tu as 15 min cette semaine, je serais ravi d'échanger.\n\n[Réserver un call]\n\n---\n\n**Pourquoi ce template ?**\n- Ton personnalisé et non-commercial\n- Invite au dialogue\n- Permet d'identifier les blocages`,
  },
  {
    id: 'cq_12',
    context: 'user_detail',
    question: 'Pourquoi son health score est bas ?',
    mockAnswer: `**Diagnostic du health score (35/100) :**\n\n**Facteurs négatifs (impact) :**\n1. **Inactivité** (-30 pts) : Dernière connexion il y a 15 jours\n2. **Features inutilisées** (-20 pts) : 0/5 features premium utilisées ce mois\n3. **Échec paiement** (-15 pts) : 3 tentatives échouées\n\n**Facteurs neutres/positifs :**\n- Ancienneté OK : 4 mois\n- Pas de tickets support ouverts\n\n**Pour améliorer le score :**\n1. Résoudre le problème de paiement (priorité)\n2. Encourager la reconnexion\n3. Proposer une formation sur les features`,
  },
  {
    id: 'cq_13',
    context: 'user_detail',
    question: 'Dois-je lui proposer un upgrade ?',
    mockAnswer: `**Analyse d'opportunité upgrade :**\n\n**Signaux positifs pour upgrade :**\n✅ Utilise 85% de sa limite projets (8/10)\n✅ Connecté 12 fois ce mois\n✅ A déjà regardé la page pricing 2 fois\n\n**Signaux négatifs :**\n❌ Jamais utilisé les features premium\n❌ Petit compte (1 seul membre)\n\n**Verdict : Oui, mais avec approche "valeur"**\n\nNe pas pusher l'upgrade directement. Plutôt :\n1. Proposer un essai gratuit de la feature API\n2. Montrer un cas d'usage pertinent pour son industrie\n3. Offrir -20% sur le premier mois Growth`,
  },

  // Cohorts questions
  {
    id: 'cq_20',
    context: 'cohorts',
    question: 'Quelle cohorte performe le mieux ?',
    mockAnswer: `**Analyse des cohortes (12 derniers mois) :**\n\n🏆 **Meilleure cohorte : Avril 2024**\n- Rétention M6 : 68% (vs moyenne 58%)\n- LTV moyen : 320€ (vs moyenne 245€)\n- Churn rate : 32% (vs moyenne 42%)\n\n**Pourquoi cette cohorte performe ?**\n1. Lancée avec le nouvel onboarding\n2. Campagne d'acquisition ciblée (SaaS B2B)\n3. Feature "Quick Start" introduite ce mois\n\n**À reproduire :**\n- Ciblage similaire pour les prochaines campagnes\n- Onboarding renforcé déjà actif`,
  },
  {
    id: 'cq_21',
    context: 'cohorts',
    question: 'Pourquoi la rétention M3 est faible ?',
    mockAnswer: `**Analyse de la chute M3 :**\n\nLa rétention moyenne passe de 75% (M2) à 65% (M3), une chute de 10 points.\n\n**Causes identifiées :**\n1. **Fin de "honeymoon"** : Les users découvrent les limitations du plan\n2. **Pas de valeur ajoutée** : 40% des churns M3 n'ont jamais utilisé une feature clé\n3. **Cycle de facturation** : Beaucoup réalisent le coût réel à M3\n\n**Solutions :**\n1. Email "Quick wins" à M2 pour montrer la valeur\n2. Check-in call à M2.5 pour les comptes > 50€/mois\n3. Feature discovery automation à activer`,
  },
  {
    id: 'cq_22',
    context: 'cohorts',
    question: 'Comment améliorer la rétention globale ?',
    mockAnswer: `**Plan d'amélioration de la rétention :**\n\n**Quick wins (impact rapide) :**\n1. ✅ Activer "Trial Nurturing" automation\n2. ✅ Email de check-in à J+7\n3. ✅ Onboarding gamifié (progress bar)\n\n**Moyen terme :**\n1. Identifier les "aha moments" et y amener plus vite\n2. Créer un programme de fidélité (rewards)\n3. Communauté Slack/Discord pour engagement\n\n**Impact estimé :**\n- +5-10% rétention M3 avec quick wins\n- +15-20% rétention M12 avec programme complet`,
  },

  // Automation questions
  {
    id: 'cq_30',
    context: 'automation',
    question: 'Quelle automation a le meilleur ROI ?',
    mockAnswer: `**Classement ROI des automations actives :**\n\n🥇 **Paiement échoué** — ROI 890%\n- 182 users sauvés sur 456 contactés\n- Revenue récupéré : ~8 500€\n\n🥈 **Trial Ending Urgence** — ROI 420%\n- 89 conversions sur 890 envois\n- Revenue généré : ~4 200€\n\n🥉 **Upgrade Nudge** — ROI 340%\n- 68 upgrades sur 567 envois\n- Revenue additionnel : ~2 700€\n\n**À améliorer :** "Réactivation inactifs" (36% conversion seulement)`,
  },
  {
    id: 'cq_31',
    context: 'automation',
    question: 'Comment améliorer le taux d\'ouverture ?',
    mockAnswer: `**Vos taux d'ouverture actuels :**\n- Moyenne : 45% (bon !)\n- Meilleur : "Paiement échoué" (80%)\n- Pire : "Réactivation" (30%)\n\n**Tips pour améliorer :**\n\n1. **Objets email :**\n   - Ajouter le prénom : +15%\n   - Urgence (⏰, ⚠️) : +20%\n   - Curiosité ("Une question...") : +25%\n\n2. **Timing :**\n   - Mardi/Mercredi 10h : +18%\n   - Éviter lundi matin et vendredi PM\n\n3. **Segmentation :**\n   - Personnaliser par plan/usage : +30%`,
  },
  {
    id: 'cq_32',
    context: 'automation',
    question: 'Dois-je ajouter une automation pour les churns ?',
    mockAnswer: `**Analyse : Automation win-back churn**\n\n**Situation actuelle :**\n- 2 users churnés ce mois\n- Aucune automation de récupération active\n- Potentiel récupérable : ~500€/mois\n\n**Recommandation : OUI, créer une automation**\n\n**Séquence suggérée :**\n1. J+1 : "On est tristes de vous voir partir"\n2. J+7 : "Qu'est-ce qu'on aurait pu faire mieux ?"\n3. J+30 : "🎁 Offre de retour : -30% pendant 3 mois"\n\n**ROI estimé :** 15-25% de récupération → 75-125€/mois`,
  },

  // Segment questions
  {
    id: 'cq_40',
    context: 'segment',
    question: 'Quel segment cibler pour une campagne promo ?',
    mockAnswer: `**Recommandation de ciblage promo :**\n\n🎯 **Segment idéal : "Freemium actifs"**\n- 4 users très engagés\n- Coût d'acquisition déjà amorti\n- Conversion historique : 35%\n\n**Alternative : "Hot leads freemium"**\n- 1 user avec limite atteinte\n- Prêt à payer, juste besoin d'un push\n\n**Éviter :**\n- "Churnés récents" → trop tôt\n- "À risque" → focus rétention d'abord\n\n**Offre suggérée :** -20% sur Starter pendant 3 mois`,
  },
  {
    id: 'cq_41',
    context: 'segment',
    question: 'Comment réduire ce segment à risque ?',
    mockAnswer: `**Plan de réduction du segment "À risque" :**\n\n**Users concernés (2) :**\n1. marie@startup.fr — Paiement échoué\n2. julien.blanc@corp.io — Inactif 30j\n\n**Actions immédiates :**\n\n**Pour Marie :**\n- Appel téléphonique (priorité haute)\n- Proposer paiement différé ou plan réduit\n- Deadline : 48h\n\n**Pour Julien :**\n- Email personnalisé "On peut en parler ?"\n- Proposer call de 15 min\n- Offrir 1 mois gratuit si réactivation\n\n**Objectif :** Réduire le segment à 0 en 2 semaines`,
  },

  // Alert questions
  {
    id: 'cq_50',
    context: 'alert',
    question: 'Comment prioriser ces alertes ?',
    mockAnswer: `**Priorisation des alertes actives :**\n\n**🔴 CRITIQUE (traiter aujourd'hui) :**\n1. Paiement échoué marie@startup.fr — 3ème échec\n2. Carte expire dans 5j marie@startup.fr\n\n**🟡 IMPORTANT (cette semaine) :**\n3. Trial expire paul.moreau@acme.io — 2 jours\n4. Inactif 30j julien.blanc@corp.io\n\n**🟢 À PLANIFIER :**\n5. Anniversaire 1 an lea.martinez@company.com\n6. Limite atteinte pierre.leroy@free.fr\n\n**Temps estimé :** 2h pour les critiques, 1h pour les importants`,
  },

  // Email questions
  {
    id: 'cq_60',
    context: 'email',
    question: 'Quel est le meilleur moment pour envoyer ?',
    mockAnswer: `**Analyse de vos envois précédents :**\n\n**Meilleurs moments :**\n🥇 Mardi 10h-11h : 52% ouverture\n🥈 Mercredi 14h-15h : 48% ouverture\n🥉 Jeudi 10h-11h : 45% ouverture\n\n**À éviter :**\n❌ Lundi matin : 28% ouverture\n❌ Vendredi 17h+ : 22% ouverture\n❌ Week-end : 15% ouverture\n\n**Recommandation :**\nProgrammer vos campagnes le **mardi à 10h** pour maximiser l'impact.`,
  },
  {
    id: 'cq_61',
    context: 'email',
    question: 'Comment améliorer mes taux de clic ?',
    mockAnswer: `**Vos stats actuelles :**\n- Taux de clic moyen : 8%\n- Meilleure campagne : 18% (Black Friday)\n- Pire : 3% (Newsletter standard)\n\n**Tips pour améliorer :**\n\n1. **CTA clair et unique**\n   - 1 seul bouton par email\n   - Texte action : "Réserver mon call" > "Cliquez ici"\n\n2. **Design**\n   - Bouton contrasté et grand\n   - Au-dessus de la ligne de flottaison\n\n3. **Contenu**\n   - Créer de l'urgence (deadline)\n   - Personnaliser l'offre\n\n**Objectif réaliste :** 12-15% taux de clic`,
  },
];

export function getCoachQuestionsByContext(context: CoachQuestion['context']): CoachQuestion[] {
  return coachQuestions.filter(q => q.context === context);
}

// ============================================
// NEW: Email Campaigns
// ============================================

export interface MockCampaign {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  segmentId: string;
  segmentName: string;
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  stats?: {
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
  createdAt: string;
}

export const mockCampaigns: MockCampaign[] = [
  {
    id: 'camp_1',
    name: 'Nouvelle feature : Export PDF amélioré',
    subject: '🚀 Nouvelle feature : Export PDF amélioré',
    previewText: 'Découvrez les nouvelles options d\'export...',
    segmentId: 'seg_7',
    segmentName: 'Plan Growth+',
    recipientCount: 8,
    status: 'sent',
    sentAt: daysAgo(3),
    stats: { delivered: 8, opened: 5, clicked: 2, unsubscribed: 0 },
    createdAt: daysAgo(5),
  },
  {
    id: 'camp_2',
    name: 'Black Friday -30%',
    subject: '🔥 Black Friday : -30% sur tous les plans !',
    previewText: 'Offre exceptionnelle valable 48h seulement',
    segmentId: 'seg_2',
    segmentName: 'Freemium actifs',
    recipientCount: 4,
    status: 'sent',
    sentAt: daysAgo(45),
    stats: { delivered: 4, opened: 3, clicked: 1, unsubscribed: 0 },
    createdAt: daysAgo(50),
  },
  {
    id: 'camp_3',
    name: 'Newsletter Janvier 2025',
    subject: '📰 Les nouveautés de janvier',
    previewText: 'Retour sur les features du mois...',
    segmentId: 'seg_1',
    segmentName: 'Tous les users',
    recipientCount: 20,
    status: 'scheduled',
    scheduledAt: daysFromNow(1),
    createdAt: daysAgo(2),
  },
  {
    id: 'camp_4',
    name: 'Promo upgrade Starter→Growth',
    subject: 'Passez à Growth : -20% ce mois',
    segmentId: 'seg_9',
    segmentName: 'Hot leads freemium',
    recipientCount: 1,
    status: 'draft',
    createdAt: daysAgo(1),
  },
];

export function getCampaignById(id: string): MockCampaign | undefined {
  return mockCampaigns.find(c => c.id === id);
}

// ============================================
// NEW: Warning Groups (Dashboard)
// ============================================

export interface AutomationDetail {
  automationName: string;
  userCount: number;
  currentStep: string;
  engagement?: string | null;
}

export interface AutomationCoverage {
  coveredCount: number;
  uncoveredCount: number;
  details: AutomationDetail[];
}

export interface SuggestedAction {
  type: 'activate_automation' | 'send_campaign' | 'view_templates';
  label: string;
  automationId?: string;
  templateId?: string;
}

export interface WarningGroup {
  id: string;
  type: 'payment_failed' | 'trial_ending' | 'inactive' | 'card_expiring' |
        'anniversary' | 'low_health' | 'limit_approaching' | 'downgrade_risk';
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  userCount: number;
  mrrAtRisk?: number;
  description: string;
  automationStatus: AutomationCoverage;
  suggestedActions: SuggestedAction[];
  userIds: string[];
}

export const warningGroups: WarningGroup[] = [
  {
    id: 'wg_1',
    type: 'payment_failed',
    severity: 'critical',
    title: 'Paiements echoues',
    userCount: 12,
    mrrAtRisk: 2400,
    description: '2.4k€ MRR a risque',
    automationStatus: {
      coveredCount: 0,
      uncoveredCount: 12,
      details: [],
    },
    suggestedActions: [
      { type: 'activate_automation', label: 'Activer "Relance paiement echoue"', automationId: 'auto_4' },
      { type: 'send_campaign', label: 'Envoyer une campagne email manuelle' },
      { type: 'view_templates', label: 'Voir les templates recommandes' },
    ],
    userIds: ['usr_11', 'usr_14'],
  },
  {
    id: 'wg_2',
    type: 'trial_ending',
    severity: 'warning',
    title: 'Trials expirent bientot',
    userCount: 8,
    description: 'dans < 3 jours',
    automationStatus: {
      coveredCount: 6,
      uncoveredCount: 2,
      details: [
        { automationName: 'Trial Nurturing', userCount: 3, currentStep: 'Etape 2/4', engagement: null },
        { automationName: 'Trial Ending Urgence', userCount: 2, currentStep: 'Email "Derniere chance" envoye', engagement: 'en attente reponse' },
        { automationName: 'Trial Ending Urgence', userCount: 1, currentStep: 'Email "Offre -20%" envoye', engagement: 'a clique mais pas converti' },
      ],
    },
    suggestedActions: [
      { type: 'activate_automation', label: 'Ajouter les 2 restants a "Trial Nurturing"', automationId: 'auto_2' },
    ],
    userIds: ['usr_7', 'usr_8', 'usr_9'],
  },
  {
    id: 'wg_3',
    type: 'inactive',
    severity: 'warning',
    title: 'Inactifs > 14 jours',
    userCount: 23,
    mrrAtRisk: 1800,
    description: '1.8k€ MRR concerne',
    automationStatus: {
      coveredCount: 13,
      uncoveredCount: 10,
      details: [
        { automationName: 'Reactivation inactifs', userCount: 8, currentStep: 'Email "On ne vous voit plus" envoye', engagement: '3 ont ouvert' },
        { automationName: 'Reactivation inactifs', userCount: 5, currentStep: 'Etape 2/3', engagement: null },
      ],
    },
    suggestedActions: [
      { type: 'activate_automation', label: 'Ajouter les 10 restants a "Reactivation"', automationId: 'auto_6' },
    ],
    userIds: ['usr_12', 'usr_13', 'usr_14', 'usr_15'],
  },
  {
    id: 'wg_4',
    type: 'card_expiring',
    severity: 'info',
    title: 'CB expirent bientot',
    userCount: 15,
    description: 'dans < 30 jours',
    automationStatus: {
      coveredCount: 15,
      uncoveredCount: 0,
      details: [
        { automationName: 'Rappel CB expiree', userCount: 15, currentStep: 'Email de rappel programme J-7', engagement: null },
      ],
    },
    suggestedActions: [],
    userIds: ['usr_10', 'usr_11', 'usr_16'],
  },
  {
    id: 'wg_5',
    type: 'anniversary',
    severity: 'positive',
    title: 'Anniversaires a celebrer',
    userCount: 5,
    description: '1 an d\'abonnement',
    automationStatus: {
      coveredCount: 5,
      uncoveredCount: 0,
      details: [
        { automationName: 'Anniversaire abonnement', userCount: 5, currentStep: 'Email de felicitations programme', engagement: null },
      ],
    },
    suggestedActions: [],
    userIds: ['usr_10', 'usr_16'],
  },
  {
    id: 'wg_6',
    type: 'low_health',
    severity: 'warning',
    title: 'Health score < 30',
    userCount: 18,
    mrrAtRisk: 3200,
    description: 'Risque de churn eleve',
    automationStatus: {
      coveredCount: 7,
      uncoveredCount: 11,
      details: [
        { automationName: 'Churn Prevention', userCount: 7, currentStep: 'Email personnalise envoye', engagement: '2 ont repondu' },
      ],
    },
    suggestedActions: [
      { type: 'activate_automation', label: 'Ajouter les 11 restants a "Churn Prevention"', automationId: 'auto_8' },
      { type: 'send_campaign', label: 'Envoyer une offre de retention' },
    ],
    userIds: ['usr_11', 'usr_12', 'usr_14'],
  },
  {
    id: 'wg_7',
    type: 'limit_approaching',
    severity: 'info',
    title: 'Limite atteinte',
    userCount: 8,
    description: '8 users ont atteint 90%+ de leur limite',
    automationStatus: {
      coveredCount: 5,
      uncoveredCount: 3,
      details: [
        { automationName: 'Upgrade Nudge', userCount: 5, currentStep: 'Email "Vous approchez de la limite" envoye', engagement: '2 ont clique sur upgrade' },
      ],
    },
    suggestedActions: [
      { type: 'activate_automation', label: 'Ajouter les 3 restants a "Upgrade Nudge"', automationId: 'auto_7' },
    ],
    userIds: ['usr_1', 'usr_5'],
  },
  {
    id: 'wg_8',
    type: 'downgrade_risk',
    severity: 'warning',
    title: 'Risque downgrade',
    userCount: 4,
    mrrAtRisk: 396,
    description: 'Users sous-utilisent leur plan',
    automationStatus: {
      coveredCount: 0,
      uncoveredCount: 4,
      details: [],
    },
    suggestedActions: [
      { type: 'activate_automation', label: 'Activer "Formation features"', automationId: 'auto_9' },
      { type: 'send_campaign', label: 'Proposer un call de decouverte' },
    ],
    userIds: ['usr_16'],
  },
];

export function getWarningsBySeverity(severity?: WarningGroup['severity']): WarningGroup[] {
  if (!severity) return warningGroups;
  return warningGroups.filter(w => w.severity === severity);
}

export function getCriticalWarningsCount(): number {
  return warningGroups.filter(w => w.severity === 'critical').length;
}

export function getTotalMrrAtRisk(): number {
  return warningGroups.reduce((sum, w) => sum + (w.mrrAtRisk || 0), 0);
}

// ============================================
// NEW: Promo Codes
// ============================================

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_months';
  discountValue: number;
  applicablePlans: string[] | 'all';
  duration: 'first_payment' | 'months' | 'lifetime';
  durationMonths?: number;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
}

export const promoCodes: PromoCode[] = [
  {
    id: 'promo_1',
    code: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    applicablePlans: 'all',
    duration: 'months',
    durationMonths: 3,
    currentUses: 156,
    isActive: true,
    createdAt: daysAgo(365),
  },
  {
    id: 'promo_2',
    code: 'BLACKFRIDAY',
    discountType: 'percentage',
    discountValue: 30,
    applicablePlans: 'all',
    duration: 'first_payment',
    validFrom: '2024-11-24',
    validUntil: '2024-11-29',
    maxUses: 200,
    currentUses: 89,
    isActive: true,
    createdAt: daysAgo(60),
  },
  {
    id: 'promo_3',
    code: 'FRIEND25',
    discountType: 'percentage',
    discountValue: 25,
    applicablePlans: 'all',
    duration: 'months',
    durationMonths: 1,
    currentUses: 45,
    isActive: true,
    createdAt: daysAgo(180),
  },
  {
    id: 'promo_4',
    code: 'LAUNCH50',
    discountType: 'percentage',
    discountValue: 50,
    applicablePlans: 'all',
    duration: 'months',
    durationMonths: 3,
    validFrom: '2025-01-01',
    validUntil: '2025-01-15',
    maxUses: 500,
    currentUses: 234,
    isActive: false,
    createdAt: daysAgo(30),
  },
];

export function getActivePromoCodes(): PromoCode[] {
  return promoCodes.filter(p => p.isActive);
}

// ============================================
// NEW: Marketing Operations
// ============================================

export interface MarketingOperation {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  promoCodeId: string;
  promoCode: string;
  targetSegmentId: string;
  targetSegmentName: string;
  emails: {
    launch: boolean;
    reminder: boolean;
    lastChance: boolean;
  };
  goals?: {
    conversions: number;
    mrr: number;
  };
  results: {
    conversions: number;
    mrrGenerated: number;
    roi: number;
    retentionM3: number;
  };
  status: 'draft' | 'scheduled' | 'active' | 'completed';
}

export const marketingOperations: MarketingOperation[] = [
  {
    id: 'op_1',
    name: 'Black Friday 2024',
    startDate: '2024-11-24',
    endDate: '2024-11-29',
    promoCodeId: 'promo_2',
    promoCode: 'BLACKFRIDAY',
    targetSegmentId: 'seg_2',
    targetSegmentName: 'Freemium actifs',
    emails: { launch: true, reminder: true, lastChance: true },
    goals: { conversions: 50, mrr: 2000 },
    results: { conversions: 89, mrrGenerated: 2400, roi: 340, retentionM3: 62 },
    status: 'completed',
  },
  {
    id: 'op_2',
    name: 'Lancement V2',
    startDate: '2025-01-01',
    endDate: '2025-01-15',
    promoCodeId: 'promo_4',
    promoCode: 'LAUNCH50',
    targetSegmentId: 'seg_1',
    targetSegmentName: 'Tous les users',
    emails: { launch: true, reminder: true, lastChance: true },
    goals: { conversions: 100, mrr: 3000 },
    results: { conversions: 234, mrrGenerated: 5800, roi: 280, retentionM3: 45 },
    status: 'completed',
  },
  {
    id: 'op_3',
    name: 'Summer Sale 2025',
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    promoCodeId: 'promo_1',
    promoCode: 'WELCOME20',
    targetSegmentId: 'seg_2',
    targetSegmentName: 'Freemium actifs',
    emails: { launch: true, reminder: false, lastChance: true },
    goals: { conversions: 30, mrr: 1500 },
    results: { conversions: 0, mrrGenerated: 0, roi: 0, retentionM3: 0 },
    status: 'scheduled',
  },
];

export function getMarketingOperationById(id: string): MarketingOperation | undefined {
  return marketingOperations.find(o => o.id === id);
}

// ============================================
// NEW: Cohorts by Type
// ============================================

export interface CohortSegment {
  id: string;
  label: string;
  userCount: number;
  retention: number[];
  avgMrr: number;
  avgLtv: number;
  churnRate: number;
}

export interface CohortGroup {
  id: string;
  name: string;
  type: 'acquisition_month' | 'price' | 'promo' | 'tenure' | 'custom';
  filterRules?: Array<{field: string; operator: string; value: string}>;
  segments: CohortSegment[];
}

// Cohorts by price tier
export const cohortsByPrice: CohortGroup = {
  id: 'cg_price',
  name: 'Par prix',
  type: 'price',
  segments: [
    {
      id: 'price_0_29',
      label: '0-29€',
      userCount: 8,
      retention: [100, 75, 60, 52, 45, 40, 35, 32, 28, 25, 22, 20],
      avgMrr: 15,
      avgLtv: 89,
      churnRate: 12,
    },
    {
      id: 'price_30_99',
      label: '30-99€',
      userCount: 6,
      retention: [100, 85, 75, 70, 65, 62, 58, 55, 52, 50, 48, 46],
      avgMrr: 58,
      avgLtv: 420,
      churnRate: 6,
    },
    {
      id: 'price_100_plus',
      label: '100€+',
      userCount: 4,
      retention: [100, 92, 88, 85, 82, 80, 78, 76, 74, 72, 70, 68],
      avgMrr: 149,
      avgLtv: 1250,
      churnRate: 3,
    },
  ],
};

// Cohorts by promo code used
export const cohortsByPromo: CohortGroup = {
  id: 'cg_promo',
  name: 'Par promotion',
  type: 'promo',
  segments: [
    {
      id: 'promo_none',
      label: 'Sans promo',
      userCount: 10,
      retention: [100, 88, 80, 75, 70, 68, 65, 62, 60, 58, 56, 54],
      avgMrr: 67,
      avgLtv: 580,
      churnRate: 5,
    },
    {
      id: 'promo_launch50',
      label: 'LAUNCH50',
      userCount: 5,
      retention: [100, 72, 58, 45, 38, 32, 28, 25, 22, 20, 18, 16],
      avgMrr: 29,
      avgLtv: 145,
      churnRate: 18,
    },
    {
      id: 'promo_blackfriday',
      label: 'BLACKFRIDAY',
      userCount: 3,
      retention: [100, 80, 70, 62, 55, 50, 46, 42, 38, 35, 32, 30],
      avgMrr: 45,
      avgLtv: 290,
      churnRate: 9,
    },
    {
      id: 'promo_friend25',
      label: 'FRIEND25',
      userCount: 2,
      retention: [100, 90, 85, 82, 78, 75, 72, 70, 68, 66, 64, 62],
      avgMrr: 72,
      avgLtv: 620,
      churnRate: 4,
    },
  ],
};

// Cohorts by tenure
export const cohortsByTenure: CohortGroup = {
  id: 'cg_tenure',
  name: 'Par anciennete',
  type: 'tenure',
  segments: [
    {
      id: 'tenure_0_3',
      label: '< 3 mois',
      userCount: 6,
      retention: [100, 72, 58, 50],
      avgMrr: 42,
      avgLtv: 89,
      churnRate: 8.2,
    },
    {
      id: 'tenure_3_6',
      label: '3-6 mois',
      userCount: 4,
      retention: [100, 85, 78, 72, 68, 65],
      avgMrr: 58,
      avgLtv: 245,
      churnRate: 4.5,
    },
    {
      id: 'tenure_6_12',
      label: '6-12 mois',
      userCount: 5,
      retention: [100, 90, 85, 82, 80, 78, 75, 73, 71, 70, 68, 66],
      avgMrr: 89,
      avgLtv: 520,
      churnRate: 2.8,
    },
    {
      id: 'tenure_12_plus',
      label: '> 12 mois',
      userCount: 3,
      retention: [100, 95, 92, 90, 88, 86, 85, 84, 83, 82, 81, 80],
      avgMrr: 125,
      avgLtv: 890,
      churnRate: 1.2,
    },
  ],
};

// Custom cohorts
export const customCohorts: CohortGroup[] = [
  {
    id: 'cg_custom_1',
    name: 'ProductHunt Users',
    type: 'custom',
    filterRules: [{ field: 'source', operator: 'equals', value: 'producthunt' }],
    segments: [
      {
        id: 'custom_ph',
        label: 'ProductHunt',
        userCount: 45,
        retention: [100, 68, 52, 42, 35, 30, 26, 23, 20, 18, 16, 14],
        avgMrr: 32,
        avgLtv: 120,
        churnRate: 15,
      },
    ],
  },
  {
    id: 'cg_custom_2',
    name: 'Referral Users',
    type: 'custom',
    filterRules: [{ field: 'source', operator: 'equals', value: 'referral' }],
    segments: [
      {
        id: 'custom_ref',
        label: 'Parrainage',
        userCount: 28,
        retention: [100, 92, 88, 85, 82, 80, 78, 76, 74, 72, 70, 68],
        avgMrr: 78,
        avgLtv: 680,
        churnRate: 3,
      },
    ],
  },
];

export function getCohortsByType(type: CohortGroup['type']): CohortGroup | CohortGroup[] | null {
  switch (type) {
    case 'acquisition_month':
      return {
        id: 'cg_month',
        name: 'Par mois d\'acquisition',
        type: 'acquisition_month',
        segments: mockCohorts.map(c => ({
          id: c.id,
          label: c.period,
          userCount: c.usersCount,
          retention: c.retention,
          avgMrr: c.avgMrr,
          avgLtv: c.avgLtv,
          churnRate: c.churnRate,
        })),
      };
    case 'price':
      return cohortsByPrice;
    case 'promo':
      return cohortsByPromo;
    case 'tenure':
      return cohortsByTenure;
    case 'custom':
      return customCohorts;
    default:
      return null;
  }
}
