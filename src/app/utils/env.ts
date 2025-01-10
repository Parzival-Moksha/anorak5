import { logger } from './logger';

export const validateEnv = () => {
  // Only run on server
  if (typeof window !== 'undefined') return;

  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}; 