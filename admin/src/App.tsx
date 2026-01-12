import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin, Avatar, Dropdown, theme, Badge, Space } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  QuestionCircleOutlined,
  CarOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

import { authApi, adminApi } from './services/api';
import type { User, AdminNotification } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { showNotificationToast } from './components/NotificationToast';

// Pages
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import UsersPage from './pages/Users';
import EmployeesPage from './pages/Employees';
import AppointmentsPage from './pages/Appointments';
import DepartmentsPage from './pages/Departments';
import FaqsPage from './pages/Faqs';
import BreakdownPage from './pages/Breakdown';
import NotificationsPage from './pages/Notifications';
import AdminAlertsPage from './pages/AdminAlerts';
import RolesPage from './pages/Roles';

const { Header, Sider, Content } = Layout;

// Auth Context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authApi.me();
          if (userData.role !== 'ADMIN' && userData.role !== 'SUPER_ADMIN') {
            throw new Error('Not an admin');
          }
          setUser(userData);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.user.role !== 'ADMIN' && response.user.role !== 'SUPER_ADMIN') {
      throw new Error('Admin access required');
    }
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
    setUser(response.user);
    navigate('/');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main Layout
function MainLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const queryClient = useQueryClient();
  
  // Get access token for WebSocket
  const token = localStorage.getItem('accessToken');
  
  // Fetch unread notification count
  const { data: unreadCount } = useQuery({
    queryKey: ['adminNotificationCount'],
    queryFn: () => adminApi.getAdminNotificationUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle notification actions
  const handleNotificationApprove = async (notif: AdminNotification) => {
    try {
      const data = notif.data as any;
      
      if (notif.type === 'USER_REGISTERED' && data?.userId) {
        await adminApi.approveClient(data.userId);
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        navigate('/clients');
      } else if (notif.type === 'APPOINTMENT' && data?.appointmentId) {
        await adminApi.approveAppointment(data.appointmentId);
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        navigate('/appointments');
      } else if (notif.type === 'BREAKDOWN' && data?.requestId) {
        await adminApi.approveBreakdown(data.requestId);
        queryClient.invalidateQueries({ queryKey: ['breakdown'] });
        navigate('/breakdown');
      }
    } catch (error: any) {
      // Error handled by toast component
      throw error;
    }
  };

  const handleNotificationReject = async (notif: AdminNotification) => {
    try {
      const data = notif.data as any;
      
      if (notif.type === 'USER_REGISTERED' && data?.userId) {
        await adminApi.rejectClient(data.userId, 'Rejected by admin');
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      } else if (notif.type === 'APPOINTMENT' && data?.appointmentId) {
        await adminApi.rejectAppointment(data.appointmentId);
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      } else if (notif.type === 'BREAKDOWN' && data?.requestId) {
        await adminApi.rejectBreakdown(data.requestId);
        queryClient.invalidateQueries({ queryKey: ['breakdown'] });
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleNotificationView = (notif: AdminNotification) => {
    const data = notif.data as any;
    
    if (notif.type === 'USER_REGISTERED' && data?.userId) {
      navigate('/clients');
    } else if (notif.type === 'APPOINTMENT' && data?.appointmentId) {
      navigate('/appointments');
    } else if (notif.type === 'BREAKDOWN' && data?.requestId) {
      navigate('/breakdown');
    } else {
      navigate('/alerts');
    }
  };

  // Connect to WebSocket
  useWebSocket({
    token,
    enabled: !!user && !!token,
    onNotification: (notification: AdminNotification) => {
      // Show toast notification
      showNotificationToast(notification, {
        onApprove: handleNotificationApprove,
        onReject: handleNotificationReject,
        onView: handleNotificationView,
      });
    },
  });

  const menuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { 
      key: '/alerts', 
      icon: <BellOutlined />, 
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Alerts</span>
          {unreadCount && unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </div>
      )
    },
    { key: '/clients', icon: <UserOutlined />, label: 'Clients' },
    { key: '/employees', icon: <UserOutlined />, label: 'Employees' },
    { key: '/appointments', icon: <CalendarOutlined />, label: 'Appointments' },
    { key: '/departments', icon: <BankOutlined />, label: 'Departments' },
    { key: '/faqs', icon: <QuestionCircleOutlined />, label: 'FAQs' },
    { key: '/breakdown', icon: <CarOutlined />, label: 'Breakdown' },
    { key: '/notifications', icon: <BellOutlined />, label: 'Send Notifications' },
    ...(user?.role === 'SUPER_ADMIN' ? [{ key: '/roles', icon: <SafetyOutlined />, label: 'Roles' }] : []),
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: collapsed ? 16 : 20,
        }}>
          {collapsed ? 'NC' : 'Nice Car Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <Layout style={{ flex: 1 }}>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', fontSize: 18 }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Space size="large">
            <Badge count={unreadCount || 0} size="small">
              <BellOutlined 
                style={{ fontSize: 18, cursor: 'pointer' }} 
                onClick={() => navigate('/alerts')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ 
          margin: 24, 
          padding: 24, 
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
          minHeight: 280,
        }}>
          {children}
        </Content>
        <Layout.Footer style={{ 
          textAlign: 'center', 
          background: colorBgContainer,
          borderTop: '1px solid #f0f0f0',
          padding: '16px 24px',
        }}>
          <div style={{ color: '#8c8c8c', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'nowrap' }}>
            © {new Date().getFullYear()} Getanice Car Inc. All rights reserved.
            <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
            Designed and developed by{' '}
            <a 
              href="https://webstreet.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#1890ff', 
                textDecoration: 'none',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              WebStreet
            </a>
          </div>
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/clients" element={<UsersPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/departments" element={<DepartmentsPage />} />
                  <Route path="/faqs" element={<FaqsPage />} />
                  <Route path="/breakdown" element={<BreakdownPage />} />
                  <Route path="/alerts" element={<AdminAlertsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/roles" element={<RolesPage />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;



