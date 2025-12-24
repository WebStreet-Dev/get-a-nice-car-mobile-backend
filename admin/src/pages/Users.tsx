import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Input, Tag, Button, Space, Typography, message, Tabs, Modal, Input as AntInput } from 'antd';
import { SearchOutlined, UserAddOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../services/api';
import type { User } from '../types';

const { Title, Text } = Typography;

const { Title, Text } = Typography;
const { TextArea } = AntInput;

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [createUserModalVisible, setCreateUserModalVisible] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 10, search: search || undefined }),
    enabled: activeTab === 'all',
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingUsers', pendingPage],
    queryFn: () => adminApi.getPendingUsers({ page: pendingPage, limit: 10 }),
    enabled: activeTab === 'pending',
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('User status updated');
    },
    onError: () => {
      message.error('Failed to update user status');
    },
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      message.success('User approved successfully');
    },
    onError: () => {
      message.error('Failed to approve user');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      message.success('User rejected');
      setRejectModalVisible(false);
      setRejectReason('');
      setRejectingUserId(null);
    },
    onError: () => {
      message.error('Failed to reject user');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: adminApi.createInternalUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Internal user created successfully');
      setCreateUserModalVisible(false);
    },
    onError: () => {
      message.error('Failed to create user');
    },
  });

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
        <Title level={3}>Users</Title>
        <Space>
          {activeTab === 'all' && (
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
            />
          )}
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setCreateUserModalVisible(true)}
          >
            Create Internal User
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'all',
            label: 'All Users',
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
                  showTotal: (total) => `Total ${total} users`,
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
                  showTotal: (total) => `Total ${total} pending users`,
                }}
              />
            ),
          },
        ]}
      />

      {/* Reject User Modal */}
      <Modal
        title="Reject User"
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
          <Text>Please provide a reason for rejecting this user:</Text>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            style={{ marginTop: 12 }}
          />
        </div>
      </Modal>

      {/* Create Internal User Modal */}
      <CreateUserModal
        visible={createUserModalVisible}
        onCancel={() => setCreateUserModalVisible(false)}
        onSuccess={() => {
          setCreateUserModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }}
        mutation={createUserMutation}
      />
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({
  visible,
  onCancel,
  onSuccess,
  mutation,
}: {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  mutation: any;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
    customRoleId: undefined as string | undefined,
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      message.warning('Please fill in all required fields');
      return;
    }

    mutation.mutate(formData, {
      onSuccess: () => {
        message.success('User created successfully');
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'USER',
          customRoleId: undefined,
        });
        onSuccess();
      },
    });
  };

  return (
    <Modal
      title="Create Internal User"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Create"
      okButtonProps={{ loading: mutation.isPending }}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Name *</Text>
          <AntInput
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Email *</Text>
          <AntInput
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Phone *</Text>
          <AntInput
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Role *</Text>
          <AntInput
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="USER, ADMIN, or SUPER_ADMIN"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Password *</Text>
          <AntInput.Password
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
}




