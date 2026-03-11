import { query } from "../config/db";
import fs from 'fs';
import path from 'path';

const migrationsPath = path.join(__dirname, '../migrations');

const runMigrations = async () => {
  try {
    console.log('Starting database migrations...');
    
    // Get all migration files and sort them by filename
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      
      const filePath = path.join(migrationsPath, file);
      const migrationSQL = fs.readFileSync(filePath, 'utf8');
      
      try {
        await query(migrationSQL);
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${file} failed:`, error);
        throw error;
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;
