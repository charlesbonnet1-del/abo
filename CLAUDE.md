# CLAUDE.md - Projet Abo

## Vue d'ensemble

Abo est une plateforme SaaS B2B qui fournit des agents IA intelligents pour aider les entreprises SaaS à gérer leurs abonnés. Les agents gèrent automatiquement le recovery (paiements échoués), la rétention (annulations), la conversion (trials) et l'onboarding (nouveaux clients).

## Stack technique

- **Frontend** : Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes, Supabase (PostgreSQL + Auth + RLS)
- **IA** : Groq API (llama-3.3-70b-versatile), pgvector pour embeddings
- **Paiements** : Stripe Connect (multi-tenant)
- **Email** : Resend
- **Déploiement** : Vercel

## Architecture multi-tenant

```
Abo (Plateforme)
└── User d'Abo (ex: Charles)
    └── Compte Stripe Connect (acct_xxx)
        └── Subscribers (clients de Charles)
            └── Marie, Jean, Lucas...
```

L'accès aux données Stripe des comptes connectés se fait avec :
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
await stripe.customers.list({}, { stripeAccount: user.stripe_account_id });
```

## Structure des dossiers clés

```
/app
  /api
    /stripe
      /sync/route.ts        # Sync subscribers depuis Stripe Connect
      /webhook/route.ts     # Webhooks Stripe (events des comptes connectés)
      /debug/route.ts       # Debug de la connexion Stripe
    /agents
      /config/route.ts      # Config des agents
      /actions/route.ts     # Liste des actions des agents
      /learn/route.ts       # Enregistrement des outcomes
    /cron
      /recovery/route.ts    # Cron job recovery
      /retention/route.ts   # Cron job retention
      /conversion/route.ts  # Cron job conversion
      /analyze-patterns/route.ts  # Analyse des patterns d'apprentissage
  /dashboard              # Pages du dashboard

/lib
  /agents
    /core
      /embeddings.ts      # Génération d'embeddings (OpenAI compatible)
      /memory.ts          # Système de mémoire (agent_memory table)
      /reasoning.ts       # Moteur de raisonnement (6 étapes)
      /learning.ts        # Système d'apprentissage (episodes, leçons)
    /agents
      /base-agent.ts      # Classe abstraite BaseAgent
      /recovery-agent.ts  # Agent de récupération paiements
      /retention-agent.ts # Agent de rétention
      /conversion-agent.ts # Agent de conversion
      /orchestrator.ts    # Orchestrateur des agents
      /email-sender.ts    # Envoi d'emails via Resend
  /supabase
    /client.ts           # Client Supabase (browser)
    /server.ts           # Client Supabase (server)
  /stripe
    /index.ts            # Client Stripe
```

## Tables Supabase principales

### Tables existantes et fonctionnelles

```sql
-- Utilisateurs Abo
user (
  id, email, name, stripe_account_id, stripe_access_token,
  stripe_refresh_token, stripe_connected_at, company_name
)

