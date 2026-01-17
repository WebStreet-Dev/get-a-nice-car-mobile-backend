import { Appointment } from '@prisma/client';

interface ServiceAppointmentData {
  appointment: Appointment & {
    department: {
      name: string;
      email: string;
    };
    user: {
      name: string;
    };
  };
}

class EmailTemplateService {
  /**
   * Generate HTML email template for Service appointment notifications
   */
  generateServiceAppointmentEmail(data: ServiceAppointmentData): {
    html: string;
    text: string;
  } {
    const { appointment } = data;
    
    // Parse contact name (format: "FirstName LastName")
    const contactName = appointment.contactName || appointment.user.name;
    const nameParts = contactName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Parse vehicle information (format: "Year Make & Model")
    const vehicleInfo = appointment.vehicleOfInterest || '';
    const vehicleParts = vehicleInfo.trim().split(/\s+/);
    const year = vehicleParts[0] || '';
    const makeModel = vehicleParts.slice(1).join(' ') || '';

    // Format date and time
    const appointmentDate = new Date(appointment.dateTime);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Service Appointment Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1976d2; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">New Service Appointment Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                A new service appointment request has been submitted through the mobile app.
              </p>
              
              <!-- Contact Information Section -->
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
                  Contact Information
                </h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 150px;"><strong>First Name:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${this.escapeHtml(firstName)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Last Name:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${this.escapeHtml(lastName)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Phone:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${this.escapeHtml(appointment.contactPhone || 'N/A')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${this.escapeHtml(appointment.contactEmail || 'N/A')}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Vehicle Information Section -->
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
                  Vehicle Information
                </h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 150px;"><strong>Year:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${this.escapeHtml(year)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Make & Model:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${this.escapeHtml(makeModel)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Issue Description Section -->
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
                  Issue Description
                </h2>
                <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                  ${this.escapeHtml(appointment.notes || 'No description provided')}
                </p>
              </div>
              
              <!-- Appointment Details Section -->
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
                  Appointment Details
                </h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 150px;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Time:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${formattedTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; text-transform: capitalize;">${appointment.status.toLowerCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;"><strong>Appointment ID:</strong></td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${appointment.id}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                This is an automated email from Get a Nice Car mobile app.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Plain text version
    const text = `
New Service Appointment Request

A new service appointment request has been submitted through the mobile app.

CONTACT INFORMATION
-------------------
First Name: ${firstName}
Last Name: ${lastName}
Phone: ${appointment.contactPhone || 'N/A'}
Email: ${appointment.contactEmail || 'N/A'}

VEHICLE INFORMATION
-------------------
Year: ${year}
Make & Model: ${makeModel}

ISSUE DESCRIPTION
----------------
${appointment.notes || 'No description provided'}

APPOINTMENT DETAILS
------------------
Date: ${formattedDate}
Time: ${formattedTime}
Status: ${appointment.status}
Appointment ID: ${appointment.id}

---
This is an automated email from Get a Nice Car mobile app.
Please do not reply to this email.
    `.trim();

    return { html, text };
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;
