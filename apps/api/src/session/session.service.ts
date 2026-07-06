import { Injectable, Inject } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { ConversationSession, ConversationStatus } from './types/session.types';

@Injectable()
export class SessionService {
  private readonly SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  private getRedisKey(sessionToken: string): string {
    return `session:${sessionToken}`;
  }

  async createSession(sessionToken: string, conversationId: string, configId: string, tenantId: string): Promise<void> {
    const session: ConversationSession = {
      conversationId,
      tenantId,
      configId,
      status: ConversationStatus.GREETING,
      capturedFields: {},
      missingFields: [], // Will be populated by prompt engine
      turnCount: 0,
      lastActivityAt: new Date().toISOString(),
    };

    const key = this.getRedisKey(sessionToken);
    await this.redis.set(key, JSON.stringify(session), { ex: this.SESSION_TTL_SECONDS });
  }

  async getSession(sessionToken: string): Promise<ConversationSession | null> {
    const key = this.getRedisKey(sessionToken);
    const data = await this.redis.get(key);
    if (!data) return null;
    
    // Upstash Redis SDK parses JSON automatically if it detects it,
    // but standard get returns object or string depending on setup.
    // If it's a string, we parse it. If it's already an object, we cast it.
    return typeof data === 'string' ? JSON.parse(data) : (data as ConversationSession);
  }

  async updateCapturedFields(sessionToken: string, fields: Record<string, string>): Promise<void> {
    const session = await this.getSession(sessionToken);
    if (!session) return;

    session.capturedFields = { ...session.capturedFields, ...fields };
    session.lastActivityAt = new Date().toISOString();

    const key = this.getRedisKey(sessionToken);
    await this.redis.set(key, JSON.stringify(session), { ex: this.SESSION_TTL_SECONDS });
  }

  async updateStatus(sessionToken: string, status: ConversationStatus): Promise<void> {
    const session = await this.getSession(sessionToken);
    if (!session) return;

    session.status = status;
    session.lastActivityAt = new Date().toISOString();

    const key = this.getRedisKey(sessionToken);
    await this.redis.set(key, JSON.stringify(session), { ex: this.SESSION_TTL_SECONDS });
  }

  async updateMissingFields(sessionToken: string, missingFields: string[]): Promise<void> {
    const session = await this.getSession(sessionToken);
    if (!session) return;

    session.missingFields = missingFields;
    session.lastActivityAt = new Date().toISOString();

    const key = this.getRedisKey(sessionToken);
    await this.redis.set(key, JSON.stringify(session), { ex: this.SESSION_TTL_SECONDS });
  }

  async incrementTurnCount(sessionToken: string): Promise<void> {
    const session = await this.getSession(sessionToken);
    if (!session) return;

    session.turnCount += 1;
    session.lastActivityAt = new Date().toISOString();

    const key = this.getRedisKey(sessionToken);
    await this.redis.set(key, JSON.stringify(session), { ex: this.SESSION_TTL_SECONDS });
  }

  async deleteSession(sessionToken: string): Promise<void> {
    const key = this.getRedisKey(sessionToken);
    await this.redis.del(key);
  }
}
