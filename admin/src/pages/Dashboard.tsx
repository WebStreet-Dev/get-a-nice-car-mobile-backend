import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Typography } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CarOutlined,
  BankOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
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

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: adminApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const { stats, recentAppointments } = data || { stats: null, recentAppointments: [] };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'user',
      render: (user: Appointment['user']) => user?.name || 'N/A',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: Appointment['department']) => dept?.name || 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Appointments"
              value={stats?.totalAppointments || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Appointments"
              value={stats?.pendingAppointments || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active Breakdowns"
              value={stats?.activeBreakdowns || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Departments"
              value={stats?.totalDepartments || 0}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="FAQs"
              value={stats?.totalFaqs || 0}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Appointments">
        <Table
          columns={columns}
          dataSource={recentAppointments}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}



