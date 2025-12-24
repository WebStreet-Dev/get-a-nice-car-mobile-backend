import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Select, Tag, Typography, message, Modal, Button } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../services/api';
import type { BreakdownRequest } from '../types';

const { Title } = Typography;

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
};

const statusOptions = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

export default function BreakdownPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['breakdown', page, statusFilter],
    queryFn: () => adminApi.getBreakdownRequests({ page, limit: 10, status: statusFilter }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateBreakdownStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakdown'] });
      message.success('Status updated');
    },
    onError: () => message.error('Failed to update status'),
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    Modal.confirm({
      title: 'Update Status',
      content: `Are you sure you want to change the status to ${newStatus}?`,
      onOk: () => updateStatusMutation.mutate({ id, status: newStatus }),
    });
  };

  const openMap = (lat: number, lng: number) => {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'user',
      render: (user: BreakdownRequest['user']) => (
        <div>
          <div>{user?.name || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user?.phone}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: unknown, record: BreakdownRequest) => (
        <Button
          type="link"
          icon={<EnvironmentOutlined />}
          onClick={() => openMap(record.latitude, record.longitude)}
        >
          View on Map
        </Button>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'locationType',
      key: 'locationType',
      render: (type: string) => (
        <Tag color={type === 'LIVE' ? 'blue' : 'default'}>{type}</Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'liveDurationMinutes',
      key: 'liveDurationMinutes',
      render: (mins: number) => (mins ? `${mins} min` : '-'),
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
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: BreakdownRequest) => (
        <Select
          size="small"
          value={record.status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          disabled={record.status === 'RESOLVED'}
        >
          {statusOptions.map((status) => (
            <Select.Option key={status} value={status}>
              {status}
            </Select.Option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Breakdown Requests</Title>
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
          showTotal: (total) => `Total ${total} requests`,
        }}
      />
    </div>
  );
}



