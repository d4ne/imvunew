import { Server } from 'http';
import fs from 'fs';
import path from 'path';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const PORT = config.server.port;
const server: Server = app.listen(PORT, () => {
  logger.info('='.repeat(60));
  logger.info('Xanoty API Server');
  logger.info('='.repeat(60));
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`Server: http://localhost:${PORT}`);
  logger.info(`API: http://localhost:${PORT}/api`);
  logger.info(`Health: http://localhost:${PORT}/api/health`);
  if (config.discord.redirectUri) {
    logger.info(`Discord redirect URI (add this in Discord Dev Portal): ${config.discord.redirectUri}`);
  }
  logger.info('='.repeat(60));
});

process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err?.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down.');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down.');
  server.close(() => process.exit(0));
});

export default server;
