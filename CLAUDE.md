# CLAUDE.md - Projet Abo

## règles de base
Ne lis que les fichiers nécessaires.
Pose toujours des questions avant d'agir ou de lire un fichier si la demande ne te parait pas claire.

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
    /products               # API Brand Lab v2 (produits)
    /plans                  # API Brand Lab v2 (plans)
    /sdk
      /events/route.ts      # Réception événements SDK (auth via x-abo-key)
      /api-key/route.ts     # Gestion clé API (auto-génération)
      /chat/route.ts        # Chatbot d'aide à l'intégration (Groq streaming)
    /cron
      /recovery/route.ts
      /retention/route.ts
      /conversion/route.ts
      /onboarding/route.ts
      /analyze-patterns/route.ts
  /dashboard
    /integrations           # Page intégrations (Stripe + SDK + chatbot)

/lib
  /agents
    /core
      /embeddings.ts        # Génération d'embeddings
      /memory.ts            # Système de mémoire
      /reasoning.ts         # Moteur de raisonnement (6 étapes)
      /learning.ts          # Système d'apprentissage
    /agents
      /base-agent.ts        # Classe abstraite BaseAgent
      /recovery-agent.ts    # Agent de récupération paiements
      /retention-agent.ts   # Agent de rétention
      /conversion-agent.ts  # Agent de conversion
      /onboarding-agent.ts  # Agent d'onboarding
      /orchestrator.ts      # Orchestrateur des agents
      /email-sender.ts      # Envoi d'emails via Resend
    /helpers
      /get-subscriber-features.ts  # Helper pour récupérer les features d'un subscriber
  /supabase
    /client.ts
    /server.ts
  /stripe
    /index.ts

/components
  /ui
    /IntegrationChatbot.tsx  # Widget chatbot flottant (Groq streaming)
    /AgentIcon.tsx           # Icônes des types d'agents

/public
  /abo-analytics.js          # SDK navigateur (fichier statique)

/supabase
  /migrations                # Migrations DB (001-013)
```

## Tables Supabase

### Utilisateurs et Subscribers

```sql
-- Utilisateurs Abo
user (
  id, email, name, stripe_account_id, stripe_access_token,
  stripe_refresh_token, stripe_connected_at, company_name,
  sdk_api_key
)

