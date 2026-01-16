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
  const convertedFromTrial = activeUsers.filter(u => u.ltv > 0).length; // simplified
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
