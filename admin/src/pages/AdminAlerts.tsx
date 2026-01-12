import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Tag, Button, Space, Typography, message, Badge, Empty, Modal } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, CalendarOutlined, CarOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { adminApi } from '../services/api';
import type { AdminNotification } from '../types';

const { Title, Text } = Typography;

const typeIcons: Record<string, React.ReactNode> = {
  USER_REGISTERED: <UserOutlined style={{ color: '#1890ff' }} />,
  APPOINTMENT: <CalendarOutlined style={{ color: '#52c41a' }} />,
  BREAKDOWN: <CarOutlined style={{ color: '#ff4d4f' }} />,
  GENERAL: <BellOutlined style={{ color: '#faad14' }} />,
};

const typeColors: Record<string, string> = {
  USER_REGISTERED: 'blue',
  APPOINTMENT: 'green',
  BREAKDOWN: 'red',
  GENERAL: 'orange',
};

export default function AdminAlertsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminNotifications', page, unreadOnly],
    queryFn: () => adminApi.getAdminNotifications({ page, limit: 20, unreadOnly }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: adminApi.markAdminNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotificationCount'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: adminApi.markAllAdminNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotificationCount'] });
      message.success('All notifications marked as read');
    },
  });

  const handleApprove = async (notification: AdminNotification) => {
    try {
      const data = notification.data as any;
      
      if (notification.type === 'USER_REGISTERED' && data?.userId) {
        await adminApi.approveClient(data.userId);
        message.success('Client approved successfully');
        markReadMutation.mutate(notification.id);
        navigate('/clients');
      } else if (notification.type === 'APPOINTMENT' && data?.appointmentId) {
        await adminApi.approveAppointment(data.appointmentId);
        message.success('Appointment approved successfully');
        markReadMutation.mutate(notification.id);
        navigate('/appointments');
      } else if (notification.type === 'BREAKDOWN' && data?.requestId) {
        await adminApi.approveBreakdown(data.requestId);
        message.success('Breakdown request approved successfully');
        markReadMutation.mutate(notification.id);
        navigate('/breakdown');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (notification: AdminNotification) => {
    try {
      const data = notification.data as any;
      
      if (notification.type === 'USER_REGISTERED' && data?.userId) {
        Modal.confirm({
          title: 'Reject Client',
          content: 'Are you sure you want to reject this client?',
          onOk: async () => {
            await adminApi.rejectClient(data.userId, 'Rejected by admin');
            message.success('Client rejected');
            markReadMutation.mutate(notification.id);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
          },
        });
      } else if (notification.type === 'APPOINTMENT' && data?.appointmentId) {
        Modal.confirm({
          title: 'Reject Appointment',
          content: 'Are you sure you want to reject this appointment?',
          onOk: async () => {
            await adminApi.rejectAppointment(data.appointmentId);
            message.success('Appointment rejected');
            markReadMutation.mutate(notification.id);
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
          },
        });
      } else if (notification.type === 'BREAKDOWN' && data?.requestId) {
        Modal.confirm({
          title: 'Reject Breakdown Request',
          content: 'Are you sure you want to reject this breakdown request?',
          onOk: async () => {
            await adminApi.rejectBreakdown(data.requestId);
            message.success('Breakdown request rejected');
            markReadMutation.mutate(notification.id);
            queryClient.invalidateQueries({ queryKey: ['breakdown'] });
          },
        });
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || 'Failed to reject');
    }
  };

  const handleView = (notification: AdminNotification) => {
    const data = notification.data as any;
    
    if (notification.type === 'USER_REGISTERED' && data?.userId) {
      navigate('/clients');
    } else if (notification.type === 'APPOINTMENT' && data?.appointmentId) {
      navigate('/appointments');
    } else if (notification.type === 'BREAKDOWN' && data?.requestId) {
      navigate('/breakdown');
    }
    
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Space>
          {typeIcons[type]}
          <Tag color={typeColors[type]}>{type.replace('_', ' ')}</Tag>
        </Space>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: AdminNotification) => (
        <Space>
          {!record.isRead && <Badge status="processing" />}
          <Text strong={!record.isRead}>{title}</Text>
        </Space>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: AdminNotification) => {
        const canApprove = ['USER_REGISTERED', 'APPOINTMENT', 'BREAKDOWN'].includes(record.type);
        const data = record.data as any;
        const hasId = data?.userId || data?.appointmentId || data?.requestId;
        
        return (
          <Space>
            {canApprove && hasId && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record)}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record)}
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              size="small"
              onClick={() => handleView(record)}
            >
              View
            </Button>
            {!record.isRead && (
              <Button
                size="small"
                type="link"
                onClick={() => markReadMutation.mutate(record.id)}
              >
                Mark Read
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const unreadCount = data?.unreadCount || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3}>Admin Alerts</Title>
          <Text type="secondary">
            Pending approvals and notifications
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ marginLeft: 8 }} />
            )}
          </Text>
        </div>
        <Space>
          <Button
            onClick={() => setUnreadOnly(!unreadOnly)}
            type={unreadOnly ? 'primary' : 'default'}
          >
            {unreadOnly ? 'Show All' : 'Unread Only'}
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
            >
              Mark All Read
            </Button>
          )}
        </Space>
      </div>

      <Card>
        {notifications.length === 0 ? (
          <Empty description="No notifications" />
        ) : (
          <Table
            columns={columns}
            dataSource={notifications}
            loading={isLoading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: 20,
              total,
              onChange: setPage,
            }}
            rowClassName={(record) => (!record.isRead ? 'unread-notification' : '')}
          />
        )}
      </Card>

      <style>{`
        .unread-notification {
          background-color: #f0f9ff;
        }
      `}</style>
    </div>
  );
}



