import { BaseAgent, AgentEvent, AgentActionResult } from './base-agent';
import { Situation, ActionOption } from '../types/agent-types';
import { sendAgentEmail } from './email-sender';
import {
  getSubscriberFeatures,
  ProductFeature,
  SubscriberFeaturesResult,
} from '../helpers/get-subscriber-features';
import Groq from 'groq-sdk';

// Lazy initialization
let groqInstance: Groq | null = null;

function getGroq(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
}

interface OnboardingSequenceConfig {
  totalSteps: number;
  delayBetweenSteps: number; // hours
  welcomeEmailEnabled: boolean;
  featureHighlightEnabled: boolean;
  ahaMomentEnabled: boolean;
}

export class OnboardingAgent extends BaseAgent {
  constructor(userId: string, useAdminClient: boolean = false) {
    super(userId, 'onboarding', useAdminClient);
  }

  /**
   * Triggers supportés par cet agent
   */
  getSupportedTriggers(): string[] {
    return ['new_subscriber', 'onboarding_step', 'subscription_created'];
  }

  /**
   * Vérifie si cet événement doit être traité
   */
  protected shouldHandleEvent(event: AgentEvent): boolean {
    return this.getSupportedTriggers().includes(event.type);
  }

  /**
   * Construit la description de l'action
   */
  protected buildActionDescription(decision: ActionOption, situation: Situation): string {
    const subscriberName = situation.subscriber.name || situation.subscriber.email;
    const step = (situation.context.step as number) ?? 1;
    const totalSteps = (situation.context.totalSteps as number) ?? 3;

    if (decision.action === 'email') {
      if (step === 1) {
        return `Email de bienvenue (${decision.strategy}) à ${subscriberName}`;
      }
      return `Email d'onboarding ${step}/${totalSteps} (${decision.strategy}) à ${subscriberName}`;
    }

    return `Action ${decision.action} pour ${subscriberName}`;
  }

  /**
   * Exécute l'action concrète
   */
  protected async performAction(action: Record<string, unknown>): Promise<void> {
    const result = action.result as Record<string, unknown>;
    const actionType = action.action_type as string;
    const actionId = action.id as string;
    const subscriberId = action.subscriber_id as string;

    if (actionType === 'email' || actionType === 'onboarding_email') {
      // Get subscriber features
      const featuresResult = await getSubscriberFeatures(subscriberId);

      // Get context for email generation
      const step = (result.step as number) ?? 1;
      const totalSteps = (result.total_steps as number) ?? 3;

      // Select feature for this step (if features are configured)
      const selectedFeature = this.selectFeatureForStep(step, totalSteps, featuresResult);

      // Generate email content based on feature availability
      const { subject, body } = await this.generateOnboardingEmail({
        subscriberName: result.subscriber_name as string | undefined,
        step,
        totalSteps,
        selectedFeature,
        featuresResult,
      });

      // Send the email
      const emailResult = await sendAgentEmail({
        to: result.subscriber_email as string,
        subscriberName: result.subscriber_name as string | undefined,
        subject,
        body,
        agentType: 'onboarding',
        brandSettings: this.brandSettings!,
        userId: this.userId,
        subscriberId,
        actionId,
        context: {
          trigger: result.trigger,
          strategy: result.strategy,
          step,
          totalSteps,
          featureMode: featuresResult.fallbackMode,
          selectedFeatureKey: selectedFeature?.feature_key,
        },
        useAdminClient: this.useAdminClient,
      });

      // Store email content in the action result
      if (emailResult.success && emailResult.subject && emailResult.body) {
        const supabase = await this.getClient();
        if (supabase) {
          await supabase
            .from('agent_action')
            .update({
              result: {
                ...result,
                email_subject: emailResult.subject,
                email_body: emailResult.body,
                email_message_id: emailResult.messageId,
                feature_mode: featuresResult.fallbackMode,
                selected_feature: selectedFeature?.feature_key || null,
              },
            })
            .eq('id', actionId);
        }
      }
    }
  }

  /**
   * IMPORTANT: Sélectionne une feature pour une étape donnée
   * NE JAMAIS inventer de feature - retourner null si aucune n'est configurée
   */
  private selectFeatureForStep(
    step: number,
    totalSteps: number,
    featuresResult: SubscriberFeaturesResult
  ): ProductFeature | undefined {
    const { features, isConfigured } = featuresResult;

    // Si pas de features configurées, ne pas en inventer
    if (!isConfigured || features.length === 0) {
      return undefined;
    }

    // Step 1: Email de bienvenue général (pas de feature spécifique)
    if (step === 1) {
      return undefined;
    }

    // Pour les étapes suivantes, sélectionner une feature
    // Prioriser les features "core" pour les premières étapes
    const coreFeatures = features.filter(f => f.is_core);
    const nonCoreFeatures = features.filter(f => !f.is_core);
    const orderedFeatures = [...coreFeatures, ...nonCoreFeatures];

    // Index basé sur l'étape (step 2 = index 0, step 3 = index 1, etc.)
    const featureIndex = (step - 2) % orderedFeatures.length;
    return orderedFeatures[featureIndex];
  }