-- Subscribers (clients des users d'Abo)
subscriber (
  id, user_id, email, name, stripe_customer_id,
  plan_name, mrr, subscription_status, health_score,
  last_payment_status, last_payment_at, current_period_end,
  trial_end, cancel_at_period_end, entitled_features, product_id
)

-- Configuration des agents
agent_config (
  id, user_id, agent_type, is_active, confidence_level,
  strategy_template, strategy_config, offers_config, limits_config,
  action_rules, conversion_triggers, retention_triggers, recovery_triggers
)

-- Actions des agents
agent_action (
  id, user_id, agent_type, action_type, subscriber_id,
  description, status, result, executed_at
)

-- Communications envoyées
agent_communication (
  id, subscriber_id, agent_type, channel, subject, content,
  status, sent_at, action_id
)

-- Mémoire des agents (avec pgvector)
agent_memory (
  id, user_id, agent_type, subscriber_id, memory_type,
  content, embedding vector(1536), importance, last_accessed_at
)

-- Épisodes d'apprentissage
agent_episodes (
  id, user_id, agent_type, subscriber_id, situation,
  situation_embedding vector(1536), action_taken, outcome,
  outcome_details, lessons_learned
)

-- Logs de raisonnement
agent_reasoning_logs (
  id, agent_action_id, step_number, step_type, thought,
  data, confidence_score, duration_ms
)

-- Brand settings (à migrer vers Brand Lab v2)
brand_settings (
  id, user_id, company_name, product_type, product_description,
  tone, humor, language, features, aha_moment_description, ...
)
```

## Système d'agents IA

### Flux de traitement d'un événement

```
1. Webhook Stripe reçu (ex: invoice.payment_failed)
2. Orchestrator identifie l'agent approprié (Recovery)
3. Agent.handleEvent() :
   a. buildSituation() - Construit le contexte
   b. checkLimits() - Vérifie les limites (max emails/jour, etc.)
   c. reasoning.reason() - Raisonnement en 6 étapes
   d. checkRequiresApproval() - HITL selon confidence_level
   e. createAction() - Crée l'action en base
   f. executeAction() - Exécute si auto-approuvé
4. Email généré et envoyé via Groq + Resend
5. Outcome détecté plus tard → learning.learnFromOutcome()
```

### Les 6 étapes du raisonnement (reasoning.ts)

1. **gatherContext** - Collecte infos subscriber et trigger
2. **retrieveMemories** - Recherche mémoires pertinentes (vector search)
3. **findSimilarEpisodes** - Épisodes passés similaires
4. **generateOptions** - Génère 2-4 options via LLM
5. **evaluateOptions** - Score chaque option (0-1)
6. **makeDecision** - Sélectionne la meilleure option

### Modes de validation (confidence_level)

- `review_all` : Toutes les actions nécessitent approbation humaine
- `auto_with_copy` : Actions auto si confiance > 0.6, sinon review
- `full_auto` : Tout est automatique (sauf refunds > 30%)

### Triggers par agent

| Agent | Triggers |
|-------|----------|
| Recovery | payment_failed, payment_requires_action, invoice_payment_failed |
| Retention | cancel_pending, subscription_canceled, downgrade, inactive_subscriber |
| Conversion | trial_ending, trial_expired, freemium_inactive, freemium_active |
| Onboarding | (à définir) subscription_created, trial_started |

## Système d'apprentissage

### Flux d'apprentissage

```
1. Action exécutée (email envoyé à Marie)
2. Plus tard : webhook invoice.payment_succeeded
3. Système détecte que c'est un SUCCESS pour l'action précédente
4. learning.learnFromOutcome(actionId, 'success', details)
5. Extraction de leçons via IA :
   - "Les emails avec ton 'aide' fonctionnent bien pour les Pro à 99€"
6. Création d'un épisode (situation → action → outcome)
7. Mise à jour des mémoires (patterns, préférences)
8. Prochaine situation similaire : agent utilise ces apprentissages
```

### Détection automatique des outcomes (à implémenter)

- `invoice.payment_succeeded` après `payment_failed` → SUCCESS pour Recovery
- `customer.subscription.updated` (cancel_at_period_end=false) → SUCCESS pour Retention
- `customer.subscription.created` (après trial) → SUCCESS pour Conversion

## Brand Lab v2 (À IMPLÉMENTER)

### Pourquoi cette évolution

Le Brand Lab actuel est trop simple :
- Un seul produit par user
- Features en simple array de strings
- Pas de lien avec les plans Stripe
- Impossible de savoir précisément quelles features a chaque subscriber

### Nouvelle architecture

```
PRODUITS (multi-produits)
└── Produit "Mon SaaS"
    ├── Description, aha moment, target audience
    └── FEATURES
        ├── Feature "Dashboard" (key: dashboard)
        │   ├── description_short, description_long
        │   ├── benefit, how_to_access
        │   └── use_cases, keywords, is_core
        └── Feature "Export PDF" (key: export)

PLANS (sync Stripe + enrichissement)
└── Plan "Pro" (stripe_product_id: prod_xxx)
    ├── Nom, prix, intervalle (depuis Stripe)
    ├── features_from_stripe: ["dashboard", "export"] (metadata Stripe)
    ├── features_manual: [] (override si pas de metadata)
    └── description marketing (enrichissement)

SUBSCRIBERS
└── Jean
    ├── Plan: Pro
    └── entitled_features: ["dashboard", "export"]
```

### Problème du "grandfathering"

Quand un plan évolue (ajout de features), les anciens abonnés ne doivent pas automatiquement avoir les nouvelles features.

**Solution** : 
1. Features stockées dans metadata Stripe par Price (pas Product)
2. Chaque Price peut avoir ses propres features
3. Ou : entitled_features stockées directement sur le subscriber lors de la souscription

### Tables à créer

```sql
-- Produits
CREATE TABLE product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT,
  aha_moment_description TEXT,
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features détaillées
CREATE TABLE product_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES product(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description_short TEXT,
  description_long TEXT,
  benefit TEXT,
  how_to_access TEXT,
  use_cases TEXT[],
  keywords TEXT[],
  is_core BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, feature_key)
);

