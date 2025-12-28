import { db, client } from '../src/db/client.js';
import { users, subscriptions, groups, posts, syncLogs, groupSubscriptions } from '../src/db/schema.js';
import crypto from 'crypto';

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a test user with an API key
 */
export async function createTestUser() {
  const apiKey = generateApiKey();

  const [user] = await db.insert(users).values({
    apiKey,
  }).returning();

  return {
    id: user.id,
    apiKey: user.apiKey,
    createdAt: user.createdAt,
  };
}

/**
 * Clean all test data from database
 */
export async function cleanDatabase() {
  await db.delete(syncLogs);
  await db.delete(posts);
  await db.delete(groupSubscriptions);
  await db.delete(groups);
  await db.delete(subscriptions);
  await db.delete(users);
}

/**
 * Close database connection (for cleanup after tests)
 */
export async function closeDatabase() {
  await client.end();
}
