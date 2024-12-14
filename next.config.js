/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Add this to help debug environment variables
  webpack: (config, { isServer }) => {
    if (isServer) {
      console.log('Environment Variables:', {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      });
    }
    return config;
  },
}

module.exports = nextConfig 