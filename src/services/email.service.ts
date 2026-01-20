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
          ...(requiresTLS && {
            requireTLS: true,
            tls: {
              ciphers: 'SSLv3',
              rejectUnauthorized: false, // GoDaddy may require this
            },
          }),
          ...(isSecure && {
            tls: {
              rejectUnauthorized: false, // GoDaddy may require this for SSL
            },
          }),
        });

        logger.info('Email service initialized', {
          host: config.smtp.host,
          port: config.smtp.port,
          from: config.smtp.from,
        });
      } catch (error) {
        logger.error('Failed to initialize email service', { error });
        this.transporter = null;
      }
    } else {
      logger.warn('Email service not configured - SMTP settings missing');
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
      logger.warn('Email service not available - SMTP not configured');
      return;
    }

    if (!to || !to.includes('@')) {
      logger.warn('Invalid email address', { to });
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId,
      });
    } catch (error: any) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: error.message,
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
