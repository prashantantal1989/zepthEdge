import { Pool } from 'pg';

// TODO: Use environment variables for database connection in production
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb';
console.log(`Attempting to connect to database: ${DATABASE_URL.replace(/:[^:]+@/, ':********@')}`); // Mask password in log

const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const initDb = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Successfully connected to the database for initialization.');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'viewer',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table checked/created successfully.');

    // Function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('update_updated_at_column function checked/created successfully.');

    // Trigger to automatically update updated_at on row modification
    // Drop trigger first if it exists, to avoid errors on re-creation
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    `);
    await client.query(`
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('update_users_updated_at trigger checked/created successfully.');

  } catch (err: any) {
    console.error('Error initializing database:', err.stack ? err.stack : err);
    // Optionally rethrow or handle more gracefully
    // For now, we'll let the server attempt to start but log the DB error

    // After users table and updated_at function, run the main schema script
    const fs = require('fs').promises;
    const path = require('path');
    try {
      const schemaSql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
      await client.query(schemaSql);
      console.log('Successfully executed schema.sql');
    } catch (schemaErr: any) {
      console.error('Error executing schema.sql:', schemaErr.stack ? schemaErr.stack : schemaErr);
      // Decide if this should be a fatal error for startup
    }

  } catch (err: any) {
    console.error('Error initializing database:', err.stack ? err.stack : err);
  } finally {
    if (client) {
      client.release();
      console.log('Database client released after initialization.');
    }
  }
};

// Export the pool for use in other modules (e.g., routes)
export { pool };
