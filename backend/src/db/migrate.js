import { initDB } from './init.js';

async function migrate() {
  try {
    await initDB();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();