-- Subscribers (clients des users d'Abo)
subscriber (
  id, user_id, email, name, stripe_customer_id,
  plan_name, mrr, subscription_status, health_score,
  last_payment_status, last_payment_at, current_period_end,
  trial_end, cancel_at_period_end, entitled_features, product_id, phone
)
```

### Brand Lab v2 (Produits, Features, Plans)

```sql
-- Produits (multi-produits par user)
product (
  id, user_id, name, description, product_type,
  aha_moment_description, target_audience,
  created_at, updated_at
)

-- Features détaillées
product_feature (
  id, product_id, feature_key, name,
  description_short, description_long, benefit,
  how_to_access, use_cases[], keywords[],
  is_core, created_at, updated_at
)

-- Plans (sync depuis Stripe + enrichissement)
plan (
  id, user_id, product_id, stripe_product_id, stripe_price_id,
  name, description, price_amount, price_currency, billing_interval,
  features_from_stripe[], features_manual[], is_active,
  created_at, updated_at
)

-- Liaison plan <-> features avec limites
plan_feature (
  id, plan_id, feature_id, limit_value, limit_description
)
```

### Système d'agents

```sql
-- Configuration des agents
agent_config (
  id, user_id, agent_type, is_active, confidence_level,
  strategy_template, strategy_config, offers_config, limits_config,
  action_rules, conversion_triggers, retention_triggers, recovery_triggers,
  onboarding_sequence, onboarding_triggers
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
```

### SDK & Tracking comportemental

```sql
-- Événements comportementaux du SDK
behavioral_event (
  id, user_id, subscriber_id, visitor_id, email,
  stripe_customer_id, external_user_id,
  event_type, event_name, event_data,
  page_url, page_title, page_path, referrer,
  session_id, device_type, browser, os,
  screen_width, screen_height, event_at, created_at
)
-- event_type: page_view, click, scroll, session_start, session_end, feature_use, custom, identify
```

## Système d'agents IA

### Agents existants

| Agent | Rôle | Triggers |
|-------|------|----------|
| Recovery | Récupérer les paiements échoués | payment_failed, payment_requires_action |
| Retention | Empêcher les annulations | cancel_pending, subscription_canceled, downgrade |
| Conversion | Convertir les trials/freemium | trial_ending, trial_expired, freemium_inactive |
| Onboarding | Activer les nouveaux clients | subscription_created, trial_started |

### Flux de traitement d'un événement

```
1. Webhook Stripe reçu (ex: invoice.payment_failed)
2. Orchestrator identifie l'agent approprié
3. Agent.handleEvent() :
   a. buildSituation() - Construit le contexte
   b. checkLimits() - Vérifie les limites
   c. reasoning.reason() - Raisonnement en 6 étapes
   d. checkRequiresApproval() - HITL selon confidence_level
   e. createAction() - Crée l'action en base
   f. executeAction() - Exécute si auto-approuvé
4. Email généré et envoyé via Groq + Resend
5. Outcome détecté plus tard → learning.learnFromOutcome()
```

### Les 6 étapes du raisonnement

1. **gatherContext** - Collecte infos subscriber et trigger
2. **retrieveMemories** - Recherche mémoires pertinentes (vector search)
3. **findSimilarEpisodes** - Épisodes passés similaires
4. **generateOptions** - Génère 2-4 options via LLM
5. **evaluateOptions** - Score chaque option (0-1)
6. **makeDecision** - Sélectionne la meilleure option

### Modes de validation (confidence_level)

- `review_all` : Toutes les actions nécessitent approbation humaine
- `auto_with_copy` : Actions auto si confiance > 0.6, sinon review
- `full_auto` : Tout est automatique (sauf exceptions sensibles)

## Brand Lab v2 - Logique des features

### Récupération des features d'un subscriber

Le helper `getSubscriberFeatures()` détermine quelles features un subscriber peut utiliser :

```typescript
async function getSubscriberFeatures(subscriberId: string): Promise<{
  features: ProductFeature[];
  isConfigured: boolean;
  fallbackMode: 'specific' | 'plan_default' | 'generic';
}>
```

| entitled_features | Features du plan | Résultat |
|-------------------|------------------|----------|
| ✅ Renseignées | - | `specific` : features du subscriber |
| ❌ Vides | ✅ Configurées | `plan_default` : features du plan |
| ❌ Vides | ❌ Vides | `generic` : pas de features spécifiques |

### Contrainte critique pour les agents

**Les agents ne doivent JAMAIS inventer ou supposer des features.**
- Mode `specific` ou `plan_default` : parler uniquement des features configurées
- Mode `generic` : onboarding/communication généraliste sur le produit, sans mentionner de features spécifiques

## SDK Abo (Tracking comportemental)

### Architecture
- **Fichier** : `/public/abo-analytics.js` (script statique ~5KB)
- **API** : `POST /api/sdk/events` (auth via header `x-abo-key`)
- **Clé API** : `GET/POST /api/sdk/api-key` (auto-génération, format `abo_sk_...`)
- **Chatbot** : `POST /api/sdk/chat` (streaming SSE via Groq)

### Fonctionnement du SDK navigateur
- Auto-tracking : pages (+ SPA), clics, scroll, sessions, appareil/navigateur/OS
- Identification : `AboAnalytics.identify({ email | stripeCustomerId | userId })`
- Features : `AboAnalytics.feature('feature_key')` ou attribut HTML `data-abo-track`
- Événements custom : `AboAnalytics.track('event_name', data)`
- Batch toutes les 5s, visitor_id persistant (localStorage), sessions (sessionStorage, timeout 30min)

## Webhooks Stripe

### Configuration

- **URL** : `https://abo-six.vercel.app/api/stripe/webhook`
- **Écoute** : Événements des **comptes connectés** (pas le compte principal)
- **Secret** : `STRIPE_WEBHOOK_SECRET`

### Événements écoutés

- customer.updated
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
- invoice.payment_succeeded

### Middleware

Les routes `/api/stripe/webhook*` et `/api/cron/*` sont exclues de l'authentification.

## Variables d'environnement

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
CRON_SECRET=...
```

## Décisions techniques clés

1. **Stripe Connect** : Header `stripeAccount` pour accéder aux comptes connectés
2. **Embeddings** : 1536 dimensions (pgvector)
3. **Fallback IA** : Template par défaut si Groq échoue
4. **HITL** : Configurable par agent
5. **Apprentissage** : Épisodes individuels + patterns (cron daily)
6. **Features** : Source de vérité = metadata Stripe ou config manuelle, jamais d'invention

## Conventions de code

- API routes en `/app/api/[...]/route.ts`
- Composants React en PascalCase
- Fonctions utilitaires en camelCase
- Tables Supabase en snake_case
- Types TypeScript dans `/lib/agents/types/`
- RLS activé sur toutes les tables
- UI entièrement en **français** (textes, emails agents, chatbot, erreurs)

---

## RÈGLES DE MAINTENANCE OBLIGATOIRES

### Chatbot d'intégration

**Fichier** : `/app/api/sdk/chat/route.ts` → constante `SYSTEM_PROMPT`

Le chatbot (widget flottant sur `/dashboard/integrations`) aide les utilisateurs non-techniques à installer le SDK Abo. Il est alimenté par Groq (llama-3.3-70b-versatile) en streaming.

**RÈGLE 1 : Le `SYSTEM_PROMPT` ne doit JAMAIS dépasser 1200 mots.** Au-delà, le modèle perd en précision. En cas de mise à jour, couper l'information la moins critique en priorité.

**RÈGLE 2 : Le `SYSTEM_PROMPT` DOIT être mis à jour à chaque modification de :**
1. **SDK** : `public/abo-analytics.js` (nouvelles méthodes, événements, options)
2. **API SDK** : `/api/sdk/events` ou `/api/sdk/api-key` (paramètres, auth, formats)
3. **Schéma DB** : tables `behavioral_event`, `subscriber`, `user.sdk_api_key`
4. **Agents** : nouveaux types, triggers, consommation des données comportementales
5. **Brand Lab** : types de features, schéma `product_feature`, options de config
6. **Page Intégrations** : nouvelles étapes, méthodes d'identification, plateformes supportées

**Comment mettre à jour** : chercher `SYSTEM_PROMPT` dans `/app/api/sdk/chat/route.ts`, le prompt est organisé en sections étiquetées (ÉTAPE 1, 2, 3, FAQ, RÈGLES).
