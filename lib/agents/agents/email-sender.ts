import { Resend } from 'resend';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { BrandSettings, AgentType } from '../types/agent-types';
import Groq from 'groq-sdk';

// Lazy initialization
let resendInstance: Resend | null = null;
let groqInstance: Groq | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

function getGroq(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
}

interface SendEmailParams {
  to: string;
  subscriberName?: string;
  subject?: string;
  body?: string;
  agentType: AgentType;
  brandSettings: BrandSettings;
  userId: string;
  subscriberId: string;
  actionId?: string; // Link to the agent_action that triggered this email
  context?: Record<string, unknown>;
  useAdminClient?: boolean;
}

/**
 * Génère et envoie un email via un agent
 */
export async function sendAgentEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  subject?: string;
  body?: string;
  error?: string;
}> {
  const {
    to,
    subscriberName,
    subject,
    body,
    agentType,
    brandSettings,
    subscriberId,
    actionId,
    context,
    useAdminClient = false,
  } = params;

  try {
    // Si subject/body pas fournis, les générer
    let emailSubject = subject;
    let emailBody = body;

    if (!emailSubject || !emailBody) {
      const generated = await generateEmailContent({
        agentType,
        subscriberName,
        brandSettings,
        context,
      });
      emailSubject = emailSubject || generated.subject;
      emailBody = emailBody || generated.body;
    }

    // Wrapper HTML
    const htmlBody = wrapEmailHtml(emailBody, brandSettings);

    // Envoyer via Resend
    const resend = getResend();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@abo-mail.com';
    const response = await resend.emails.send({
      from: `${brandSettings.companyName || 'Abo'} <${fromEmail}>`,
      to,
      subject: emailSubject,
      html: htmlBody,
    });

    // Enregistrer dans agent_communication
    const supabase = useAdminClient ? createAdminClient() : await createClient();
    if (supabase) {
      await supabase.from('agent_communication').insert({
        subscriber_id: subscriberId,
        agent_type: agentType,
        action_id: actionId || null, // Link to the action that triggered this email
        channel: 'email',
        subject: emailSubject,
        content: emailBody,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      messageId: response.data?.id,
      subject: emailSubject,
      body: emailBody,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Génère le contenu de l'email via l'IA
 */
async function generateEmailContent(params: {
  agentType: AgentType;
  subscriberName?: string;
  brandSettings: BrandSettings;
  context?: Record<string, unknown>;
}): Promise<{ subject: string; body: string }> {
  const { agentType, subscriberName, brandSettings, context } = params;

  const systemPrompt = buildEmailSystemPrompt(brandSettings);
  const userPrompt = buildEmailUserPrompt(agentType, subscriberName, context);

  try {
    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return parseEmailResponse(response.choices[0].message.content || '');
  } catch (error) {
    console.error('Error generating email content:', error);
    return getDefaultEmail(agentType, subscriberName);
  }
}

function buildEmailSystemPrompt(brand: BrandSettings): string {
  const toneDescriptions: Record<string, string> = {
    formal: 'très professionnel et formel',
    neutral: 'professionnel mais accessible',
    casual: 'décontracté et friendly',
    friendly: 'chaleureux et proche du client',
  };

  return `Tu es un assistant qui rédige des emails pour ${brand.companyName || 'notre entreprise'}.

TON ET STYLE :
- Ton : ${toneDescriptions[brand.tone] || toneDescriptions.neutral}
- Langue : ${brand.language || 'français'}

VALEURS À REFLÉTER :
${brand.values?.map((v) => `- ${v}`).join('\n') || '- Professionnalisme'}

NE JAMAIS DIRE :
${brand.neverSay?.map((v) => `- "${v}"`).join('\n') || '- Rien de spécifique'}

SIGNATURE :
${brand.signature || "Cordialement,\nL'équipe"}

RÈGLES :
- Génère un objet d'email (subject) et un corps (body)
- Le body doit être en HTML simple (paragraphes, liens)
- Sois concis mais empathique
- Réponds UNIQUEMENT au format JSON : {"subject": "...", "body": "..."}`;
}

function buildEmailUserPrompt(
  agentType: AgentType,
  subscriberName?: string,
  context?: Record<string, unknown>
): string {
  const name = subscriberName || 'Client';

  if (agentType === 'recovery') {
    return `Rédige un email de relance pour un paiement échoué.
CLIENT : ${name}
CONTEXTE : ${JSON.stringify(context || {})}
OBJECTIF : Inciter le client à mettre à jour son moyen de paiement de manière amicale.`;
  }

  if (agentType === 'retention') {
    return `Rédige un email de rétention pour un client qui souhaite partir.
CLIENT : ${name}
CONTEXTE : ${JSON.stringify(context || {})}
OBJECTIF : Comprendre et proposer des solutions (pause, réduction, downgrade).`;
  }

  if (agentType === 'conversion') {
    return `Rédige un email pour convertir un utilisateur gratuit.
CLIENT : ${name}
CONTEXTE : ${JSON.stringify(context || {})}
OBJECTIF : Montrer la valeur et inciter à l'upgrade sans être pushy.`;
  }

  if (agentType === 'onboarding') {
    return `Rédige un email d'onboarding pour accueillir un nouveau client.
CLIENT : ${name}
CONTEXTE : ${JSON.stringify(context || {})}
OBJECTIF : Accueillir chaleureusement et guider dans les premiers pas.`;
  }

  return `Rédige un email professionnel pour ${name}.`;
}

function parseEmailResponse(content: string): { subject: string; body: string } {
  try {
    const match = content.match(/\{[\s\S]*?\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    console.error('Failed to parse email response:', e);
  }

  return {
    subject: 'Message important',
    body: '<p>Nous avons un message important pour vous.</p>',
  };
}

function getDefaultEmail(
  agentType: AgentType,
  subscriberName?: string
): { subject: string; body: string } {
  const name = subscriberName || 'Client';

  if (agentType === 'recovery') {
    return {
      subject: 'Action requise : mise à jour de votre paiement',
      body: `<p>Bonjour ${name},</p>
<p>Nous avons rencontré un problème avec votre dernier paiement.</p>
<p>Pourriez-vous mettre à jour vos informations de paiement pour éviter toute interruption de service ?</p>
<p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
<p>Cordialement,<br>L'équipe</p>`,
    };
  }

  if (agentType === 'retention') {
    return {
      subject: 'Nous aimerions comprendre votre décision',
      body: `<p>Bonjour ${name},</p>
<p>Nous avons remarqué que vous envisagez de nous quitter.</p>
<p>Avant de partir, pourriez-vous nous dire ce qui n'a pas fonctionné ? Nous serions ravis de trouver une solution ensemble.</p>
<p>Cordialement,<br>L'équipe</p>`,
    };
  }

  if (agentType === 'conversion') {
    return {
      subject: "Découvrez tout ce que vous pouvez faire",
      body: `<p>Bonjour ${name},</p>
<p>Vous utilisez notre version gratuite depuis un moment maintenant.</p>
<p>Saviez-vous que notre version premium vous offre encore plus de fonctionnalités pour booster votre productivité ?</p>
<p>Cordialement,<br>L'équipe</p>`,
    };
  }

  if (agentType === 'onboarding') {
    return {
      subject: 'Bienvenue ! Vos premiers pas',
      body: `<p>Bonjour ${name},</p>
<p>Bienvenue et merci de nous avoir choisis !</p>
<p>Nous sommes ravis de vous compter parmi nous. N'hésitez pas à explorer toutes les fonctionnalités disponibles.</p>
<p>Si vous avez des questions, nous sommes là pour vous aider.</p>
<p>Cordialement,<br>L'équipe</p>`,
    };
  }

  return {
    subject: 'Message important',
    body: `<p>Bonjour ${name},</p><p>Nous avons un message important pour vous.</p>`,
  };
}

function wrapEmailHtml(body: string, brand: BrandSettings): string {
  const primaryColor = '#2563eb';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .wrapper {
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #eee;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 24px;
      color: ${primaryColor};
      margin: 0;
    }
    p { margin: 0 0 16px 0; }
    a { color: ${primaryColor}; }
    .button {
      display: inline-block;
      background: ${primaryColor};
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 16px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${brand.companyName || 'Abo'}</h1>
      </div>
      ${body}
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${brand.companyName || 'Abo'}. Tous droits réservés.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
