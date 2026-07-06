/**
 * @ladeway/types — Shared TypeScript interfaces for the Ladeway platform.
 *
 * This package is the single source of truth for all type definitions
 * shared between the Next.js frontend and NestJS backend.
 *
 * Import from '@ladeway/types' in both apps.
 */

// Industry configuration — the central architectural entity
export type {
  FieldType,
  ConversationTone,
  QualificationField,
  ScoringCondition,
  ScoringRule,
  IndustryConfig,
  CreateIndustryConfigDto,
  UpdateIndustryConfigDto,
} from './industry-config';
export { type LeadTier } from './industry-config';

// Conversation state machine and messaging
export {
  ConversationStatus,
  QualificationAction,
} from './conversation';
export type {
  MessageSender,
  Message,
  ConversationSession,
  StartConversationDto,
  StartConversationResponse,
  SendMessageDto,
  SSEEventType,
  SSEDonePayload,
  SSEErrorPayload,
  ConversationStateResponse,
} from './conversation';

// Lead management and scoring
export type {
  LeadStatus,
  AssignmentStatus,
  Lead,
  ExtractedField,
  LeadAssignment,
  ScoringResult,
  ExtractionResult,
  UpdateLeadDto,
  LeadListQuery,
  PaginatedResponse,
} from './lead';

// Authentication and authorization
export type {
  UserRole,
  JwtPayload,
  LoginDto,
  LoginResponse,
  User,
  Tenant,
} from './auth';

// Analytics
export type {
  AnalyticsSummary,
  TimeSeriesDataPoint,
  LeadFunnelData,
  AnalyticsQuery,
} from './analytics';

// AI interfaces
export type {
  LLMRole,
  LLMMessage,
  StreamOptions,
  PromptPayload,
  AIHealthResponse,
} from './ai';
