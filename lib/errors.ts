import { NextResponse } from 'next/server';

// ── Error Codes ──

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // External Services
  STRIPE_ERROR = 'STRIPE_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  GROQ_ERROR = 'GROQ_ERROR',
  RESEND_ERROR = 'RESEND_ERROR',

  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
}

// ── Error Messages (French) ──

const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: 'Non autorise. Veuillez vous connecter.',
  [ErrorCode.FORBIDDEN]: 'Acces refuse. Vous n\'avez pas les permissions necessaires.',
  [ErrorCode.INVALID_TOKEN]: 'Token invalide ou expire.',
  [ErrorCode.SESSION_EXPIRED]: 'Votre session a expire. Veuillez vous reconnecter.',

  [ErrorCode.VALIDATION_ERROR]: 'Donnees invalides.',
  [ErrorCode.INVALID_INPUT]: 'Les donnees fournies sont incorrectes.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Un champ obligatoire est manquant.',

  [ErrorCode.NOT_FOUND]: 'Ressource non trouvee.',
  [ErrorCode.ALREADY_EXISTS]: 'Cette ressource existe deja.',
  [ErrorCode.CONFLICT]: 'Conflit avec l\'etat actuel de la ressource.',

  [ErrorCode.STRIPE_ERROR]: 'Erreur lors de la communication avec Stripe.',
  [ErrorCode.SUPABASE_ERROR]: 'Erreur de base de donnees.',
  [ErrorCode.GROQ_ERROR]: 'Erreur lors de la generation IA.',
  [ErrorCode.RESEND_ERROR]: 'Erreur lors de l\'envoi d\'email.',

  [ErrorCode.RATE_LIMITED]: 'Trop de requetes. Veuillez patienter.',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Limite de requetes atteinte.',

  [ErrorCode.INTERNAL_ERROR]: 'Une erreur interne s\'est produite.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporairement indisponible.',
  [ErrorCode.TIMEOUT]: 'La requete a expire.',
};

// ── HTTP Status Codes ──

const errorStatusCodes: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,

  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,

  [ErrorCode.STRIPE_ERROR]: 502,
  [ErrorCode.SUPABASE_ERROR]: 500,
  [ErrorCode.GROQ_ERROR]: 502,
  [ErrorCode.RESEND_ERROR]: 502,

  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,
};

// ── App Error Class ──

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message || errorMessages[code]);
    this.code = code;
    this.statusCode = errorStatusCodes[code];
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Structured Logger ──

interface LogContext {
  userId?: string;
  subscriberId?: string;
  action?: string;
  agentType?: string;
  requestId?: string;
  [key: string]: unknown;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function structuredLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  // In production, this could be sent to a logging service
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => structuredLog('debug', message, context),
  info: (message: string, context?: LogContext) => structuredLog('info', message, context),
  warn: (message: string, context?: LogContext) => structuredLog('warn', message, context),
  error: (message: string, context?: LogContext) => structuredLog('error', message, context),
};

// ── Error Response Builder ──

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message: message || errorMessages[code],
        details,
      },
    },
    { status: errorStatusCodes[code] }
  );
}

// ── Error Handler for Routes ──

export function handleRouteError(
  error: unknown,
  context?: LogContext
): NextResponse<ErrorResponse> {
  // Log the error
  if (error instanceof AppError) {
    logger.error(error.message, {
      ...context,
      errorCode: error.code,
      details: error.details,
    });

    return createErrorResponse(error.code, error.message, error.details);
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      logger.error('Request timeout', { ...context, originalError: error.message });
      return createErrorResponse(ErrorCode.TIMEOUT);
    }

    // Log unexpected errors
    logger.error('Unexpected error', {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    });
  } else {
    logger.error('Unknown error type', { ...context, error: String(error) });
  }

  // Return generic error for unexpected errors
  return createErrorResponse(ErrorCode.INTERNAL_ERROR);
}

// ── Async Error Wrapper ──

type AsyncRouteHandler = (request: Request) => Promise<NextResponse>;

export function withErrorHandler(handler: AsyncRouteHandler): AsyncRouteHandler {
  return async (request: Request): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

// ── Success Response Builder ──

export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<{ success: true; data: T }> {
  return NextResponse.json({ success: true, data }, { status });
}
