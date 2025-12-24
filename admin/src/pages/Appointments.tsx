import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Select, Tag, Button, Space, Typography, message, Modal } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../services/api';
import type { Appointment } from '../types';

const { Title } = Typography;

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  CANCELLED: 'red',
  COMPLETED: 'green',
};

const statusOptions = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', page, statusFilter],
    queryFn: () => adminApi.getAppointments({ page, limit: 10, status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      message.success('Appointment status updated');
    },
    onError: () => {
      message.error('Failed to update appointment status');
    },
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      message.success('Appointment approved successfully');
    },
    onError: () => {
      message.error('Failed to approve appointment');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminApi.rejectAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      message.success('Appointment rejected');
    },
    onError: () => {
      message.error('Failed to reject appointment');
    },
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    Modal.confirm({
      title: 'Update Status',
      content: `Are you sure you want to change the status to ${newStatus}?`,
      onOk: () => updateStatusMutation.mutate({ id, status: newStatus }),
    });
  };

  const handleApprove = (id: string) => {
    Modal.confirm({
      title: 'Approve Appointment',
      content: 'Are you sure you want to approve this appointment?',
      onOk: () => approveMutation.mutate(id),
    });
  };

  const handleReject = (id: string) => {
    Modal.confirm({
      title: 'Reject Appointment',
      content: 'Are you sure you want to reject this appointment?',
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: () => rejectMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'user',
      render: (user: Appointment['user']) => (
        <div>
          <div>{user?.name || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user?.email}</div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: Appointment['department']) => dept?.name || 'N/A',
    },
    {
      title: 'Date & Time',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{dayjs(date).format('HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleOfInterest',
      key: 'vehicleOfInterest',
      render: (vehicle: string) => vehicle || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Appointment) => {
        if (record.status === 'PENDING') {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                loading={approveMutation.isPending}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
                loading={rejectMutation.isPending}
              >
                Reject
              </Button>
            </Space>
          );
        }
        return (
          <Select
            size="small"
            value={record.status}
            style={{ width: 120 }}
            onChange={(value) => handleStatusChange(record.id, value)}
            loading={updateStatusMutation.isPending}
          >
            {statusOptions.map((status) => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Appointments</Title>
        <Space>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {statusOptions.map((status) => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.pagination.total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (total) => `Total ${total} appointments`,
        }}
      />
    </div>
  );
}




