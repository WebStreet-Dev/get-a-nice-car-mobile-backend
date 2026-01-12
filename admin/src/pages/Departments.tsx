import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Space, Typography, message, Modal, Form, Input, InputNumber, Switch, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { Department } from '../types';

const { Title } = Typography;

export default function DepartmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: adminApi.getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success('Department created');
      handleCloseModal();
    },
    onError: () => message.error('Failed to create department'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      adminApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success('Department updated');
      handleCloseModal();
    },
    onError: () => message.error('Failed to update department'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      message.success('Department deleted');
    },
    onError: () => message.error('Failed to delete department'),
  });

  const handleOpenModal = (dept?: Department) => {
    setEditingDept(dept || null);
    if (dept) {
      form.setFieldsValue(dept);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    form.resetFields();
  };

  const handleSubmit = (values: Partial<Department>) => {
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Department',
      content: 'Are you sure you want to delete this department?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    { title: 'Order', dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Department) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(record)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Departments</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add Department
        </Button>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={isLoading} pagination={false} />

      <Modal
        title={editingDept ? 'Edit Department' : 'Add Department'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="icon" label="Icon" rules={[{ required: true }]}>
            <Input placeholder="e.g., sales, service, accounting" />
          </Form.Item>
          <Form.Item name="sortOrder" label="Sort Order" initialValue={0}>
            <InputNumber min={0} />
          </Form.Item>
          {editingDept && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingDept ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleCloseModal}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}








