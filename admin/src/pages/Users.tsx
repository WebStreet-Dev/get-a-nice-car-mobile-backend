import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Input, Tag, Button, Space, Typography, message, Tabs, Modal } from 'antd';
import { SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../services/api';
import type { User } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => adminApi.getClients({ page, limit: 10, search: search || undefined }),
    enabled: activeTab === 'all',
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingClients', pendingPage],
    queryFn: () => adminApi.getPendingClients({ page: pendingPage, limit: 10 }),
    enabled: activeTab === 'pending',
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleClientStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      message.success('Client status updated');
    },
    onError: () => {
      message.error('Failed to update client status');
    },
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['pendingClients'] });
      message.success('Client approved successfully');
    },
    onError: () => {
      message.error('Failed to approve client');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectClient(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['pendingClients'] });
      message.success('Client rejected');
      setRejectModalVisible(false);
      setRejectReason('');
      setRejectingUserId(null);
    },
    onError: () => {
      message.error('Failed to reject client');
    },
  });

  // Remove create user mutation - employees are created separately

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'SUPER_ADMIN' ? 'purple' : role === 'ADMIN' ? 'blue' : 'default'}>{role}</Tag>
      ),
    },
    {
      title: 'Account Status',
      dataIndex: 'accountStatus',
      key: 'accountStatus',
      render: (status: string) => {
        const color = status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        // Hide toggle button for super admin
        record.role === 'SUPER_ADMIN' ? (
          <Tag color="purple">Protected</Tag>
        ) : (
          <Button
            size="small"
            danger={record.isActive}
            onClick={() => toggleMutation.mutate(record.id)}
            loading={toggleMutation.isPending}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        )
      ),
    },
  ];

  const pendingColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => approveMutation.mutate(record.id)}
            loading={approveMutation.isPending}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              setRejectingUserId(record.id);
              setRejectModalVisible(true);
            }}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Clients</Title>
        <Space>
          {activeTab === 'all' && (
            <Input
              placeholder="Search clients..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
          )}
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'all',
            label: 'All Clients',
            children: (
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
                  showTotal: (total) => `Total ${total} clients`,
                }}
              />
            ),
          },
          {
            key: 'pending',
            label: `Pending (${pendingData?.pagination.total || 0})`,
            children: (
              <Table
                columns={pendingColumns}
                dataSource={pendingData?.data}
                rowKey="id"
                loading={pendingLoading}
                pagination={{
                  current: pendingPage,
                  total: pendingData?.pagination.total,
                  pageSize: 10,
                  onChange: setPendingPage,
                  showTotal: (total) => `Total ${total} pending clients`,
                }}
              />
            ),
          },
        ]}
      />

      {/* Reject Client Modal */}
      <Modal
        title="Reject Client"
        open={rejectModalVisible}
        onOk={() => {
          if (rejectingUserId && rejectReason.trim()) {
            rejectMutation.mutate({ id: rejectingUserId, reason: rejectReason.trim() });
          } else {
            message.warning('Please provide a rejection reason');
          }
        }}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setRejectingUserId(null);
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div>
          <Text>Please provide a reason for rejecting this client:</Text>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            style={{ marginTop: 12 }}
          />
        </div>
      </Modal>

    </div>
  );
}




