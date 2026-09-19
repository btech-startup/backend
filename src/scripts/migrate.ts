import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;
import { env } from '../config/env';

async function runMigrations() {
  console.log('[Migration] Connecting to PostgreSQL database...');
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    console.log('[Migration] Connection successful.');

    const migrationFiles = [
      '001_init_eventwise_schema.sql',
      '002_eventwise_v2_upgrade.sql',
      '003_wallet_deliverables_notifications.sql',
    ];

    for (const fileName of migrationFiles) {
      const sqlFilePath = path.join(process.cwd(), 'migrations', fileName);

      if (!fs.existsSync(sqlFilePath)) {
        console.warn(`[Migration] Skipping ${fileName} (file not found)`);
        continue;
      }

      console.log(`[Migration] Executing: ${fileName}`);
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      await client.query(sqlContent);
      console.log(`✅ [Migration] ${fileName} applied successfully.`);
    }

    console.log('✅ [Migration] All EventWise PostgreSQL migrations completed.');
  } catch (error) {
    console.error('❌ [Migration Failed]:', error);
  } finally {
    await client.end();
  }
}

runMigrations();
