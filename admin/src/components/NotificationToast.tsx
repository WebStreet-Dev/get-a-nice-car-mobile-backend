import { notification, Button } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, CalendarOutlined, CarOutlined, BellOutlined } from '@ant-design/icons';
import type { AdminNotification } from '../types';
import { adminApi } from '../services/api';

const typeIcons: Record<string, React.ReactNode> = {
  USER_REGISTERED: <UserOutlined style={{ color: '#1890ff' }} />,
  APPOINTMENT: <CalendarOutlined style={{ color: '#52c41a' }} />,
  BREAKDOWN: <CarOutlined style={{ color: '#ff4d4f' }} />,
  GENERAL: <BellOutlined style={{ color: '#faad14' }} />,
};

const typeColors: Record<string, string> = {
  USER_REGISTERED: '#1890ff',
  APPOINTMENT: '#52c41a',
  BREAKDOWN: '#ff4d4f',
  GENERAL: '#faad14',
};

interface NotificationHandlers {
  onApprove?: (notif: AdminNotification) => Promise<void>;
  onReject?: (notif: AdminNotification) => Promise<void>;
  onView?: (notif: AdminNotification) => void;
}

export function showNotificationToast(notif: AdminNotification, handlers?: NotificationHandlers) {
  const canApprove = ['USER_REGISTERED', 'APPOINTMENT', 'BREAKDOWN'].includes(notif.type);
  const data = notif.data as any;
  const hasId = data?.userId || data?.appointmentId || data?.requestId;

  const handleApprove = async () => {
    if (handlers?.onApprove) {
      await handlers.onApprove(notif);
    } else {
      // Default behavior
      try {
        if (notif.type === 'USER_REGISTERED' && data?.userId) {
          await adminApi.approveClient(data.userId);
          notification.success({ message: 'Client Approved', description: 'The client has been approved successfully.' });
        } else if (notif.type === 'APPOINTMENT' && data?.appointmentId) {
          await adminApi.approveAppointment(data.appointmentId);
          notification.success({ message: 'Appointment Approved', description: 'The appointment has been approved successfully.' });
        } else if (notif.type === 'BREAKDOWN' && data?.requestId) {
          await adminApi.approveBreakdown(data.requestId);
          notification.success({ message: 'Breakdown Approved', description: 'The breakdown request has been approved successfully.' });
        }
      } catch (error: any) {
        notification.error({ message: 'Approval Failed', description: error?.response?.data?.error || 'Failed to approve. Please try again.' });
      }
    }
  };

  const handleReject = async () => {
    if (handlers?.onReject) {
      await handlers.onReject(notif);
    } else {
      // Default behavior
      try {
        if (notif.type === 'USER_REGISTERED' && data?.userId) {
          await adminApi.rejectClient(data.userId, 'Rejected by admin');
          notification.success({ message: 'Client Rejected', description: 'The client has been rejected.' });
        } else if (notif.type === 'APPOINTMENT' && data?.appointmentId) {
          await adminApi.rejectAppointment(data.appointmentId);
          notification.success({ message: 'Appointment Rejected', description: 'The appointment has been rejected.' });
        } else if (notif.type === 'BREAKDOWN' && data?.requestId) {
          await adminApi.rejectBreakdown(data.requestId);
          notification.success({ message: 'Breakdown Rejected', description: 'The breakdown request has been rejected.' });
        }
      } catch (error: any) {
        notification.error({ message: 'Rejection Failed', description: error?.response?.data?.error || 'Failed to reject. Please try again.' });
      }
    }
  };

  const handleView = () => {
    if (handlers?.onView) {
      handlers.onView(notif);
    } else {
      // Default: navigate based on type
      const data = notif.data as any;
      if (notif.type === 'USER_REGISTERED' && data?.userId) {
        window.location.href = '/clients';
      } else if (notif.type === 'APPOINTMENT' && data?.appointmentId) {
        window.location.href = '/appointments';
      } else if (notif.type === 'BREAKDOWN' && data?.requestId) {
        window.location.href = '/breakdown';
      } else {
        window.location.href = '/alerts';
      }
    }
  };

  notification.open({
    message: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {typeIcons[notif.type]}
        <span style={{ fontWeight: 600 }}>{notif.title}</span>
      </div>
    ),
    description: (
      <div>
        <div style={{ marginBottom: 12 }}>{notif.message}</div>
        {canApprove && hasId && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleApprove}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Approve
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={handleReject}
            >
              Reject
            </Button>
            <Button
              size="small"
              onClick={handleView}
            >
              View
            </Button>
          </div>
        )}
        {!canApprove && (
          <Button
            type="primary"
            size="small"
            onClick={handleView}
            style={{ marginTop: 8 }}
          >
            View Details
          </Button>
        )}
      </div>
    ),
    icon: typeIcons[notif.type],
    duration: 10,
    placement: 'topRight',
    style: {
      borderLeft: `4px solid ${typeColors[notif.type]}`,
    },
    onClick: handleView,
  });
}



