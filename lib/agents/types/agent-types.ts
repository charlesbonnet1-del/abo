// Types de base pour les agents IA

export type AgentType = 'recovery' | 'retention' | 'conversion' | 'onboarding';

export type MemoryType = 'interaction' | 'preference' | 'pattern' | 'outcome' | 'fact';

export type OutcomeType = 'success' | 'failure' | 'partial' | 'pending' | 'ignored';

export type ReasoningStepType =
  | 'context_gathering'
  | 'memory_retrieval'
  | 'option_generation'
  | 'evaluation'
  | 'decision'
  | 'plan_creation';

export type PlanStatus = 'active' | 'completed' | 'failed' | 'abandoned' | 'paused';

export type PlanStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

// ============================================
// MEMORY
// ============================================

export interface Memory {
  id: string;
  userId: string;
  subscriberId?: string;
  agentType: AgentType | 'global';
  memoryType: MemoryType;
  content: Record<string, unknown>;
  importanceScore: number;
  accessCount: number;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
}

export interface MemorySearchResult extends Memory {
  similarity: number;
}

export interface InteractionMemory {
  type: string; // 'email_sent', 'email_opened', 'discount_offered', etc.
  subject?: string;
  response?: string; // 'opened', 'clicked', 'ignored', 'replied'
  date: string;
  details?: Record<string, unknown>;
}

export interface PreferenceMemory {
  prefersDiscount?: boolean;
  preferredTone?: 'formal' | 'friendly' | 'urgent';
  bestContactTime?: 'morning' | 'afternoon' | 'evening';
  responsiveTo?: string[]; // ['urgency', 'value', 'social_proof']
  avoidTopics?: string[];
}

export interface PatternMemory {
  trigger: string;
  bestAction: string;
  successRate: number;
  sampleSize: number;
  applicableTo?: Record<string, unknown>;
}

export interface OutcomeMemory {
  action: string;
  result: 'positive' | 'negative' | 'neutral';
  revenueImpact?: number; // en centimes
  details?: Record<string, unknown>;
}

export interface FactMemory {
  plan?: string;
  tenureMonths?: number;
  totalSpent?: number; // en centimes
  supportTickets?: number;
  lastLogin?: string;
  customFields?: Record<string, unknown>;
}

// ============================================
// SUBSCRIBER SNAPSHOT
// ============================================

export interface SubscriberSnapshot {
  id: string;
  email: string;
  name?: string;
  plan?: string;
  mrr: number; // en centimes
  tenureMonths: number;
  healthScore?: number;
  lastPaymentStatus?: string;
  lastPaymentAt?: string;
  previousInteractions: number;
  totalSpent?: number; // en centimes
  country?: string;
}

// ============================================
// SITUATION & CONTEXT
// ============================================

export interface Situation {
  subscriber: SubscriberSnapshot;
  trigger: string;
  context: Record<string, unknown>;
  timestamp: Date;
}

// ============================================
// EPISODES
// ============================================

export interface Episode {
  id: string;
  userId: string;
  agentType: AgentType;
  subscriberId?: string;
  situation: Situation;
  actionTaken: ActionTaken;
  outcome: OutcomeType;
  outcomeDetails?: Record<string, unknown>;
  lessonsLearned?: Lesson[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface EpisodeSearchResult extends Episode {
  similarity: number;
}

export interface ActionTaken {
  type: string; // 'email', 'sms', 'discount', 'pause', etc.
  strategy: string; // 'friendly', 'urgent', 'value_focused', etc.
  details: Record<string, unknown>;
}

export interface Lesson {
  insight: string;
  confidence: number; // 0 à 1
  applicableTo: Record<string, unknown>;
  recommendation?: string;
}

// ============================================
// REASONING
// ============================================

export interface ReasoningStep {
  stepNumber: number;
  stepType: ReasoningStepType;
  thought: string; // Explication en langage naturel
  data?: Record<string, unknown>;
  confidenceScore?: number;
  durationMs?: number;
}

export interface ActionOption {
  action: string;
  strategy: string;
  details: Record<string, unknown>;
  predictedSuccessRate?: number;
  reasoning?: string;
}

export interface EvaluatedOption extends ActionOption {
  score: number;
  reasons: string[];
}

// ============================================
// PLANS
// ============================================

export interface Plan {
  id: string;
  userId: string;
  subscriberId: string;
  agentType: AgentType;
  goal: string;
  steps: PlanStep[];
  currentStep: number;
  contingencies: Record<string, Contingency>;
  status: PlanStatus;
  startedAt: Date;
  completedAt?: Date;
  successScore?: number;
}

export interface PlanStep {
  step: number;
  action: string;
  status: PlanStepStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  result?: string;
  condition?: string; // Pour les étapes conditionnelles
}

export interface Contingency {
  condition: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  immediate?: boolean;
}

// ============================================
// AGENT CONFIG (étendu)
// ============================================

export interface AgentConfig {
  id: string;
  userId: string;
  agentType: AgentType;
  isActive: boolean;
  confidenceLevel: 'review_all' | 'auto_with_copy' | 'full_auto';
  notificationChannels: string[];
  strategyTemplate: 'conservative' | 'moderate' | 'aggressive' | 'custom';
  strategyConfig: Record<string, unknown>;
  offersConfig: Record<string, unknown>;
  limitsConfig: LimitsConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface LimitsConfig {
  maxBudgetMonth?: number; // en centimes
  maxActionsDay: number;
  maxEmailsClientWeek: number;
  maxOffersClientYear: number;
  sendHoursStart: number; // 0-23
  sendHoursEnd: number; // 0-23
  timezone: string;
  noWeekend: boolean;
}

// ============================================
// BRAND SETTINGS (étendu)
// ============================================

export interface BrandSettings {
  id: string;
  userId: string;
  companyName?: string;
  productType?: string;
  productDescription?: string;
  industry?: string;
  targetAudience?: string;
  features?: Feature[];
  ahaMomentKnown: boolean;
  ahaMomentDescription?: string;
  objectives?: Objective[];
  tone: 'formal' | 'neutral' | 'casual' | 'friendly';
  humor: 'none' | 'subtle' | 'yes';
  language: string;
  values?: string[];
  neverSay?: string[];
  alwaysMention?: string[];
  exampleEmails?: string[];
  signature?: string;
  segmentationEnabled: boolean;
  segments?: Segment[];
}

export interface Feature {
  name: string;
  description: string;
  valueProp: string;
  paidOnly: boolean;
}

export interface Objective {
  type: string;
  config: Record<string, unknown>;
  customDescription?: string;
}

export interface Segment {
  name: string;
  conditions: Record<string, unknown>;
  strategy: 'conservative' | 'moderate' | 'aggressive';
}

// ============================================
// FEEDBACK
// ============================================

export interface AgentFeedback {
  id: string;
  userId: string;
  agentActionId?: string;
  subscriberId?: string;
  feedbackType: 'approved' | 'rejected' | 'converted' | 'churned' | 'recovered' | 'manual_rating';
  context?: Record<string, unknown>;
  rating?: number; // 1-5
  comment?: string;
  createdAt: Date;
}

// ============================================
// REASONING LOGS
// ============================================

export interface ReasoningLog {
  id: string;
  agentActionId: string;
  stepNumber: number;
  stepType: ReasoningStepType;
  thought: string;
  data?: Record<string, unknown>;
  confidenceScore?: number;
  durationMs?: number;
  createdAt: Date;
}
