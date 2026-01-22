import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  fromName: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const response = await getResend().emails.send({
      from: `${params.fromName} <notifications@abo-mail.com>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo
    });

    return { success: true, messageId: response.data?.id };
  } catch (error: unknown) {
    console.error('Email send error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export interface BrandSettings {
  company_name?: string;
  tone?: string;
  primary_color?: string;
}

export function wrapEmailHtml(body: string, brand?: BrandSettings): string {
  const companyName = brand?.company_name || 'Abo';
  const primaryColor = brand?.primary_color || '#2563eb';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .wrapper {
      background-color: #f5f5f5;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: ${primaryColor};
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    p {
      margin: 0 0 16px 0;
    }
    a {
      color: ${primaryColor};
    }
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
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${companyName}</h1>
      </div>
      <div class="content">
        ${body}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${companyName}. Tous droits reserves.</p>
        <p>
          <a href="[UNSUBSCRIBE_URL]">Se desabonner</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendExpirationNotification(params: {
  userEmail: string;
  actionDescription: string;
  agentType: string;
}): Promise<SendEmailResult> {
  const { userEmail, actionDescription, agentType } = params;

  const html = `
    <p>Une action de votre agent <strong>${agentType}</strong> a expire sans validation :</p>
    <p style="padding: 16px; background: #f3f4f6; border-radius: 6px; margin: 16px 0;">
      <strong>${actionDescription}</strong>
    </p>
    <p>L'action n'a pas ete executee car elle n'a pas ete approuvee dans les 48 heures.</p>
    <p style="margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/approvals" class="button">
        Voir les actions en attente
      </a>
    </p>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Action expiree : ${actionDescription}`,
    html: wrapEmailHtml(html),
    fromName: 'Abo'
  });
}
