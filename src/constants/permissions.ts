export interface Permission {
  key: string;
  label: string;
  group: string;
}

export const AVAILABLE_PERMISSIONS: Permission[] = [
  { key: 'view_clients', label: 'View Clients', group: 'Clients' },
  { key: 'manage_clients', label: 'Manage Clients', group: 'Clients' },
  { key: 'view_appointments', label: 'View Appointments', group: 'Appointments' },
  { key: 'manage_appointments', label: 'Manage Appointments', group: 'Appointments' },
  { key: 'view_departments', label: 'View Departments', group: 'Settings' },
  { key: 'manage_departments', label: 'Manage Departments', group: 'Settings' },
  { key: 'view_faqs', label: 'View FAQs', group: 'Content' },
  { key: 'manage_faqs', label: 'Manage FAQs', group: 'Content' },
  { key: 'view_breakdowns', label: 'View Breakdowns', group: 'Support' },
  { key: 'manage_breakdowns', label: 'Manage Breakdowns', group: 'Support' },
  { key: 'send_notifications', label: 'Send Notifications', group: 'Notifications' },
  { key: 'view_employees', label: 'View Employees', group: 'Users' },
  { key: 'manage_employees', label: 'Manage Employees', group: 'Users' },
  { key: 'manage_roles', label: 'Manage Roles', group: 'Users' },
];
