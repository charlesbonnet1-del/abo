import Groq from 'groq-sdk';

// Lazy initialization to avoid build-time errors
let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
}

export interface BrandSettings {
  company_name?: string;
  tone?: 'formal' | 'neutral' | 'casual' | 'friendly';
  humor?: 'none' | 'subtle' | 'yes';
  language?: string;
  values?: string[];
  never_say?: string[];
  always_mention?: string[];
  signature?: string;
}

export interface EmailContext {
  subscriberName?: string;
  subscriberEmail?: string;
  planName?: string;
  mrr?: number;
  amount?: number;
  customerSince?: string;
  alertType?: string;
  opportunityType?: string;
  trialEndsAt?: string;
  daysAsFreemium?: number;
  updatePaymentUrl?: string;
  upgradeUrl?: string;
  step?: number;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

const toneDescriptions: Record<string, string> = {
  formal: 'tres professionnel et formel',
  neutral: 'professionnel mais accessible',
  casual: 'decontracte et friendly',
  friendly: 'chaleureux et proche du client'
};

const humorDescriptions: Record<string, string> = {
  none: 'Ne fais jamais d\'humour.',
  subtle: 'Tu peux faire de l\'humour subtil si approprie.',
  yes: 'Tu peux utiliser l\'humour pour rendre les messages plus engageants.'
};

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100);
}

function buildSystemPrompt(brand: BrandSettings): string {
  return `Tu es un assistant qui redige des emails pour ${brand?.company_name || 'notre entreprise'}.

TON ET STYLE :
- Ton : ${toneDescriptions[brand?.tone || 'neutral']}
- Humour : ${humorDescriptions[brand?.humor || 'none']}
- Langue : ${brand?.language || 'francais'}

VALEURS A REFLETER :
${brand?.values?.map((v: string) => `- ${v}`).join('\n') || '- Professionnalisme'}

NE JAMAIS DIRE :
${brand?.never_say?.map((v: string) => `- "${v}"`).join('\n') || '- Rien de specifique'}

TOUJOURS MENTIONNER :
${brand?.always_mention?.map((v: string) => `- ${v}`).join('\n') || '- Rien de specifique'}

SIGNATURE A UTILISER :
${brand?.signature || 'Cordialement,\nL\'equipe'}

REGLES IMPORTANTES :
- Genere un objet d'email (subject) et un corps (body)
- Le body doit etre en HTML simple (paragraphes <p>, liens <a>, boutons avec class="button")
- Sois concis mais empathique
- Ne sois jamais agressif ou desespere
- Reponds UNIQUEMENT au format JSON : {"subject": "...", "body": "..."}
- N'inclus pas de markdown dans ta reponse, juste le JSON
`;
}

function buildRecoveryPrompt(context: EmailContext): string {
  const step = context.step || 1;
  const urgencyLabels = ['', 'notification amicale', 'rappel', 'rappel important', 'dernier rappel'];
  const urgency = urgencyLabels[step] || 'rappel';

  return `Redige un email de ${urgency} pour un paiement echoue.

CLIENT :
- Nom : ${context.subscriberName || 'Client'}
- Email : ${context.subscriberEmail}
- Plan : ${context.planName || 'Abonnement'}
- Montant : ${context.amount ? formatAmount(context.amount) : 'N/A'}

ETAPE : ${step}/4

OBJECTIF : Inciter le client a mettre a jour son moyen de paiement.

LIEN A INCLURE dans un bouton : ${context.updatePaymentUrl || '[LIEN_PAIEMENT]'}

${step >= 3 ? 'ATTENTION : C\'est un des derniers rappels, ajoute un sentiment d\'urgence mais reste respectueux.' : ''}
${step === 4 ? 'C\'est le DERNIER rappel. Mentionne que l\'abonnement sera suspendu sans action.' : ''}
`;
}

function buildRetentionPrompt(context: EmailContext): string {
  return `Redige un email de retention pour un client qui souhaite annuler.

CLIENT :
- Nom : ${context.subscriberName || 'Client'}
- Client depuis : ${context.customerSince || 'quelques mois'}
- Plan actuel : ${context.planName || 'Abonnement'}
- MRR : ${context.mrr ? formatAmount(context.mrr) : 'N/A'}
- Raison de l'alerte : ${context.alertType === 'cancel_pending' ? 'Annulation programmee' : context.alertType}

OBJECTIF : Comprendre pourquoi le client veut partir et proposer une solution.

OPTIONS QUE TU PEUX PROPOSER (choisis les plus pertinentes) :
- Une pause temporaire de l'abonnement
- Une reduction de 20% pendant 3 mois
- Un downgrade vers un plan moins cher
- Un appel avec l'equipe pour discuter

IMPORTANT : Sois empathique et comprehensif. Ne sois pas desespere ou pushy.
`;
}

