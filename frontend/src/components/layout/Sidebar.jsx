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
  ThunderboltOutlined,
  UsergroupAddOutlined,
  GroupOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  LineChartOutlined,
  RiseOutlined,
  UserAddOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import profileService from '../../services/profile.service';
import './Sidebar.css';

const { Sider } = Layout;
const { Title, Text } = Typography;

const AVATAR_KEY = 'sidebarAvatarUrl';

// Routes that belong under Performance Predictor
const PREDICTOR_KEYS = ['/upload', '/analytics', '/predictions', '/chatbot', '/history'];

// Routes that belong under Session Tracker
const SESSION_TRACKER_KEYS = [
  '/study-tracker',
  '/quizzes',
  '/tracking-summary',
  '/material-mastery',
  '/create-students',
];

// Routes that belong under Study Buddy Finder
const STUDY_BUDDY_KEYS = [
  '/buddy/dashboard',
  '/buddy/find',
  '/buddy/my-groups',
  '/buddy/joined',
  
  '/buddy/create',
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [selectedKey, setSelectedKey] = useState(location.pathname);
  const [openKeys, setOpenKeys] = useState(() => {
    const keys = [];
    if (PREDICTOR_KEYS.includes(location.pathname)) keys.push('performance-predictor');
    if (SESSION_TRACKER_KEYS.includes(location.pathname)) keys.push('session-tracker');
    if (STUDY_BUDDY_KEYS.includes(location.pathname)) keys.push('study-buddy');
    return keys;
  });

  const [avatarUrl, setAvatarUrl] = useState(
    () => sessionStorage.getItem(AVATAR_KEY) || null
  );

  // Load avatar from profile API
  const loadAvatar = async () => {
    if (!user) return;
    try {
      const res = await profileService.getProfile();
      if (res?.success && res.data?.personalInfo?.avatarUrl) {
        const raw = res.data.personalInfo.avatarUrl;
        const url = raw.startsWith('http') ? raw : `http://localhost:5000${raw}`;
        setAvatarUrl(url);
        sessionStorage.setItem(AVATAR_KEY, url);
      }
    } catch (err) {
      console.warn('Sidebar avatar load failed', err);
    }
  };

  useEffect(() => {
    loadAvatar();
  }, [user]);

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

  // Sync selected key + auto-open parent when route changes
  useEffect(() => {
    setSelectedKey(location.pathname);

    if (!collapsed) {
      const newKeys = [];
      if (PREDICTOR_KEYS.includes(location.pathname)) newKeys.push('performance-predictor');
      if (SESSION_TRACKER_KEYS.includes(location.pathname)) newKeys.push('session-tracker');
      if (STUDY_BUDDY_KEYS.includes(location.pathname)) newKeys.push('study-buddy');

      if (newKeys.length > 0) {
        setOpenKeys(newKeys);
      }
    }
  }, [location.pathname, collapsed]);

  // When collapsing, close all sub-menus
  useEffect(() => {
    if (collapsed) setOpenKeys([]);
  }, [collapsed]);

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);

    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(key);
    }
  };

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },

    ...(user?.role === 'admin'
      ? [
          {
            key: '/admin-dashboard',
            icon: <ThunderboltOutlined />,
            label: 'Admin Dashboard',
          },
        ]
      : []),

    {
      key: 'performance-predictor',
      icon: <BarChartOutlined />,
      label: 'Performance Predictor',
      children: [
        { key: '/upload', icon: <UploadOutlined />, label: 'Upload Marks' },
        { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
        { key: '/predictions', icon: <BookOutlined />, label: 'Predictions' },
        { key: '/chatbot', icon: <RobotOutlined />, label: 'AI Assistant' },
        ...(user?.role === 'admin'
          ? [{ key: '/history', icon: <HistoryOutlined />, label: 'History' }]
          : []),
      ],
    },

    {
      key: 'study-buddy',
      icon: <BookOutlined />,
      label: 'Study Buddy Finder',
      children: [
        { key: '/buddy/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/buddy/find', icon: <SearchOutlined />, label: 'Find Buddies' },
        
        { key: '/buddy/joined', icon: <GroupOutlined />, label: 'Joined Groups' },
        { key: '/buddy/my-groups', icon: <UserOutlined />, label: 'My Groups' },
        { key: '/buddy/create', icon: <PlusCircleOutlined />, label: 'Create Group' },
      ],
    },

    {
      key: 'session-tracker',
      icon: <ClockCircleOutlined />,
      label: 'Session Tracker',
      children: [
        { key: '/study-tracker', icon: <PlayCircleOutlined />, label: 'Sessions' },
        ...(user?.role !== 'admin'
          ? [
              { key: '/quizzes', icon: <TrophyOutlined />, label: 'Quizzes' },
              { key: '/tracking-summary', icon: <LineChartOutlined />, label: 'Tracking Summary' },
              { key: '/material-mastery', icon: <RiseOutlined />, label: 'Material Mastery' },
            ]
          : []),
        ...(user?.role === 'admin'
          ? [{ key: '/create-students', icon: <UserAddOutlined />, label: 'Create Students' }]
          : []),
      ],
    },

    { type: 'divider' },

    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
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
          <Space
            direction="vertical"
            size={2}
            style={{ width: '100%', textAlign: 'center' }}
          >
            <Title level={3} style={{ margin: 0, color: '#2d3e50' }}>
              StudySmart
            </Title>
            <Text type="secondary">Smart Insights & Predictions</Text>
          </Space>
        ) : (
          <Avatar
            size={40}
            icon={<BookOutlined />}
            style={{ backgroundColor: '#2d3e50' }}
          />
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
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user.role}
            </Text>
          </div>
        </div>
      )}

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={handleMenuClick}
        items={menuItems}
        className="sidebar-menu"
      />
    </Sider>
  );
};

export default Sidebar;