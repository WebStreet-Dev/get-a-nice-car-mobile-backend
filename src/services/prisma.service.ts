import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:14',message:'DATABASE_URL check before Prisma init',data:{databaseUrl:process.env.DATABASE_URL?process.env.DATABASE_URL.substring(0,30)+'...':null,urlLength:process.env.DATABASE_URL?.length||0,urlExists:!!process.env.DATABASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// #region agent log
fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:22',message:'Prisma client created',data:{isGlobal:!!global.prisma,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});

// Test connection immediately
prisma.$connect().then(() => {
  fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:26',message:'Prisma connection test succeeded',data:{connected:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
}).catch((err: any) => {
  fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.service.ts:29',message:'Prisma connection test failed',data:{errorMessage:err?.message,errorCode:err?.code,errorName:err?.name,isAuthError:err?.message?.includes('Authentication')||err?.message?.includes('credentials')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
});
// #endregion

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting Prisma client...');
  await prisma.$disconnect();
});

export default prisma;




