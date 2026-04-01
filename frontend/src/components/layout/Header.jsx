import React from 'react';
import { Layout, Button, Space, Badge, Avatar, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();

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