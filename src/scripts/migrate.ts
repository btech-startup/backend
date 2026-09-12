import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;
import { env } from '../config/env.js';

async function runMigrations() {
  console.log('[Migration] Connecting to PostgreSQL database...');
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    console.log('[Migration] Connection successful.');

    const sqlFilePath = path.join(process.cwd(), 'migrations', '001_init_eventwise_schema.sql');
    console.log(`[Migration] Reading migration file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('[Migration] Executing DDL statements...');
    await client.query(sqlContent);
    console.log('✅ [Migration] EventWise PostgreSQL schema applied successfully.');
  } catch (error) {
    console.error('❌ [Migration Failed]:', error);
  } finally {
    await client.end();
  }
}

runMigrations();
