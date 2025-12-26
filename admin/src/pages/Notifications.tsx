import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, Form, Input, Select, Button, Typography, message, Alert } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { adminApi } from '../services/api';

const { Title, Text } = Typography;

const notificationTypes = [
  { value: 'GENERAL', label: 'General' },
  { value: 'APPOINTMENT', label: 'Appointment' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'SERVICE', label: 'Service' },
];

export default function NotificationsPage() {
  const [form] = Form.useForm();
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: adminApi.sendBroadcast,
    onSuccess: (data) => {
      setResult(data);
      message.success(`Notification sent to ${data.sent} users`);
      form.resetFields();
    },
    onError: () => message.error('Failed to send notification'),
  });

  const handleSubmit = (values: { title: string; body: string; type: string }) => {
    broadcastMutation.mutate(values);
  };

  return (
    <div>
      <Title level={3}>Send Notification</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Send push notifications to all active users
      </Text>

      <Card style={{ maxWidth: 600 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Notification title" />
          </Form.Item>

          <Form.Item
            name="body"
            label="Message"
            rules={[{ required: true, message: 'Please enter a message' }]}
          >
            <Input.TextArea rows={4} placeholder="Notification message" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            initialValue="GENERAL"
            rules={[{ required: true }]}
          >
            <Select>
              {notificationTypes.map((type) => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={broadcastMutation.isPending}
            >
              Send to All Users
            </Button>
          </Form.Item>
        </Form>

        {result && (
          <Alert
            type="info"
            message="Broadcast Result"
            description={
              <div>
                <div>Successfully sent: {result.sent}</div>
                <div>Failed: {result.failed}</div>
              </div>
            }
            showIcon
            closable
            onClose={() => setResult(null)}
          />
        )}
      </Card>
    </div>
  );
}




