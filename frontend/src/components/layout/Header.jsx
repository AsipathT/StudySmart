import React from 'react';
import { Layout, Button, Space, Badge, Avatar, Dropdown, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSessionTheme } from '../../context/SessionThemeContext';
import './Header.css';

const { Header: AntHeader } = Layout;

const SESSION_TRACKER_ROUTES = [
  '/study-tracker',
  '/quizzes',
  '/tracking-summary',
  '/material-mastery',
  '/create-students',
];

const isResourceLibraryShellPath = (pathname) =>
  pathname === '/resource-library' || pathname.startsWith('/resource-library/');

const Header = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useSessionTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isSessionRoute = SESSION_TRACKER_ROUTES.includes(location.pathname);
  const hideProfileSettings = isResourceLibraryShellPath(location.pathname);

  const userMenuItems = hideProfileSettings
    ? [{ key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout }]
    : [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Profile',
          onClick: () => navigate('/profile'),
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'Settings',
          onClick: () => navigate('/settings'),
        },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
      ];

  return (
    <AntHeader className="site-header" style={{ padding: 0, marginLeft: collapsed ? 80 : 250 }}>
      <div className="header-left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="collapse-btn"
        />
        <span className="page-title">StudySmart</span>
      </div>

      <div className="header-right">
        <Space size="middle">

          {isSessionRoute && (
            <Tooltip title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
              <Button
                type="text"
                onClick={toggleTheme}
                className="theme-toggle-btn"
                icon={
                  isDark
                    ? <BulbFilled style={{ color: '#facc15', fontSize: 18 }} />
                    : <BulbOutlined style={{ fontSize: 18 }} />
                }
              />
            </Tooltip>
          )}

          <Badge count={5} dot>
            <Button type="text" icon={<BellOutlined />} className="notification-btn" />
          </Badge>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="user-dropdown">
              <Avatar icon={<UserOutlined />} />
              <span className="user-name">{user?.name || 'User'}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};

export default Header;
