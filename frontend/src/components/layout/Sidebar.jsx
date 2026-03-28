import React, { useState, useEffect } from 'react';
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
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import profileService from '../../services/profile.service';
import './Sidebar.css';

const { Sider } = Layout;
const { Title, Text } = Typography;

const AVATAR_KEY = 'sidebarAvatarUrl';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const [avatarUrl,   setAvatarUrl]   = useState(
    () => sessionStorage.getItem(AVATAR_KEY) || null
  );

  // ── Load avatar from profile API ────────────────────────────────────────
  const loadAvatar = async () => {
    if (!user) return;
    try {
      const res = await profileService.getProfile();
      if (res?.success && res.data?.personalInfo?.avatarUrl) {
        const raw = res.data.personalInfo.avatarUrl;
        const url = raw.startsWith('http') ? raw : `http://localhost:5000${raw}`;
        setAvatarUrl(url);
        sessionStorage.setItem(AVATAR_KEY, url);  // cache for instant display
      }
    } catch (err) {
      console.warn('Sidebar avatar load failed', err);
    }
  };

  // Load once on mount
  useEffect(() => { loadAvatar(); }, [user]);

  // Re-fetch whenever ProfilePage broadcasts an avatar update
  useEffect(() => {
    const onAvatarUpdate = (e) => {
      if (e.detail?.avatarUrl) {
        setAvatarUrl(e.detail.avatarUrl);
        sessionStorage.setItem(AVATAR_KEY, e.detail.avatarUrl);
      }
    };
    window.addEventListener('avatarUpdated', onAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', onAvatarUpdate);
  }, []);

  // Sync selected menu item with route
  useEffect(() => { setSelectedKey(location.pathname); }, [location.pathname]);

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
    if (e.key === 'logout') { logout(); navigate('/login'); }
    else navigate(e.key);
  };

  const menuItems = [
    { key: '/dashboard',   icon: <DashboardOutlined />, label: 'Dashboard'    },
    { key: '/upload',      icon: <UploadOutlined />,    label: 'Upload Marks' },
    { key: '/analytics',   icon: <BarChartOutlined />,  label: 'Analytics'    },
    { key: '/predictions', icon: <BookOutlined />,      label: 'Predictions'  },
    { key: '/chatbot',     icon: <RobotOutlined />,     label: 'AI Assistant' },
    { key: '/history',     icon: <HistoryOutlined />,   label: 'History'      },
    { type: 'divider' },
    { key: '/profile',     icon: <UserOutlined />,      label: 'Profile'      },
    { key: '/settings',    icon: <SettingOutlined />,   label: 'Settings'     },
    { key: 'logout',       icon: <LogoutOutlined />,    label: 'Logout', danger: true },
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
            <Title level={3} style={{ margin: 0, color: '#2d3e50' }}>StudySmart</Title>
            <Text type="secondary">Performance Predictor</Text>
          </Space>
        ) : (
          <Avatar size={40} icon={<BookOutlined />} style={{ backgroundColor: '#2d3e50' }} />
        )}
      </div>

      {!collapsed && user && (
        <div className="sidebar-user">
          <Avatar
            size={64}
            src={avatarUrl || undefined}
            icon={!avatarUrl ? <UserOutlined /> : null}
            style={{ objectFit: 'cover', flexShrink: 0 }}
          />
          <div className="user-info">
            <Text strong>{user.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{user.role}</Text>
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