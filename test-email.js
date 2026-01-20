/**
 * Test script to verify GoDaddy SMTP email configuration
 * Run with: node test-email.js
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'hello@getanicecar.com',
    pass: process.env.SMTP_PASS || 'TempP@ss-3',
  },
  tls: {
    rejectUnauthorized: false,
  },
};

console.log('Testing GoDaddy SMTP Configuration...');
console.log('Host:', smtpConfig.host);
console.log('Port:', smtpConfig.port);
console.log('User:', smtpConfig.auth.user);
console.log('');

const transporter = nodemailer.createTransport(smtpConfig);

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!');
    console.log('');
    
    // Try sending a test email
    console.log('Sending test email...');
    const mailOptions = {
      from: `"Get a Nice Car" <${smtpConfig.auth.user}>`,
      to: 'isururaveen4520@gmail.com',
      subject: 'Test Email from GoDaddy SMTP',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify GoDaddy SMTP configuration.</p>
        <p>If you receive this, the email service is working correctly!</p>
      `,
      text: 'This is a test email to verify GoDaddy SMTP configuration.',
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email Send Failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Response:', error.response);
        process.exit(1);
      } else {
        console.log('✅ Test Email Sent Successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('');
        console.log('Please check isururaveen4520@gmail.com inbox (and spam folder)');
        process.exit(0);
      }
    });
  }
});