  /**
   * Génère le contenu de l'email d'onboarding
   * RÈGLE CRITIQUE: Ne jamais inventer de features
   */
  private async generateOnboardingEmail(params: {
    subscriberName?: string;
    step: number;
    totalSteps: number;
    selectedFeature?: ProductFeature;
    featuresResult: SubscriberFeaturesResult;
  }): Promise<{ subject: string; body: string }> {
    const { subscriberName, step, totalSteps, selectedFeature, featuresResult } = params;

    // Mode générique si pas de features configurées
    if (!featuresResult.isConfigured) {
      return this.generateGenericOnboardingEmail(subscriberName, step, totalSteps);
    }

    // Mode avec feature spécifique
    if (selectedFeature) {
      return this.generateFeatureOnboardingEmail(subscriberName, step, totalSteps, selectedFeature);
    }

    // Step 1 ou pas de feature sélectionnée: email de bienvenue
    return this.generateWelcomeEmail(subscriberName, featuresResult);
  }

  /**
   * Génère un email d'onboarding générique (sans features)
   */
  private async generateGenericOnboardingEmail(
    subscriberName: string | undefined,
    step: number,
    totalSteps: number
  ): Promise<{ subject: string; body: string }> {
    const name = subscriberName || 'Client';
    const brand = this.brandSettings;
    const companyName = brand?.companyName || 'notre service';

    const systemPrompt = this.buildOnboardingSystemPrompt();
    const userPrompt = `Rédige un email d'onboarding GÉNÉRIQUE (étape ${step}/${totalSteps}).

CLIENT: ${name}
ENTREPRISE: ${companyName}
PRODUIT: ${brand?.productDescription || 'un service SaaS'}

INSTRUCTIONS CRITIQUES:
- C'est un email générique car AUCUNE feature spécifique n'est configurée
- NE MENTIONNE PAS de fonctionnalité spécifique
- Parle de manière générale de la valeur du produit
- Encourage l'exploration de la plateforme
- ${step === 1 ? "C'est le premier email de bienvenue" : `C'est l'étape ${step} de l'onboarding`}

FORMAT: Réponds UNIQUEMENT au format JSON: {"subject": "...", "body": "..."}
Le body doit être en HTML simple (paragraphes, liens).`;

    return this.callLLMForEmail(systemPrompt, userPrompt, 'generic', step);
  }

  /**
   * Génère un email mettant en avant une feature SPÉCIFIQUE
   * Utilise EXACTEMENT les descriptions configurées
   */
  private async generateFeatureOnboardingEmail(
    subscriberName: string | undefined,
    step: number,
    totalSteps: number,
    feature: ProductFeature
  ): Promise<{ subject: string; body: string }> {
    const name = subscriberName || 'Client';
    const brand = this.brandSettings;
    const companyName = brand?.companyName || 'notre service';

    const systemPrompt = this.buildOnboardingSystemPrompt();

    // Construire le contexte de la feature avec EXACTEMENT les données configurées
    const featureContext = `
FEATURE À METTRE EN AVANT:
- Nom: ${feature.name}
- Clé: ${feature.feature_key}
- Description courte: ${feature.description_short || 'Non renseignée'}
- Description longue: ${feature.description_long || 'Non renseignée'}
- Bénéfice principal: ${feature.benefit || 'Non renseigné'}
- Comment y accéder: ${feature.how_to_access || 'Non renseigné'}
- Cas d'usage: ${feature.use_cases?.join(', ') || 'Non renseignés'}
- Est une feature principale: ${feature.is_core ? 'Oui' : 'Non'}
`;

    const userPrompt = `Rédige un email d'onboarding (étape ${step}/${totalSteps}) mettant en avant UNE feature spécifique.

CLIENT: ${name}
ENTREPRISE: ${companyName}

${featureContext}

INSTRUCTIONS CRITIQUES:
- Utilise UNIQUEMENT les informations de la feature ci-dessus
- NE JAMAIS inventer ou ajouter des détails qui ne sont pas fournis
- Si une information est "Non renseignée", ne la mentionne pas
- Mets en avant le bénéfice et les cas d'usage si disponibles
- Encourage le client à essayer cette fonctionnalité

FORMAT: Réponds UNIQUEMENT au format JSON: {"subject": "...", "body": "..."}
Le body doit être en HTML simple (paragraphes, liens).`;

    return this.callLLMForEmail(systemPrompt, userPrompt, 'feature', step);
  }

  /**
   * Génère l'email de bienvenue initial
   */
  private async generateWelcomeEmail(
    subscriberName: string | undefined,
    featuresResult: SubscriberFeaturesResult
  ): Promise<{ subject: string; body: string }> {
    const name = subscriberName || 'Client';
    const brand = this.brandSettings;
    const companyName = brand?.companyName || 'notre service';

    const systemPrompt = this.buildOnboardingSystemPrompt();

    // Si des features sont configurées, les mentionner brièvement
    let featuresOverview = '';
    if (featuresResult.isConfigured && featuresResult.features.length > 0) {
      const featureNames = featuresResult.features
        .slice(0, 5)
        .map(f => f.name)
        .join(', ');
      featuresOverview = `

FEATURES DISPONIBLES (à mentionner brièvement):
${featureNames}

NOTE: Mentionne ces features de manière générale pour donner envie d'explorer,
mais ne rentre pas dans les détails - ce sera fait dans les emails suivants.`;
    }

    const userPrompt = `Rédige un email de BIENVENUE pour un nouveau client.

CLIENT: ${name}
ENTREPRISE: ${companyName}
PRODUIT: ${brand?.productDescription || 'un service SaaS'}
${featuresOverview}

INSTRUCTIONS:
- C'est le premier email que le client reçoit
- Ton chaleureux et accueillant
- Remercie pour la confiance
- Présente brièvement ce qui les attend
- Encourage à explorer la plateforme

FORMAT: Réponds UNIQUEMENT au format JSON: {"subject": "...", "body": "..."}
Le body doit être en HTML simple (paragraphes, liens).`;

    return this.callLLMForEmail(systemPrompt, userPrompt, 'welcome', 1);
  }

  /**
   * Construit le system prompt pour l'onboarding
   */
  private buildOnboardingSystemPrompt(): string {
    const brand = this.brandSettings;
    const toneDescriptions: Record<string, string> = {
      formal: 'très professionnel et formel',
      neutral: 'professionnel mais accessible',
      casual: 'décontracté et friendly',
      friendly: 'chaleureux et proche du client',
    };

    return `Tu es un assistant qui rédige des emails d'onboarding pour ${brand?.companyName || 'notre entreprise'}.

TON ET STYLE:
- Ton: ${toneDescriptions[brand?.tone || 'neutral']}
- Langue: ${brand?.language || 'français'}

VALEURS À REFLÉTER:
${brand?.values?.map((v) => `- ${v}`).join('\n') || '- Professionnalisme'}

NE JAMAIS DIRE:
${brand?.neverSay?.map((v) => `- "${v}"`).join('\n') || '- Rien de spécifique'}

SIGNATURE:
${brand?.signature || "Cordialement,\nL'équipe"}

RÈGLES CRITIQUES:
- NE JAMAIS inventer de fonctionnalités ou de détails
- Utilise UNIQUEMENT les informations fournies dans le prompt
- Génère un objet d'email (subject) et un corps (body)
- Le body doit être en HTML simple (paragraphes, liens)
- Sois accueillant et engageant
- Réponds UNIQUEMENT au format JSON: {"subject": "...", "body": "..."}`;
  }

  /**
   * Appelle le LLM pour générer l'email
   */
  private async callLLMForEmail(
    systemPrompt: string,
    userPrompt: string,
    emailType: 'generic' | 'feature' | 'welcome',
    step: number
  ): Promise<{ subject: string; body: string }> {
    try {
      const groq = getGroq();
      const response = await groq.chat.completions.create(
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        { signal: AbortSignal.timeout(30000) }
      );

      const content = response.choices[0].message.content || '';
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (error) {
      console.error('Error generating onboarding email:', error);
    }

    // Fallback par défaut
    return this.getDefaultOnboardingEmail(emailType, step);
  }

  /**
   * Email par défaut en cas d'erreur
   */
  private getDefaultOnboardingEmail(
    emailType: 'generic' | 'feature' | 'welcome',
    step: number
  ): { subject: string; body: string } {
    const companyName = this.brandSettings?.companyName || 'Notre service';

    if (emailType === 'welcome' || step === 1) {
      return {
        subject: `Bienvenue chez ${companyName} !`,
        body: `<p>Bonjour,</p>
<p>Bienvenue et merci d'avoir choisi ${companyName} !</p>
<p>Nous sommes ravis de vous compter parmi nous. Dans les prochains jours, nous vous enverrons quelques conseils pour vous aider à tirer le meilleur parti de votre abonnement.</p>
<p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
<p>Cordialement,<br>L'équipe ${companyName}</p>`,
      };
    }

    return {
      subject: `Conseil #${step} pour bien démarrer avec ${companyName}`,
      body: `<p>Bonjour,</p>
<p>Nous espérons que vous profitez bien de ${companyName}.</p>
<p>N'hésitez pas à explorer toutes les possibilités offertes par notre plateforme.</p>
<p>Si vous avez des questions, nous sommes là pour vous aider !</p>
<p>Cordialement,<br>L'équipe ${companyName}</p>`,
    };
  }

  // ============================================
  // MÉTHODES PUBLIQUES POUR DÉCLENCHER L'ONBOARDING
  // ============================================

  /**
   * Gère l'arrivée d'un nouveau subscriber
   */
  async handleNewSubscriber(
    subscriberId: string,
    subscriptionData?: Record<string, unknown>
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'new_subscriber',
      subscriberId,
      data: {
        step: 1,
        totalSteps: await this.getSequenceConfig().then(c => c.totalSteps),
        subscription: subscriptionData,
      },
    });
  }

  /**
   * Gère une étape de la séquence d'onboarding
   */
  async handleOnboardingStep(
    subscriberId: string,
    step: number
  ): Promise<AgentActionResult | null> {
    const config = await this.getSequenceConfig();

    // Ne pas dépasser le nombre total d'étapes
    if (step > config.totalSteps) {
      console.log(`Onboarding complete for subscriber ${subscriberId}`);
      return null;
    }

    return this.handleEvent({
      type: 'onboarding_step',
      subscriberId,
      data: {
        step,
        totalSteps: config.totalSteps,
      },
    });
  }

  /**
   * Récupère la config de la séquence d'onboarding
   */
  private async getSequenceConfig(): Promise<OnboardingSequenceConfig> {
    await this.initialize();

    // Check if agent_config has onboarding_sequence configuration
    const strategyConfig = this.config?.strategyConfig || {};
    const onboardingConfig = strategyConfig.onboarding_sequence as OnboardingSequenceConfig | undefined;

    return {
      totalSteps: onboardingConfig?.totalSteps || 3,
      delayBetweenSteps: onboardingConfig?.delayBetweenSteps || 24, // hours
      welcomeEmailEnabled: onboardingConfig?.welcomeEmailEnabled ?? true,
      featureHighlightEnabled: onboardingConfig?.featureHighlightEnabled ?? true,
      ahaMomentEnabled: onboardingConfig?.ahaMomentEnabled ?? true,
    };
  }

  /**
   * Récupère les subscribers éligibles pour l'étape suivante d'onboarding
   */
  async getSubscribersForNextStep(): Promise<Array<{
    subscriberId: string;
    nextStep: number;
    lastStepAt: Date | null;
  }>> {
    const supabase = await this.getClient();
    if (!supabase) return [];

    const config = await this.getSequenceConfig();

    // Trouver les subscribers qui:
    // 1. Sont actifs
    // 2. Ont été créés récemment (dans la fenêtre d'onboarding)
    // 3. N'ont pas encore complété toutes les étapes

    // Fenêtre d'onboarding: totalSteps * delayBetweenSteps + marge
    const onboardingWindowHours = config.totalSteps * config.delayBetweenSteps * 2;
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - onboardingWindowHours);

    // Récupérer les subscribers récents
    const { data: recentSubscribers } = await supabase
      .from('subscriber')
      .select('id, user_id, created_at')
      .eq('user_id', this.userId)
      .gte('created_at', cutoffDate.toISOString());

    if (!recentSubscribers || recentSubscribers.length === 0) {
      return [];
    }

    const result: Array<{
      subscriberId: string;
      nextStep: number;
      lastStepAt: Date | null;
    }> = [];

    // Pour chaque subscriber, vérifier où ils en sont dans l'onboarding
    for (const subscriber of recentSubscribers) {
      // Compter les emails d'onboarding déjà envoyés
      const { data: onboardingActions } = await supabase
        .from('agent_action')
        .select('created_at, result')
        .eq('subscriber_id', subscriber.id)
        .eq('agent_type', 'onboarding')
        .eq('status', 'executed')
        .order('created_at', { ascending: false });

      const completedSteps = onboardingActions?.length || 0;

      if (completedSteps >= config.totalSteps) {
        // Onboarding terminé
        continue;
      }

      const lastAction = onboardingActions?.[0];
      const lastStepAt = lastAction ? new Date(lastAction.created_at) : null;

      // Vérifier si assez de temps s'est écoulé depuis le dernier email
      if (lastStepAt) {
        const hoursSinceLastStep = (Date.now() - lastStepAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastStep < config.delayBetweenSteps) {
          continue;
        }
      }

      result.push({
        subscriberId: subscriber.id,
        nextStep: completedSteps + 1,
        lastStepAt,
      });
    }

    return result;
  }
}

export function createOnboardingAgent(userId: string, useAdminClient: boolean = false): OnboardingAgent {
  return new OnboardingAgent(userId, useAdminClient);
}
