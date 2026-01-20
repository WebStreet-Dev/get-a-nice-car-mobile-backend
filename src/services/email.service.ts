import nodemailer, { Transporter } from 'nodemailer';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    // Initialize transporter if SMTP is properly configured
    if (
      config.smtp.host &&
      config.smtp.user &&
      config.smtp.pass
    ) {
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
            ciphers: 'SSLv3',
          },
          ...(requiresTLS && {
            requireTLS: true,
          }),
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
            });
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
