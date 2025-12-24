/**
 * vCita service for handling Sales department appointments
 */
export class VcitaService {
  /**
   * Get vCita scheduling URL
   */
  getSchedulingUrl(): string {
    return 'https://clients.vcita.com/portal/a2a05a2e89c6a898#/schedule?s=https%3A%2F%2Flive.vcita.com%2Fsite%2Fnicecarinc%2Fonline-scheduling&o=ZGlyZWN0&isWidget=false&fromName&step=1';
  }

  /**
   * Check if department is Sales
   */
  isSalesDepartment(departmentName: string): boolean {
    return departmentName.toLowerCase() === 'sales';
  }
}

export const vcitaService = new VcitaService();
export default vcitaService;

