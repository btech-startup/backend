import pkg from 'pg';
const { Pool } = pkg;
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  logger.error('[Database Pool Error]:', err);
});

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    logger.info(`[PostgreSQL] Connected to database successfully at ${res.rows[0].now}`);
  } catch (error) {
    logger.error('[PostgreSQL] Connection warning/error:', error);
    logger.warn('[PostgreSQL] Running with database pool adapter.');
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);
