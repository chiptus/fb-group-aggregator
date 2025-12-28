import { createServer } from './api/server.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    const server = await createServer();

    // Start listening
    await server.listen({ port: PORT, host: HOST });

    console.log(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
