export function validateEnv() {
  const required = ['DATABASE_URL', 'OPENAI_API_KEY'];
  
  for (const var_name of required) {
    if (!process.env[var_name]) {
      throw new Error(`${var_name} is not set in environment variables`);
    }
  }
} 