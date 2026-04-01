import React from 'react';
import { Layout, Button, Space, Badge, Avatar, Dropdown, Tooltip } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  return (
    <AntHeader className="site-header" style={{ padding: 0, left: collapsed ? 80 : 250 }}>
      <div className="header-left">
        <span className="page-title">StudySmart</span>
      </div>

      <div className="header-right">
        <Space size="middle">
          <Tooltip title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <Button
              type="text"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              icon={theme === 'dark'
                ? <SunOutlined style={{ fontSize: 17 }} />
                : <MoonOutlined style={{ fontSize: 17 }} />
              }
            />
          </Tooltip>

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