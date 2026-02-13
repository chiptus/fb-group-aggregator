import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerAuthRoutes } from './routes/auth.js';
import { registerPostRoutes } from './routes/posts.js';
import { registerSubscriptionRoutes } from './routes/subscriptions.js';
import { registerGroupRoutes } from './routes/groups.js';

export async function createServer() {
  const server = Fastify({
    logger: process.env.NODE_ENV === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : true,
  });

  // CORS configuration
  await server.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',');

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        cb(null, true);
        return;
      }

      // Check if origin matches allowed patterns
      const isAllowed = allowedOrigins.some(allowed => {
        // chrome-extension://* pattern
        if (allowed.includes('*')) {
          const pattern = allowed.replace(/\*/g, '.*');
          return new RegExp(`^${pattern}$`).test(origin);
        }
        return origin === allowed;
      });

      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    // Type guard for error with statusCode
    const statusCode = (error as any).statusCode || 500;
    const code = (error as any).code || 'INTERNAL_SERVER_ERROR';
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    reply.status(statusCode).send({
      error: {
        code,
        message,
      },
    });
  });

  // Register API routes
  registerAuthRoutes(server);
  registerPostRoutes(server);
  registerSubscriptionRoutes(server);
  registerGroupRoutes(server);

  return server;
}
