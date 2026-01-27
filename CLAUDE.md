# Abo - Project Guidelines

## Overview

Abo is a SaaS platform that helps subscription businesses reduce churn and increase revenue through autonomous AI agents. It connects to Stripe for transactional data and uses a custom SDK for behavioral tracking.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Payments**: Stripe Connect (multi-tenant)
- **AI**: Groq Cloud (LLaMA 3.3 70B Versatile) for email generation and chatbot
- **Embeddings**: 1536-dimension vectors for agent memory (Supabase pgvector)

## Key Architecture

### Agent System (`/lib/agents/`)
- **BaseAgent** (`agents/base-agent.ts`): Abstract class with lifecycle: initialize → handleEvent → reason → createAction → execute
- **4 Agent Types**: recovery, retention, conversion, onboarding
- **Orchestrator** (`agents/orchestrator.ts`): Coordinates all agents, routes events
- **Core Intelligence**: Memory (vector search), Reasoning (multi-step), Learning (episode-based)
- **Groq Integration** (`groq.ts`): Email generation with brand voice

### SDK (`/public/abo-analytics.js` + `/app/api/sdk/`)
- Browser SDK for behavioral tracking (auto: page views, clicks, scroll, sessions)
- API endpoint `/api/sdk/events` receives events (auth via `x-abo-key` header)
- API key management `/api/sdk/api-key` (auto-generates on first visit)

### Brand Lab (`/components/brand-lab/`)
- Multi-product support with features (`product_feature` table)
- Plans synced from Stripe with feature mappings
- Brand voice settings for email tone/style

---

## MANDATORY MAINTENANCE RULES

### Integration Chatbot System Prompt

**File**: `/app/api/sdk/chat/route.ts` → `SYSTEM_PROMPT` constant

The Integration Chatbot is a Groq-powered assistant on the Integrations page (`/dashboard/integrations`) that helps non-technical users install and configure the Abo SDK.

**RULE 1: The `SYSTEM_PROMPT` MUST NEVER exceed 1200 words.** Beyond that, the model loses focus and the responses degrade. Every update must stay within this budget. Cut the least critical information first.

**RULE 2: The `SYSTEM_PROMPT` in `/app/api/sdk/chat/route.ts` MUST be updated whenever any of the following changes occur:**

1. **SDK changes**: Any modification to `public/abo-analytics.js` (new tracking methods, API changes, new auto-tracked events, configuration options)
2. **API endpoint changes**: Modifications to `/api/sdk/events` or `/api/sdk/api-key` (new parameters, changed authentication, new response formats)
3. **Database schema changes**: New tables or columns related to the SDK or behavioral tracking (`behavioral_event`, `subscriber`, `user.sdk_api_key`)
4. **Agent system changes**: New agent types, new trigger events, changes to how agents consume behavioral data
5. **Brand Lab changes**: New feature types, changes to `product_feature` schema, new configuration options
6. **Integration page UI changes**: New steps, modified installation flow, new identification methods
7. **New platform support**: If installation instructions are added for new platforms (e.g., Framer, Bubble, etc.)

**How to update**: Search for `SYSTEM_PROMPT` in `/app/api/sdk/chat/route.ts` and update the relevant section. The prompt is organized in clearly labeled sections (ÉTAPE 1, ÉTAPE 2, etc.) and a FAQ section.

---

## File Organization

```
app/
  (app)/dashboard/         # Main authenticated dashboard
    agents/[type]/config/  # Agent configuration pages
    agents/[type]/history/ # Agent action history
    integrations/          # SDK + Stripe integration (includes chatbot)
    brand-lab/             # Product/feature/plan configuration
  api/
    sdk/                   # SDK endpoints (events, api-key, chat)
    cron/                  # Cron jobs for each agent type
    products/              # Brand Lab CRUD
    stripe/                # Stripe Connect + sync + webhooks

components/
  ui/IntegrationChatbot.tsx  # Floating chat widget (Groq-powered)
  ui/AgentIcon.tsx           # Agent type icons
  brand-lab/                 # Brand Lab components

lib/
  agents/                  # Agent system
    agents/                # Individual agent implementations
    core/                  # Memory, Reasoning, Learning
    helpers/               # Feature helpers, outcome detection
    types/                 # TypeScript type definitions
  supabase/                # Supabase client utilities

public/
  abo-analytics.js         # Browser SDK (served as static file)

supabase/
  migrations/              # Database migrations (001-013)
```

## Language

The UI is entirely in **French**. All user-facing text, agent emails, chatbot responses, and error messages are in French.
