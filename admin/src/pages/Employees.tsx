import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Input, Tag, Button, Space, Typography, message, Modal, Form, Select } from 'antd';
import { SearchOutlined, UserAddOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../services/api';
import type { User, Role } from '../types';

const { Title } = Typography;

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch roles for dropdown
  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => adminApi.getRoles(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: () => adminApi.getEmployees({ page, limit: 10, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      message.success('Employee created successfully');
      setCreateModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Failed to create employee');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleEmployeeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      message.success('Employee status updated');
    },
    onError: () => {
      message.error('Failed to update employee status');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; phone?: string } }) =>
      adminApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      message.success('Employee updated successfully');
      setEditModalVisible(false);
      setEditingEmployee(null);
      editForm.resetFields();
    },
    onError: () => {
      message.error('Failed to update employee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      message.success('Employee deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete employee');
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
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          SUPER_ADMIN: 'red',
          ADMIN: 'orange',
          USER: 'blue',
        };
        return <Tag color={colorMap[role] || 'default'}>{role}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
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
      render: (_: any, record: User) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingEmployee(record);
              editForm.setFieldsValue({
                name: record.name,
                email: record.email,
                phone: record.phone,
              });
              setEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            onClick={() => toggleMutation.mutate(record.id)}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Employee',
                content: `Are you sure you want to delete ${record.name}?`,
                onOk: () => deleteMutation.mutate(record.id),
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreate = async (values: any) => {
    createMutation.mutate({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role: values.role,
      customRoleId: values.customRoleId || undefined,
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Employees</Title>
        <Space>
          <Input
            placeholder="Search employees..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Employee
          </Button>
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
          showTotal: (total) => `Total ${total} employees`,
        }}
      />

      {/* Create Employee Modal */}
      <Modal
        title="Create Employee"
        open={createModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        okText="Create"
        okButtonProps={{ loading: createMutation.isPending }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter password' }, { min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="System Role"
            rules={[{ required: true, message: 'Please select role' }]}
            initialValue="ADMIN"
          >
            <Select>
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="SUPER_ADMIN">Super Admin</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="customRoleId"
            label="Custom Role (Optional)"
            tooltip="Assign a custom role with specific permissions"
          >
            <Select
              placeholder="Select a custom role"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {roles?.filter(role => !role.isSystemRole).map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name} {role.description && `- ${role.description}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        title="Edit Employee"
        open={editModalVisible}
        onOk={() => editForm.submit()}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingEmployee(null);
          editForm.resetFields();
        }}
        okText="Update"
        okButtonProps={{ loading: updateMutation.isPending }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingEmployee) {
              updateMutation.mutate({
                id: editingEmployee.id,
                data: {
                  name: values.name,
                  email: values.email,
                  phone: values.phone,
                },
              });
            }
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}



