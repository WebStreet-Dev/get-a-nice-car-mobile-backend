import config from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const colors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

function formatMessage(level: LogLevel, message: string, meta?: object): string {
  const timestamp = new Date().toISOString();
  const colorCode = colors[level];
  const levelStr = level.toUpperCase().padEnd(5);
  
  let output = `${colorCode}[${timestamp}] ${levelStr}${colors.reset}: ${message}`;
  
  if (meta && Object.keys(meta).length > 0) {
    output += ` ${JSON.stringify(meta)}`;
  }
  
  return output;
}

export const logger = {
  debug(message: string, meta?: object): void {
    if (config.nodeEnv === 'development') {
      console.log(formatMessage('debug', message, meta));
    }
  },
  
  info(message: string, meta?: object): void {
    console.log(formatMessage('info', message, meta));
  },
  
  warn(message: string, meta?: object): void {
    console.warn(formatMessage('warn', message, meta));
  },
  
  error(message: string, meta?: object): void {
    console.error(formatMessage('error', message, meta));
  },
};

export default logger;



