import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Space, Typography, message, Modal, Form, Input, Select, InputNumber, Switch, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminApi } from '../services/api';
import type { FAQ } from '../types';

const { Title } = Typography;

const categories = ['SALES', 'SERVICE', 'GENERAL', 'ACCOUNTING'];

const categoryColors: Record<string, string> = {
  SALES: 'blue',
  SERVICE: 'green',
  GENERAL: 'default',
  ACCOUNTING: 'purple',
};

export default function FaqsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: adminApi.getFaqs,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      message.success('FAQ created');
      handleCloseModal();
    },
    onError: () => message.error('Failed to create FAQ'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FAQ> }) =>
      adminApi.updateFaq(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      message.success('FAQ updated');
      handleCloseModal();
    },
    onError: () => message.error('Failed to update FAQ'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      message.success('FAQ deleted');
    },
    onError: () => message.error('Failed to delete FAQ'),
  });

  const handleOpenModal = (faq?: FAQ) => {
    setEditingFaq(faq || null);
    if (faq) {
      form.setFieldsValue(faq);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
    form.resetFields();
  };

  const handleSubmit = (values: Partial<FAQ>) => {
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete FAQ',
      content: 'Are you sure you want to delete this FAQ?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      width: '40%',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={categoryColors[category]}>{category}</Tag>
      ),
    },
    {
      title: 'Published',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? 'green' : 'red'}>{isPublished ? 'Yes' : 'No'}</Tag>
      ),
    },
    { title: 'Order', dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: FAQ) => (
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
        <Title level={3}>FAQs</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add FAQ
        </Button>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={isLoading} pagination={false} />

      <Modal
        title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="question" label="Question" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="answer" label="Answer" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              {categories.map((cat) => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="sortOrder" label="Sort Order" initialValue={0}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="isPublished" label="Published" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingFaq ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleCloseModal}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}




