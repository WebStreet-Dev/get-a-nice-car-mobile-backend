import nodemailer, { Transporter } from 'nodemailer';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    // Check if we're using default values in production (which would be wrong)
    const isProduction = config.nodeEnv === 'production';
    const usingDefaultPassword = !process.env.SMTP_PASS && config.smtp.pass === 'TempP@ss-3';
    
    if (isProduction && usingDefaultPassword) {
      logger.error('CRITICAL: SMTP_PASS environment variable not set in production!', {
        nodeEnv: config.nodeEnv,
        hasEnvVar: !!process.env.SMTP_PASS,
        usingDefault: true,
        action: 'Set SMTP_PASS environment variable in your production environment',
      });
    }
    
    // Initialize transporter if SMTP is properly configured
    if (
      config.smtp.host &&
      config.smtp.user &&
      config.smtp.pass
    ) {
      // Log SMTP configuration status (without exposing password)
      logger.info('Initializing email service with SMTP configuration', {
        host: config.smtp.host,
        port: config.smtp.port,
        user: config.smtp.user,
        from: config.smtp.from,
        hasPassword: !!config.smtp.pass,
        passwordLength: config.smtp.pass ? config.smtp.pass.length : 0,
        passwordFromEnv: !!process.env.SMTP_PASS,
        envPasswordLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
        nodeEnv: config.nodeEnv,
        usingDefaultPassword: usingDefaultPassword,
      });
      
      try {
        // GoDaddy SMTP configuration:
        // - Port 465: SSL/TLS (secure: true)
        // - Port 587: TLS/STARTTLS (secure: false, requiresTLS: true)
        const isSecure = config.smtp.port === 465;
        const requiresTLS = config.smtp.port === 587;

        this.transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: isSecure, // true for 465 (SSL), false for 587 (TLS)
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
          },
          tls: {
            rejectUnauthorized: false, // GoDaddy requires this
            // Remove ciphers restriction - let Node.js negotiate
            // ciphers: 'SSLv3', // This might be causing issues
          },
          ...(requiresTLS && {
            requireTLS: true,
          }),
          // Add connection timeout
          connectionTimeout: 10000, // 10 seconds
          greetingTimeout: 10000,
        });

        // Verify connection on initialization (async, don't block)
        this.transporter.verify((error: any, success: any) => {
          if (error) {
            logger.error('Email service SMTP connection failed', {
              error: error.message,
              code: error.code,
              command: error.command,
              host: config.smtp.host,
              port: config.smtp.port,
              user: config.smtp.user,
              // Don't log password, but check if it's set
              hasPassword: !!config.smtp.pass,
              passwordLength: config.smtp.pass ? config.smtp.pass.length : 0,
            });
            
            // Provide helpful error message based on error code
            if (error.code === 'EAUTH') {
              logger.error('SMTP Authentication Failed - Possible causes:', {
                issue: 'Invalid credentials',
                suggestions: [
                  '1. Verify the password for hello@getanicecar.com in GoDaddy (may have changed)',
                  '2. Check if GoDaddy requires an app-specific password (if 2FA is enabled)',
                  '3. Ensure the email account is not locked or suspended',
                  '4. Try using port 587 instead of 465 (set SMTP_PORT=587 and restart)',
                  '5. Check GoDaddy email account security settings',
                  '6. Password may need to be reset in GoDaddy if account was locked',
                ],
                currentPort: config.smtp.port,
                alternativePort: config.smtp.port === 465 ? 587 : 465,
                note: 'If port 465 fails, try setting SMTP_PORT=587 in environment variables',
              });
              
              // If using port 465 and authentication fails, suggest trying 587
              if (config.smtp.port === 465) {
                logger.warn('Port 465 authentication failed. Consider trying port 587 (TLS/STARTTLS) instead.', {
                  action: 'Set SMTP_PORT=587 in environment variables and restart the server',
                });
              }
            }
            
            this.transporter = null;
          } else {
            logger.info('Email service initialized and verified', {
              host: config.smtp.host,
              port: config.smtp.port,
              from: config.smtp.from,
              user: config.smtp.user,
            });
          }
        });
      } catch (error: any) {
        logger.error('Failed to initialize email service', {
          error: error.message,
          stack: error.stack,
          host: config.smtp.host,
          port: config.smtp.port,
        });
        this.transporter = null;
      }
    } else {
      logger.warn('Email service not configured - SMTP settings missing', {
        hasHost: !!config.smtp.host,
        hasUser: !!config.smtp.user,
        hasPass: !!config.smtp.pass,
        host: config.smtp.host || 'not set',
        user: config.smtp.user || 'not set',
        // Check environment variables directly
        envSMTP_HOST: !!process.env.SMTP_HOST,
        envSMTP_USER: !!process.env.SMTP_USER,
        envSMTP_PASS: !!process.env.SMTP_PASS,
        envSMTP_PORT: process.env.SMTP_PORT || 'not set',
      });
    }
  }

  /**
   * Send an email
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param html - HTML email body
   * @param text - Optional plain text email body
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    if (!this.transporter) {
      const errorMsg = 'Email service not available - SMTP not configured';
      logger.error(errorMsg, {
        hasTransporter: false,
        host: config.smtp.host,
        port: config.smtp.port,
        user: config.smtp.user,
      });
      throw new Error(errorMsg);
    }

    if (!to || !to.includes('@')) {
      const errorMsg = `Invalid email address: ${to}`;
      logger.error(errorMsg, { to });
      throw new Error(errorMsg);
    }

    try {
      logger.info('Attempting to send email', {
        to,
        subject,
        from: config.smtp.from,
        host: config.smtp.host,
        port: config.smtp.port,
      });

      const info = await this.transporter.sendMail({
        from: `"Get a Nice Car" <${config.smtp.from}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      });
    } catch (error: any) {
      logger.error('Failed to send email - Full error details', {
        to,
        subject,
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack,
        host: config.smtp.host,
        port: config.smtp.port,
        user: config.smtp.user,
      });
      throw error;
    }
  }

  /**
   * Strip HTML tags from HTML string to create plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return this.transporter !== null;
  }
}

const emailService = new EmailService();
export default emailService;
