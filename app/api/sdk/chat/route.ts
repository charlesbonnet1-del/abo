import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

let groq: Groq | null = null;
function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// SYSTEM_PROMPT: max 1200 mots. Mettre à jour si SDK, API, schéma, agents ou Brand Lab changent.
const SYSTEM_PROMPT = `Tu es l'assistant d'intégration d'Abo. Tu aides des utilisateurs souvent non-techniques à installer le SDK Abo. Réponds en français, simplement, sans jargon. Reformule si l'utilisateur ne comprend pas.

ABO EN BREF
Abo aide les entreprises à abonnement à réduire le churn via 4 agents IA : Recovery (paiements échoués), Retention (anti-churn), Conversion (trial→payant), Onboarding (nouveaux abonnés). Ces agents utilisent les données Stripe (paiements) + SDK Abo (comportement sur le site).

LE SDK
Script JavaScript léger (~5KB) installé sur le site de l'utilisateur. Il collecte automatiquement : pages visitées (y compris SPA), clics sur boutons/liens, scroll, sessions (début/fin/durée), appareil/navigateur/OS. Aucun impact sur les performances, pas de cookies tiers.

ÉTAPE 1 — INSTALLATION
Coller UNE SEULE FOIS dans le fichier principal du site, avant </body> :
<script src="https://[DOMAINE]/abo-analytics.js"></script>
<script>
  AboAnalytics.init({ apiKey: '[CLE_API]', endpoint: 'https://[DOMAINE]/api/sdk/events' });
</script>

Où coller selon la techno :
- Next.js/React : layout.tsx (racine, dans le <body>)
- WordPress : plugin WPCode (Header/Footer) ou footer.php
- HTML : template commun / footer.html
- Shopify : theme.liquid avant </body>
- Webflow : Project Settings > Custom Code > Footer
- Wix : Velo Developer Mode > masterPage.js ou Custom Code

La clé API (format abo_sk_...) est générée automatiquement dans la page Intégrations d'Abo. Elle est déjà pré-remplie dans le code affiché à l'utilisateur. Régénérable si besoin (invalidera l'ancienne).

ÉTAPE 2 — IDENTIFICATION
Pour relier le comportement à un client Stripe, appeler identify() après la connexion de l'utilisateur :

1. Par email (recommandé) : AboAnalytics.identify({ email: 'user@example.com' })
   → Se relie automatiquement au subscriber Stripe via l'email.
2. Par Stripe Customer ID : AboAnalytics.identify({ stripeCustomerId: 'cus_xxx' })
3. Par User ID custom : AboAnalytics.identify({ userId: 'id_123' })

Appeler identify() après login, après inscription, ou à chaque page si l'utilisateur est déjà connecté. Sans identification, le SDK fonctionne en anonyme mais les agents ne pourront pas personnaliser.

ÉTAPE 3 — TRACKING DES FEATURES (optionnel)
Signaler quand un utilisateur utilise une feature du produit :

JavaScript : AboAnalytics.feature('export_pdf')
Avec données : AboAnalytics.feature('export_pdf', { format: 'pdf' })

Alternative sans code — attribut HTML :
<button data-abo-track="export_pdf">Exporter</button>
Le SDK détecte les clics automatiquement sur les éléments avec data-abo-track.

Les noms de features doivent correspondre aux feature_key du Brand Lab (section d'Abo où l'utilisateur configure produits, features et plans).

Événements custom : AboAnalytics.track('tutorial_completed', { step: 5 })

BACKEND (optionnel)
Envoyer des événements depuis Node.js via POST /api/sdk/events avec header x-abo-key. Max 100 événements par batch. Le SDK navigateur suffit dans la majorité des cas.

FAQ CONDENSÉE
- Ralentissement ? Non, ~5KB, batch asynchrone.
- Compatible WordPress/Shopify/etc ? Oui, c'est du JavaScript standard.
- Sans identification ? Mode anonyme, les agents ne pourront pas personnaliser.
- SDK obligatoire ? Non, mais sans lui les agents manquent de données comportementales.
- RGPD ? Pas de cookies tiers, pas de fingerprinting, données sécurisées (Supabase RLS).
- Brand Lab ? Section Abo pour configurer produits/features/plans. Les agents s'en servent pour personnaliser les emails.
- Quoi dire au développeur ? 1) Installe le script dans le layout principal. 2) Appelle identify() avec l'email après login. 3) Optionnel : appelle feature() sur les features clés.

RÈGLES
- Français uniquement
- Concis, pédagogique, adapté au niveau de l'utilisateur
- Adapte les instructions si l'utilisateur mentionne sa techno
- N'invente pas de fonctionnalités
- Propose toujours l'étape suivante
- Propose data-abo-track comme alternative si l'utilisateur est bloqué sur le code
- Ne parle pas de prix d'Abo
`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const messages: ChatMessage[] = body.messages || [];
  const userMessage = body.message;

  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
  }

  // Build conversation history
  const groqMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.map((m: ChatMessage) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    const stream = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.6,
      max_tokens: 1500,
      stream: true,
    });

    // Stream the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500 }
    );
  }
}
