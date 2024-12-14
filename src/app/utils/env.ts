import { logger } from './logger';

export function validateEnv() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(name => !process.env[name]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.info(`Available environment variables: ${
      Object.keys(process.env)
        .filter(key => !key.includes('SECRET'))
        .join(', ')
    }`);
    throw new Error('Missing required environment variables');
  }

  // Log success but not the actual values
  logger.info('All required environment variables are set');
} 