function buildConversionPrompt(context: EmailContext): string {
  return `Redige un email pour convertir un utilisateur gratuit en client payant.

UTILISATEUR :
- Nom : ${context.subscriberName || 'Utilisateur'}
- Inscrit depuis : ${context.customerSince || 'recemment'}
- Type : ${context.opportunityType === 'trial_ending' ? 'Fin de periode d\'essai' : 'Utilisateur freemium'}
${context.trialEndsAt ? `- Fin du trial : ${context.trialEndsAt}` : ''}
${context.daysAsFreemium ? `- Jours en freemium : ${context.daysAsFreemium}` : ''}

OBJECTIF : Montrer la valeur et inciter a l'upgrade sans etre pushy.

${context.opportunityType === 'trial_ending' ? 'CONTEXTE : Le trial expire bientot, c\'est le moment de convertir !' : ''}
${context.opportunityType === 'freemium_inactive' ? 'CONTEXTE : L\'utilisateur est en freemium depuis un moment, rappelle-lui les avantages du plan payant.' : ''}

LIEN A INCLURE pour l'upgrade : ${context.upgradeUrl || '[LIEN_UPGRADE]'}
`;
}

function parseEmailResponse(content: string): GeneratedEmail {
  try {
    // Try to parse the JSON
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.subject && parsed.body) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse email response:', e);
  }

  // Fallback
  return {
    subject: 'Message important',
    body: `<p>${content}</p>`
  };
}

export async function generateEmail(params: {
  agentType: 'recovery' | 'retention' | 'conversion';
  context: EmailContext;
  brandSettings: BrandSettings;
}): Promise<GeneratedEmail> {
  const { agentType, context, brandSettings } = params;

  const systemPrompt = buildSystemPrompt(brandSettings);

  let userPrompt: string;
  switch (agentType) {
    case 'recovery':
      userPrompt = buildRecoveryPrompt(context);
      break;
    case 'retention':
      userPrompt = buildRetentionPrompt(context);
      break;
    case 'conversion':
      userPrompt = buildConversionPrompt(context);
      break;
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }

  try {
    const response = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || '';
    return parseEmailResponse(content);
  } catch (error) {
    console.error('Groq API error:', error);
    // Return a fallback email
    return {
      subject: 'Message de ' + (brandSettings.company_name || 'notre equipe'),
      body: '<p>Nous avons un message important pour vous. Veuillez nous contacter.</p>'
    };
  }
}

export async function regenerateEmail(params: {
  agentType: 'recovery' | 'retention' | 'conversion';
  context: EmailContext;
  brandSettings: BrandSettings;
  modifications: {
    discountPercent?: number;
    discountMonths?: number;
    pauseMonths?: number;
    downgradePlan?: string;
    customNote?: string;
  };
}): Promise<GeneratedEmail> {
  const { context, brandSettings, modifications } = params;

  const systemPrompt = buildSystemPrompt(brandSettings);

  let modificationInstructions = '';
  if (modifications.discountPercent) {
    modificationInstructions += `\n- Propose une reduction de ${modifications.discountPercent}% pendant ${modifications.discountMonths || 3} mois`;
  }
  if (modifications.pauseMonths) {
    modificationInstructions += `\n- Propose une pause de ${modifications.pauseMonths} mois`;
  }
  if (modifications.downgradePlan) {
    modificationInstructions += `\n- Propose un downgrade vers le plan ${modifications.downgradePlan}`;
  }
  if (modifications.customNote) {
    modificationInstructions += `\n- Inclus cette note personnalisee : "${modifications.customNote}"`;
  }

  const userPrompt = `Regenere un email de retention avec ces modifications specifiques :
${modificationInstructions}

CLIENT :
- Nom : ${context.subscriberName || 'Client'}
- Plan actuel : ${context.planName || 'Abonnement'}
- MRR : ${context.mrr ? formatAmount(context.mrr) : 'N/A'}

OBJECTIF : Proposer les modifications demandees de maniere empathique.
`;

  try {
    const response = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || '';
    return parseEmailResponse(content);
  } catch (error) {
    console.error('Groq API error:', error);
    return {
      subject: 'Message de ' + (brandSettings.company_name || 'notre equipe'),
      body: '<p>Nous avons un message important pour vous. Veuillez nous contacter.</p>'
    };
  }
}
