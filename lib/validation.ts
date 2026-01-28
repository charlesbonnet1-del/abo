import { z } from 'zod';
import { NextResponse } from 'next/server';

// ── Common Schemas ──

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Agent Types ──

export const agentTypeSchema = z.enum(['recovery', 'retention', 'conversion', 'onboarding']);

export type AgentType = z.infer<typeof agentTypeSchema>;

// ── Orchestrator Event ──

export const orchestratorEventSchema = z.object({
  type: z.string().min(1),
  subscriberId: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type OrchestratorEventInput = z.infer<typeof orchestratorEventSchema>;

// ── SDK Events ──

export const sdkEventSchema = z.object({
  type: z.string().min(1),
  name: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  path: z.string().optional(),
  referrer: z.string().optional(),
  sessionId: z.string().optional(),
  visitorId: z.string().optional(),
  email: z.string().email().optional(),
  stripeCustomerId: z.string().optional(),
  userId: z.string().optional(),
  device: z.object({
    type: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    screenWidth: z.number().optional(),
    screenHeight: z.number().optional(),
  }).optional(),
  timestamp: z.string().datetime().optional(),
});

export const sdkEventsSchema = z.object({
  events: z.array(sdkEventSchema).min(1).max(100),
});

export type SDKEvent = z.infer<typeof sdkEventSchema>;

// ── Agent Config ──

export const agentConfigUpdateSchema = z.object({
  agent_type: agentTypeSchema,
  is_active: z.boolean().optional(),
  confidence_level: z.enum(['review_all', 'auto_with_copy', 'full_auto']).optional(),
  strategy_template: z.string().optional(),
  strategy_config: z.record(z.string(), z.unknown()).optional(),
  offers_config: z.record(z.string(), z.unknown()).optional(),
  limits_config: z.record(z.string(), z.unknown()).optional(),
});

// ── Product/Feature Schemas ──

export const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  product_type: z.string().max(100).optional(),
  aha_moment_description: z.string().max(1000).optional(),
  target_audience: z.string().max(500).optional(),
});

export const featureSchema = z.object({
  feature_key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description_short: z.string().max(500).optional(),
  description_long: z.string().max(2000).optional(),
  benefit: z.string().max(500).optional(),
  how_to_access: z.string().max(500).optional(),
  use_cases: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  is_core: z.boolean().default(false),
});

// ── Action Schemas ──

export const actionApprovalSchema = z.object({
  actionId: uuidSchema,
});

export const batchApprovalSchema = z.object({
  actionIds: z.array(uuidSchema).min(1).max(50),
});

// ── Validation Utility ──

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  error: string;
  details: z.ZodIssue[];
}

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> | ValidationError {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: 'Validation failed',
    details: result.error.issues,
  };
}

/**
 * Validate request body and return appropriate response if invalid
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const result = validate(schema, body);

    if (!result.success) {
      return {
        error: NextResponse.json(
          {
            error: 'Donnees invalides',
            details: result.details.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Corps de requete JSON invalide' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): ValidationResult<T> | ValidationError {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return validate(schema, params);
}

/**
 * Format Zod errors into a user-friendly message (French)
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(', ');
}

/**
 * Create a typed route handler with validation
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: Request) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    const validation = await validateBody(request, schema);

    if ('error' in validation) {
      return validation.error;
    }

    return handler(validation.data, request);
  };
}
