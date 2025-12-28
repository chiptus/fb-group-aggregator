import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanDatabase, closeDatabase } from './helpers.js';

// Clean database before all tests
beforeAll(async () => {
  await cleanDatabase();
});

// Clean database after each test
afterEach(async () => {
  await cleanDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  await closeDatabase();
});
