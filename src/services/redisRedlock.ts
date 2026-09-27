import Redis from 'ioredis';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export class SlotConflictError extends Error {
  public statusCode: number = 409;
  constructor(message: string = 'Slot is currently locked or being booked by another customer. Please try again.') {
    super(message);
    this.name = 'SlotConflictError';
  }
}

export interface ILockResult {
  acquired: boolean;
  resourceKey: string;
  lockToken: string;
  ttlMs: number;
}

export class RedisRedlock {
  private static redisClient: Redis | null = null;
  private static isConnected: boolean = false;
  // High-performance in-memory fallback mutex registry (used when external Redis is offline or in testing)
  private static memoryLocks: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Initialize or retrieve singleton Redis client
   */
  public static getClient(): Redis {
    if (!this.redisClient) {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 1500,
        retryStrategy: (times) => {
          if (times > 2) {
            // Stop retrying aggressively; fallback to memory adapter
            return null;
          }
          return 500;
        },
        lazyConnect: true,
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        logger.info('[Redis Redlock] Connected to Redis instance successfully.');
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        logger.warn(`[Redis Redlock] Redis unavailable, using in-memory mutex fallback. (${err.message})`);
      });

      this.redisClient.connect().catch(() => {
        this.isConnected = false;
      });
    }

    return this.redisClient;
  }

  /**
   * Acquire a distributed slot lock for vendor, date, and slot
   * Follows the Redlock / Redis distributed mutex specification:
   * Key: lock:slot:{vendor_id}:{event_date}:{event_slot}
   */
  public static async acquireSlotLock(
    vendorId: string,
    eventDate: string,
    eventSlot: string,
    ttlMs: number = 15000
  ): Promise<ILockResult> {
    const resourceKey = `lock:slot:${vendorId}:${eventDate.trim()}:${eventSlot.trim()}`;
    const lockToken = crypto.randomUUID();

    const client = this.getClient();

    if (this.isConnected && client) {
      try {
        // SET key token NX PX ttlMs
        const result = await client.set(resourceKey, lockToken, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          logger.info(`[Redis Redlock] Acquired lock for ${resourceKey} with token ${lockToken}`);
          return { acquired: true, resourceKey, lockToken, ttlMs };
        } else {
          logger.warn(`[Redis Redlock] Contention detected for ${resourceKey}. Lock already held.`);
          return { acquired: false, resourceKey, lockToken: '', ttlMs };
        }
      } catch (err: any) {
        logger.warn(`[Redis Redlock] Redis call failed (${err.message}), falling back to in-memory lock.`);
      }
    }

    // Fallback: In-memory atomic mutex
    const now = Date.now();
    const existingLock = this.memoryLocks.get(resourceKey);

    if (existingLock && existingLock.expiresAt > now) {
      logger.warn(`[Redis Redlock (Mem)] Contention detected for ${resourceKey}. Slot currently locked.`);
      return { acquired: false, resourceKey, lockToken: '', ttlMs };
    }

    // Clean up expired lock if present and set new lock
    this.memoryLocks.set(resourceKey, {
      token: lockToken,
      expiresAt: now + ttlMs,
    });

    logger.info(`[Redis Redlock (Mem)] Acquired lock for ${resourceKey} with token ${lockToken}`);
    return { acquired: true, resourceKey, lockToken, ttlMs };
  }

  /**
   * Release distributed lock safely using token validation (Lua script equivalent)
   */
  public static async releaseSlotLock(resourceKey: string, lockToken: string): Promise<boolean> {
    if (!lockToken) return false;

    const client = this.getClient();

    if (this.isConnected && client) {
      try {
        // Atomic Lua script: only delete if current value equals the token
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const res = await client.eval(luaScript, 1, resourceKey, lockToken);
        const released = res === 1;
        if (released) {
          logger.info(`[Redis Redlock] Released lock for ${resourceKey}`);
        }
        return released;
      } catch (err: any) {
        logger.warn(`[Redis Redlock] Redis release failed (${err.message}), using memory fallback.`);
      }
    }

    // Memory fallback release
    const existing = this.memoryLocks.get(resourceKey);
    if (existing && existing.token === lockToken) {
      this.memoryLocks.delete(resourceKey);
      logger.info(`[Redis Redlock (Mem)] Released lock for ${resourceKey}`);
      return true;
    }

    return false;
  }

  /**
   * Helper to check if a slot is currently locked
   */
  public static async isSlotLocked(vendorId: string, eventDate: string, eventSlot: string): Promise<boolean> {
    const resourceKey = `lock:slot:${vendorId}:${eventDate.trim()}:${eventSlot.trim()}`;
    const client = this.getClient();

    if (this.isConnected && client) {
      try {
        const val = await client.get(resourceKey);
        return val !== null;
      } catch {
        // Fall back to memory
      }
    }

    const existing = this.memoryLocks.get(resourceKey);
    if (existing && existing.expiresAt > Date.now()) {
      return true;
    }
    return false;
  }
}
