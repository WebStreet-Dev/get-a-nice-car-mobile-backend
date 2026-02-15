import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3001',
    'http://localhost:5173',
    'https://admin.nicecarinc.cloud',
    'http://admin.nicecarinc.cloud',
    'http://nice-car-inc-prod-backend-nice-car-inc-a-588512-31-220-109-16.traefik.me',
  ],

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },

  // Email (GoDaddy SMTP Configuration)
  // GoDaddy SMTP Settings:
  // - Host: smtpout.secureserver.net
  // - Port 465: SSL/TLS (recommended)
  // - Port 587: TLS/STARTTLS (alternative)
  // - Username: Full email address (e.g., hello@getanicecar.com)
  // - Password: Your email account password
  smtp: {
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: parseInt(process.env.SMTP_PORT || '465', 10), // 465 for SSL, 587 for TLS
    user: process.env.SMTP_USER || 'hello@getanicecar.com',
    // IMPORTANT: In production, SMTP_PASS must be set via environment variable
    // The default is only for local development
    pass: process.env.SMTP_PASS || (process.env.NODE_ENV === 'production' ? '' : 'TempP@ss-3'),
    from: process.env.SMTP_FROM || 'hello@getanicecar.com',
  },

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@getanicecar.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
  },

  // Cloudinary (for production image storage)
  // Set these in production to enable cloud storage
  // Images will fall back to local storage if not configured
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'nicecar',
  },
};

export default config;