-- Plans (sync Stripe)
CREATE TABLE plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES product(id) ON DELETE SET NULL,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_amount INTEGER,
  price_currency TEXT DEFAULT 'eur',
  billing_interval TEXT,
  features_from_stripe TEXT[],
  features_manual TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liaison plan <-> features avec limites
CREATE TABLE plan_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plan(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES product_feature(id) ON DELETE CASCADE,
  limit_value INTEGER,
  limit_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, feature_id)
);
```

### Helper pour les agents

```typescript
// /lib/agents/helpers/get-subscriber-features.ts
export async function getSubscriberFeatures(subscriberId: string): Promise<{
  features: ProductFeature[];
  isConfigured: boolean;
  fallbackMode: 'specific' | 'plan_default' | 'generic';
}> {
  // 1. Chercher entitled_features sur le subscriber
  // 2. Sinon, chercher les features du plan
  // 3. Sinon, mode générique (pas de features spécifiques)
}
```

### Comportement de l'agent d'onboarding

| Configuration | Comportement |
|---------------|--------------|
| Features configurées + metadata Stripe | Parle précisément des features du subscriber |
| Features configurées + PAS de metadata | Parle des features "core" du plan |
| PAS de features configurées | Onboarding générique (parle du produit globalement) |

**RÈGLE CRITIQUE** : L'agent ne doit JAMAIS inventer ou supposer des features. Il ne parle QUE de ce qui est explicitement configuré.

## Agent d'Onboarding (À IMPLÉMENTER)

### Triggers

- `subscription_created` - Nouvelle souscription
- `trial_started` - Début de trial
- `first_login` - Première connexion (si trackée)

### Séquence type

```
Jour 0 : Email de bienvenue + feature principale
Jour 2 : Email "Avez-vous essayé [feature X] ?"
Jour 5 : Email "Astuce : [comment tirer le max de feature Y]"
Jour 7 : Email "Besoin d'aide ?" (si inactif)
```

### Contraintes

1. Ne parler QUE des features auxquelles le subscriber a accès
2. Personnaliser selon le plan (ne pas mentionner des features premium à un plan basic)
3. Adapter le ton selon les brand_settings
4. Respecter les limites (max emails par semaine)

## Webhooks Stripe

### Configuration actuelle

- **URL** : `https://abo-six.vercel.app/api/stripe/webhook`
- **Écoute** : Événements des **comptes connectés** (pas le compte principal)
- **Secret** : `STRIPE_WEBHOOK_SECRET` dans Vercel

### Événements écoutés

- customer.updated
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
- invoice.payment_succeeded

### Middleware

Les routes `/api/stripe/webhook*` et `/api/cron/*` sont exclues de l'authentification dans `middleware.ts`.

## Variables d'environnement requises

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# IA
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk_... (pour embeddings)

# Email
RESEND_API_KEY=re_...

# Cron
CRON_SECRET=... (pour sécuriser les cron jobs)
```

## Commandes utiles pour tester

```javascript
// Tester la sync Stripe
fetch('/api/stripe/sync', { method: 'POST' })
  .then(r => r.json()).then(console.log);

// Voir les actions des agents
fetch('/api/agents/actions')
  .then(r => r.json()).then(console.log);

// Debug connexion Stripe
fetch('/api/stripe/debug')
  .then(r => r.json()).then(console.log);

// Stats d'apprentissage
fetch('/api/agents/learning-stats?agentType=recovery')
  .then(r => r.json()).then(console.log);
```

## Décisions techniques clés

1. **Stripe Connect** : On utilise le header `stripeAccount` pour accéder aux données des comptes connectés, pas le token OAuth comme clé API.

2. **Embeddings** : 1536 dimensions (compatible OpenAI), stockés avec pgvector.

3. **Fallback IA** : Si Groq échoue, on utilise un template par défaut pour les emails.

4. **HITL** : Configurable par agent (review_all, auto_with_copy, full_auto).

5. **Apprentissage** : Épisodes individuels (immédiat) + analyse de patterns (cron daily).

6. **Features** : Source de vérité = metadata Stripe ou config manuelle. L'agent ne devine jamais.

## Prochaines étapes prioritaires

1. **Brand Lab v2** : Multi-produits, features détaillées, sync plans Stripe
2. **Agent d'onboarding** : Utilisant les features du Brand Lab v2
3. **Détection outcomes** : Connecter les webhooks à l'apprentissage
4. **UI améliorations** : Afficher le contenu des emails, infos subscribers enrichies

## Conventions de code

- API routes en `/app/api/[...]/route.ts`
- Composants React en PascalCase
- Fonctions utilitaires en camelCase
- Tables Supabase en snake_case
- Types TypeScript dans `/lib/agents/types/`
- RLS activé sur toutes les tables avec policies appropriées
