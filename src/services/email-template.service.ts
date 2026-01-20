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

interface FormSubmissionData {
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
   * Generate HTML email template for ALL form submissions
   * Works for any department (Service, Sales, General, etc.)
   */
  generateFormSubmissionEmail(data: FormSubmissionData): {
    html: string;
    text: string;
  } {
    const { appointment } = data;
    
    // Get contact information
    const contactName = appointment.contactName || appointment.user.name || 'Not provided';
    const contactEmail = appointment.contactEmail || 'Not provided';
    const contactPhone = appointment.contactPhone || 'Not provided';
    
    // Get department name
    const departmentName = appointment.department.name || 'Unknown Department';
    
    // Parse vehicle information if available
    const vehicleInfo = appointment.vehicleOfInterest || 'Not specified';
    
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

    // Format date and time more compactly
    const formattedDateTime = appointmentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + appointmentDate.toLocaleTimeString('en-US', {
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
  <title>New Form Submission - ${this.escapeHtml(departmentName)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.3px;">
                New Form Submission
              </h1>
              <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 15px; opacity: 0.95; font-weight: 500;">
                ${this.escapeHtml(departmentName)} Department
              </p>
            </td>
          </tr>
          
          <!-- Main Content - All details in one clean layout -->
          <tr>
            <td style="padding: 0;">
              <!-- Customer Info Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
                <tr>
                  <td style="padding: 28px 30px 24px 30px; border-bottom: 1px solid #e8ecf0;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 0 0 20px 0;">
                          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; line-height: 48px; color: #ffffff; font-size: 20px; font-weight: 600;">
                            ${contactName.charAt(0).toUpperCase()}
                          </div>
                          <div style="display: inline-block; vertical-align: top; margin-left: 16px; padding-top: 4px;">
                            <div style="color: #1a202c; font-size: 18px; font-weight: 700; line-height: 1.3; margin-bottom: 4px;">${this.escapeHtml(contactName)}</div>
                            <div style="color: #718096; font-size: 14px;">Customer</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 12px 0; width: 50%;">
                                <div style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Email</div>
                                <a href="mailto:${this.escapeHtml(contactEmail)}" style="color: #667eea; text-decoration: none; font-size: 15px; font-weight: 500; word-break: break-word;">${this.escapeHtml(contactEmail)}</a>
                              </td>
                              <td style="padding: 12px 0; width: 50%;">
                                <div style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Phone</div>
                                <a href="tel:${this.escapeHtml(contactPhone)}" style="color: #667eea; text-decoration: none; font-size: 15px; font-weight: 500;">${this.escapeHtml(contactPhone)}</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Appointment Details Row -->
                <tr>
                  <td style="padding: 24px 30px; border-bottom: 1px solid #e8ecf0; background-color: #f8f9fa;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 0 16px 0 0; width: 33.33%;">
                          <div style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Date & Time</div>
                          <div style="color: #1a202c; font-size: 15px; font-weight: 600; line-height: 1.4;">${formattedDateTime}</div>
                        </td>
                        <td style="padding: 0 16px 0 0; width: 33.33%;">
                          <div style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Department</div>
                          <div style="color: #1a202c; font-size: 15px; font-weight: 600;">${this.escapeHtml(departmentName)}</div>
                        </td>
                        <td style="padding: 0; width: 33.33%;">
                          <div style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Status</div>
                          <span style="display: inline-block; padding: 6px 14px; background-color: #fef3c7; color: #92400e; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: capitalize;">
                            ${appointment.status.toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                ${vehicleInfo && vehicleInfo !== 'Not specified' ? `
                <!-- Vehicle Info Row -->
                <tr>
                  <td style="padding: 24px 30px; border-bottom: 1px solid #e8ecf0;">
                    <div style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Vehicle</div>
                    <div style="color: #1a202c; font-size: 16px; font-weight: 600;">${this.escapeHtml(vehicleInfo)}</div>
                  </td>
                </tr>
                ` : ''}
                
                ${appointment.notes ? `
                <!-- Notes Row -->
                <tr>
                  <td style="padding: 24px 30px; border-bottom: 1px solid #e8ecf0; text-align: left;">
                    <div style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; text-align: left;">Notes</div>
                    <div style="color: #4a5568; font-size: 15px; line-height: 1.6; white-space: pre-wrap; background-color: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 3px solid #667eea; text-align: left; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; display: block;">
                      ${this.escapeHtml(appointment.notes)}
                    </div>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Reference Info -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f8f9fa;">
                    <div style="color: #a0aec0; font-size: 11px; text-align: center; line-height: 1.5;">
                      Reference ID: <span style="color: #718096; font-weight: 600;">${appointment.id}</span> • Submitted: ${new Date().toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px; text-align: center; border-top: 1px solid #e8ecf0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                Automated notification from <strong style="color: #667eea;">Get a Nice Car</strong> mobile app
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
NEW FORM SUBMISSION - ${departmentName.toUpperCase()} DEPARTMENT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CUSTOMER INFORMATION
${contactName}
Email: ${contactEmail}
Phone: ${contactPhone}

APPOINTMENT DETAILS
Date & Time: ${formattedDateTime}
Department: ${departmentName}
Status: ${appointment.status}

${vehicleInfo && vehicleInfo !== 'Not specified' ? `VEHICLE
${vehicleInfo}

` : ''}${appointment.notes ? `NOTES
${appointment.notes}

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference ID: ${appointment.id}
Submitted: ${new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}

Automated notification from Get a Nice Car mobile app
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
