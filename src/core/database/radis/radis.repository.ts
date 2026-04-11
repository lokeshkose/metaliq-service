import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { createRedisClient } from 'src/core/config/redis.config';
import { LoggerService } from 'src/core/logger/logger.service';

@Injectable()
export class RedisRepository implements OnModuleInit, OnModuleDestroy {
  public readonly client: Redis;

  /* ======================================================
   * GLOBAL REDIS READINESS
   * ====================================================== */

  private static redisReady: Promise<void> | null = null;

  private static initRedisReady(client: Redis): Promise<void> {
    if (this.redisReady) return this.redisReady;

    this.redisReady = new Promise<void>((resolve) => {
      if (client.status === 'ready') {
        resolve();
        return;
      }

      client.once('ready', () => resolve());
    });

    return this.redisReady;
  }

  private async ensureReady(): Promise<void> {
    if (this.client.status === 'ready') return;
    await RedisRepository.initRedisReady(this.client);
  }

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(RedisRepository.name);
    this.client = createRedisClient(this.logger);
  }

  async onModuleInit() {
    await this.client.connect();
    await this.ensureReady();
    this.logger.info('Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.info('Redis disconnected');
  }

  /* ======================================================
   * GENERIC HELPERS
   * ====================================================== */

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.ensureReady();

    const payload = JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    await this.ensureReady();

    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async delete(key: string): Promise<void> {
    await this.ensureReady();
    await this.client.del(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await this.ensureReady();
    await this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureReady();
    return (await this.client.exists(key)) === 1;
  }

  async extendTTL(key: string, ttlSeconds: number): Promise<void> {
    await this.ensureReady();
    await this.client.expire(key, ttlSeconds);
  }

  /* ======================================================
   * 🔐 SESSION HELPERS (NEW)
   * ====================================================== */

  async setSession(sessionId: string, data: any, ttl: number): Promise<void> {
    await this.setJson(`session:${sessionId}`, data, ttl);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.getJson<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.deleteMany([`session:${sessionId}`, `refresh:${sessionId}`]);
  }

  /* ======================================================
   * 👤 USER ACTIVE SESSION (SINGLE DEVICE)
   * ====================================================== */

  async setUserSession(
    userId: string,
    data: {
      sessionId: string;
      deviceId: string;
      deviceName?: string;
      platform?: string;
      lastLoginAt?: string;
    },
    ttl: number,
  ): Promise<void> {
    await this.setJson(`user_session:${userId}`, data, ttl);
  }

  async getUserSession<T>(userId: string): Promise<T | null> {
    return this.getJson<T>(`user_session:${userId}`);
  }

  async deleteUserSession(userId: string): Promise<void> {
    await this.delete(`user_session:${userId}`);
  }

  /* ======================================================
   * 🔄 REFRESH TOKEN HELPERS
   * ====================================================== */

  async setRefreshToken(sessionId: string, data: any, ttl: number): Promise<void> {
    await this.setJson(`refresh:${sessionId}`, data, ttl);
  }

  async getRefreshToken<T>(sessionId: string): Promise<T | null> {
    return this.getJson<T>(`refresh:${sessionId}`);
  }

  async deleteRefreshToken(sessionId: string): Promise<void> {
    await this.delete(`refresh:${sessionId}`);
  }

  /* ======================================================
   * RATE LIMITING
   * ====================================================== */

  async increment(key: string, ttlSeconds: number): Promise<number> {
    await this.ensureReady();

    const pipeline = this.client.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttlSeconds);

    const results = await pipeline.exec();
    return Number(results?.[0]?.[1] ?? 0);
  }
}
