import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Space, Typography, message, Modal, Input, Tag, Checkbox, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { Role } from '../types';

interface Permission {
  key: string;
  label: string;
  group: string;
}

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function RolesPage() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => adminApi.getRoles(),
  });

  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => adminApi.getPermissions(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; permissions: string[] }) =>
      adminApi.createRole(data),
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
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; permissions?: string[] } }) =>
      adminApi.updateRole(id, data),
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
    mutationFn: (id: string) => adminApi.deleteRole(id),
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
        permissions={permissions || []}
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
          onSuccess={(data: { name: string; description?: string; permissions: string[] }) => {
            updateMutation.mutate({ 
              id: editingRole.id, 
              data: { 
                name: data.name, 
                description: data.description, 
                permissions: data.permissions 
              } 
            });
          }}
          loading={updateMutation.isPending}
          permissions={permissions || []}
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
  permissions,
}: {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (data: { name: string; description?: string; permissions: string[] }) => void;
  loading: boolean;
  permissions: Permission[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setFormData({ name: '', description: '' });
      setSelectedPermissions([]);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!formData.name) {
      message.warning('Name is required');
      return;
    }
    if (selectedPermissions.length === 0) {
      message.warning('At least one permission is required');
      return;
    }

    onSuccess({
      name: formData.name,
      description: formData.description || undefined,
      permissions: selectedPermissions,
    });
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.group]) {
      acc[perm.group] = [];
    }
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Modal
      title="Create Role"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Create"
      okButtonProps={{ loading }}
      width={600}
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
          <Text strong>Permissions *</Text>
          <div style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 12 }}>
            {Object.entries(groupedPermissions).map(([group, perms]) => (
              <div key={group} style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 12, color: '#666' }}>{group}</Text>
                <Checkbox.Group
                  value={selectedPermissions}
                  onChange={(values) => setSelectedPermissions(values as string[])}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {perms.map((perm) => (
                      <Checkbox key={perm.key} value={perm.key}>
                        {perm.label}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
                {group !== Object.keys(groupedPermissions)[Object.keys(groupedPermissions).length - 1] && (
                  <Divider style={{ margin: '12px 0' }} />
                )}
              </div>
            ))}
          </div>
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
  permissions,
}: {
  visible: boolean;
  role: Role;
  onCancel: () => void;
  onSuccess: (data: { name: string; description?: string; permissions: string[] }) => void;
  loading: boolean;
  permissions: Permission[];
}) {
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions);

  useEffect(() => {
    if (visible) {
      setFormData({
        name: role.name,
        description: role.description || '',
      });
      setSelectedPermissions(role.permissions);
    }
  }, [visible, role]);

  const handleSubmit = () => {
    if (!formData.name) {
      message.warning('Name is required');
      return;
    }
    if (selectedPermissions.length === 0) {
      message.warning('At least one permission is required');
      return;
    }

    onSuccess({
      name: formData.name,
      description: formData.description || undefined,
      permissions: selectedPermissions,
    });
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.group]) {
      acc[perm.group] = [];
    }
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Modal
      title="Edit Role"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Save"
      okButtonProps={{ loading }}
      width={600}
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
          <Text strong>Permissions *</Text>
          <div style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 12 }}>
            {Object.entries(groupedPermissions).map(([group, perms]) => (
              <div key={group} style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 12, color: '#666' }}>{group}</Text>
                <Checkbox.Group
                  value={selectedPermissions}
                  onChange={(values) => setSelectedPermissions(values as string[])}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {perms.map((perm) => (
                      <Checkbox key={perm.key} value={perm.key}>
                        {perm.label}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
                {group !== Object.keys(groupedPermissions)[Object.keys(groupedPermissions).length - 1] && (
                  <Divider style={{ margin: '12px 0' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </Space>
    </Modal>
  );
}

