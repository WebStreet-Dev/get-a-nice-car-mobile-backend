import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import breakdownRoutes from './routes/breakdown.routes.js';
import departmentRoutes from './routes/department.routes.js';
import downpaymentRoutes from './routes/downpayment.routes.js';
import faqRoutes from './routes/faq.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint (for Docker healthcheck)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/breakdown', breakdownRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/downpayment', downpaymentRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
const HOST = process.env.HOST || '0.0.0.0';

// #region agent log
const dbUrlAtStartup = process.env.DATABASE_URL || '';
const dbUrlMaskedStartup = dbUrlAtStartup ? dbUrlAtStartup.replace(/:([^:@]+)@/, ':****@') : 'EMPTY';
fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.ts:72',message:'Server startup - DATABASE_URL check',data:{urlMasked:dbUrlMaskedStartup,urlLength:dbUrlAtStartup.length,configDbUrl:config.databaseUrl?.substring(0,30)+'...'||'EMPTY'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

app.listen(PORT, HOST, () => {
  logger.info(`Server is running on ${HOST}:${PORT}`, {
    environment: config.nodeEnv,
    port: PORT,
    host: HOST,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
