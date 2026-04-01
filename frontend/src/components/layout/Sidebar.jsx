import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  UploadOutlined,
  BarChartOutlined,
  RobotOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BookOutlined,
  HistoryOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const { Sider } = Layout;
const { Title, Text } = Typography;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedKey, setSelectedKey] = useState(location.pathname);

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
    if (e.key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: '/upload',
            icon: <UploadOutlined />,
            label: <Link to="/upload">Upload Marks</Link>,
          },
          {
            key: '/analytics',
            icon: <BarChartOutlined />,
            label: <Link to="/analytics">Analytics</Link>,
          },
        ]
      : []),
    {
      key: '/predictions',
      icon: <BookOutlined />,
      label: <Link to="/predictions">Predictions</Link>,
    },
    {
      key: '/chatbot',
      icon: <RobotOutlined />,
      label: <Link to="/chatbot">AI Assistant</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">History</Link>,
    },
    {
      key: 'session-tracker-parent',
      icon: <BookOutlined />,
      label: 'Session Tracker',
      children: [
        {
          key: '/study-tracker',
          label: <Link to="/study-tracker">Sessions</Link>,
        },
        ...(user?.role !== 'admin'
          ? [
              {
                key: '/quizzes',
                label: <Link to="/quizzes">Quizzes</Link>,
              },
              {
                key: '/tracking-summary',
                label: <Link to="/tracking-summary">Tracking Summary</Link>,
              },
              {
                key: '/material-mastery',
                icon: <RiseOutlined />,
                label: <Link to="/material-mastery">Material Mastery</Link>,
              },
            ]
          : []),
        ...(user?.role === 'admin'
          ? [
              {
                key: '/create-students',
                label: <Link to="/create-students">Create Students</Link>,
              },
            ]
          : []),
      ],
    },
    {
      type: 'divider',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Profile</Link>,
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: '/settings',
            icon: <SettingOutlined />,
            label: <Link to="/settings">Settings</Link>,
          },
        ]
      : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="sidebar"
      width={250}
      theme="light"
    >
      <div className="sidebar-logo">
        {!collapsed ? (
          <Space direction="vertical" size={2} style={{ width: '100%', textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#2d3e50' }}>
              StudySmart
            </Title>
            <Text type="secondary">Session Tracker</Text>
          </Space>
        ) : (
          <Avatar size={40} icon={<BookOutlined />} style={{ backgroundColor: '#2d3e50' }} />
        )}
      </div>

      {!collapsed && user && (
        <div className="sidebar-user">
          <Avatar size={64} icon={<UserOutlined />} />
          <div className="user-info">
            <Text strong>{user.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user.role}
            </Text>
          </div>
        </div>
      )}

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleMenuClick}
        items={menuItems}
        className="sidebar-menu"
      />
    </Sider>
  );
};

export default Sidebar;