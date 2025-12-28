import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/fb_group_aggregator_dev';

// Create PostgreSQL connection
const client = postgres(connectionString);

// Create Drizzle instance
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Export client for cleanup in tests
export { client };
