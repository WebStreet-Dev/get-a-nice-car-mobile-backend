import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Space, Typography, message, Modal, Input, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export default function RolesPage() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/roles', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const result = await response.json();
      return result.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; permissions: string[] }) => {
      const response = await fetch('/api/v1/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create role');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role created successfully');
      setCreateModalVisible(false);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Role> }) => {
      const response = await fetch(`/api/v1/admin/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update role');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role updated successfully');
      setEditModalVisible(false);
      setEditingRole(null);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/admin/roles/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete role');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role deleted successfully');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to delete role');
    },
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Type',
      dataIndex: 'isSystemRole',
      key: 'isSystemRole',
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'purple' : 'blue'}>{isSystem ? 'System' : 'Custom'}</Tag>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.slice(0, 3).map((perm) => (
            <Tag key={perm}>{perm}</Tag>
          ))}
          {permissions.length > 3 && <Tag>+{permissions.length - 3} more</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Role) => (
        <Space>
          {!record.isSystemRole && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingRole(record);
                  setEditModalVisible(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Role',
                    content: `Are you sure you want to delete "${record.name}"?`,
                    okText: 'Delete',
                    okButtonProps: { danger: true },
                    onOk: () => deleteMutation.mutate(record.id),
                  });
                }}
                loading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Roles</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          Create Role
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={isLoading}
      />

      {/* Create Role Modal */}
      <CreateRoleModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit Role Modal */}
      {editingRole && (
        <EditRoleModal
          visible={editModalVisible}
          role={editingRole}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingRole(null);
          }}
          onSuccess={(data) => updateMutation.mutate({ id: editingRole.id, data })}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateRoleModal({
  visible,
  onCancel,
  onSuccess,
  loading,
}: {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (data: { name: string; description?: string; permissions: string[] }) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: '',
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.permissions) {
      message.warning('Name and permissions are required');
      return;
    }

    const permissions = formData.permissions
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    onSuccess({
      name: formData.name,
      description: formData.description || undefined,
      permissions,
    });

    setFormData({ name: '', description: '', permissions: '' });
  };

  return (
    <Modal
      title="Create Role"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Create"
      okButtonProps={{ loading }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Name *</Text>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Sales Manager"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Description</Text>
          <TextArea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter role description"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Permissions * (comma-separated)</Text>
          <TextArea
            rows={3}
            value={formData.permissions}
            onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
            placeholder="e.g., view_users, edit_appointments, manage_departments"
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
}

function EditRoleModal({
  visible,
  role,
  onCancel,
  onSuccess,
  loading,
}: {
  visible: boolean;
  role: Role;
  onCancel: () => void;
  onSuccess: (data: Partial<Role>) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
    permissions: role.permissions.join(', '),
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.permissions) {
      message.warning('Name and permissions are required');
      return;
    }

    const permissions = formData.permissions
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    onSuccess({
      name: formData.name,
      description: formData.description || undefined,
      permissions,
    });
  };

  return (
    <Modal
      title="Edit Role"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Save"
      okButtonProps={{ loading }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Name *</Text>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Description</Text>
          <TextArea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Permissions * (comma-separated)</Text>
          <TextArea
            rows={3}
            value={formData.permissions}
            onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </Modal>
  );
}

