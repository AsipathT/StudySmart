import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Progress, Space, Spin } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import analyticsService from '../services/analytics.service';
import PerformanceChart from '../components/analytics/PerformanceChart';
import SubjectCard from '../components/analytics/SubjectCard';
import StatsCard from '../components/analytics/StatsCard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);
  const loadDashboard = async () => {
    try {
      const studentId = user?.studentId || user?.id; // Fallback to id if studentId not linked
      const result = await analyticsService.getStudentDashboard(studentId);
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  }

  return (
    <div className="dashboard">
      <Row gutter={[24, 24]}>
        {/* Welcome Section */}
        <Col span={24}>
          <Card>
            <h2>Welcome back, {user?.name}!</h2>
            <p>Here's your performance overview</p>
          </Card>
        </Col>

        {/* Stats Cards */}
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Overall Average"
            value={dashboardData?.overall?.statistics?.average || 0}
            suffix="%"
            icon={<RiseOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Assessments"
            value={dashboardData?.overall?.statistics?.count || 0}
            icon={<BookOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Best Score"
            value={dashboardData?.overall?.statistics?.max || 0}
            suffix="%"
            icon={<RiseOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Study Hours"
            value={24}
            icon={<ClockCircleOutlined />}
            color="#722ed1"
          />
        </Col>

        {/* Performance Chart */}
        <Col xs={24} lg={16}>
          <Card title="Performance Trend">
            <PerformanceChart data={dashboardData?.recentActivity} />
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={8}>
          <Card title="Recent Activity">
            <List
              dataSource={dashboardData?.recentActivity?.slice(0, 5) || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} />}
                    title={item.subject}
                    description={`${item.type} - ${new Date(item.date).toLocaleDateString()}`}
                  />
                  <div>
                    <Progress
                      type="circle"
                      percent={item.score}
                      width={40}
                      format={(percent) => `${percent}%`}
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Subject Performance */}
        <Col span={24}>
          <Card title="Subject Performance">
            <Row gutter={[16, 16]}>
              {dashboardData?.subjects?.map((subject, index) => (
                <Col xs={24} sm={12} lg={8} key={index}>
                  <SubjectCard subject={subject} />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
