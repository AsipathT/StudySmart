import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Space, Empty,
  Spin, Alert, Button, Divider, Progress, Typography,
  List, Avatar, Tooltip, Modal, Descriptions
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ReloadOutlined, DownloadOutlined,
  FileExcelOutlined, SortAscendingOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import uploadService from '../../services/upload.service';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

const UserAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await uploadService.getUserMarks();
      if (response.success) {
        setAnalytics(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err.message || 'Error fetching analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const g = String(grade || '').toUpperCase();
    if (g.startsWith('A')) return '#52c41a';
    if (g.startsWith('B')) return '#1890ff';
    if (g.startsWith('C')) return '#faad14';
    if (g.startsWith('D')) return '#ff7a45';
    return '#ff4d4f';
  };

  const getGradeBgColor = (grade) => {
    const g = String(grade || '').toUpperCase();
    if (g.startsWith('A')) return '#f6ffed';
    if (g.startsWith('B')) return '#e6f7ff';
    if (g.startsWith('C')) return '#fffbe6';
    if (g.startsWith('D')) return '#fff7e6';
    return '#fff1f0';
  };

  const downloadAsExcel = () => {
    if (!analytics) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Analytics Summary'],
      [''],
      ['Overall Average', analytics.averageMarks + '%'],
      ['GPA', analytics.gpa + '/4.0'],
      ['Total Marks', analytics.totalMarks],
      ['Total Subjects', analytics.subjects?.length || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Subjects sheet
    if (analytics.subjects && analytics.subjects.length > 0) {
      const subjectData = [
        ['Subject', 'Average', 'Grade', 'Count', 'Min', 'Max']
      ];
      analytics.subjects.forEach(s => {
        subjectData.push([s.subject, s.average + '%', s.grade, s.count, s.min, s.max]);
      });
      const wsSubjects = XLSX.utils.aoa_to_sheet(subjectData);
      XLSX.utils.book_append_sheet(wb, wsSubjects, 'Subjects');
    }

    // Marks sheet
    if (analytics.marks && analytics.marks.length > 0) {
      const marksData = [
        ['Date', 'Subject', 'Score', 'Type']
      ];
      analytics.marks.forEach(m => {
        marksData.push([
          new Date(m.date).toLocaleDateString(),
          m.subject,
          m.score + '%',
          m.type
        ]);
      });
      const wsMarks = XLSX.utils.aoa_to_sheet(marksData);
      XLSX.utils.book_append_sheet(wb, wsMarks, 'Marks');
    }

    const filename = `analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          type="error"
          message="Error Loading Analytics"
          description={error}
          showIcon
        />
        <Button onClick={fetchAnalytics} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <Empty
          description="No analytics data available"
          style={{ marginTop: 48, marginBottom: 48 }}
        >
          <Button type="primary" href="/upload">Upload Marks First</Button>
        </Empty>
      </Card>
    );
  }

  // Prepare data for charts
  const subjectChartData = analytics.subjects?.map(s => ({
    name: s.subject.substring(0, 15),
    value: s.average,
    grade: s.grade
  })) || [];

  const gpaColor = analytics.gpa >= 3.5 ? '#52c41a' : analytics.gpa >= 3.0 ? '#1890ff' : analytics.gpa >= 2.5 ? '#faad14' : '#ff4d4f';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2}>📊 Your Analytics Dashboard</Title>
        <Text type="secondary">
          Complete overview of your academic performance based on uploaded marks
        </Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="GPA"
              value={analytics.gpa}
              suffix="/4.0"
              valueStyle={{ color: gpaColor, fontSize: '32px' }}
              prefix={analytics.gpa >= 3.0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderRadius: '16px', transition: 'all 250ms ease' }}>
            <Statistic
              title="Average Score"
              value={analytics.averageMarks}
              suffix="%"
              valueStyle={{
                color: analytics.averageMarks >= 75 ? '#16a34a' : analytics.averageMarks >= 60 ? '#f59e0b' : '#dc2626',
                fontSize: '32px',
                fontWeight: 700
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderRadius: '16px', transition: 'all 250ms ease' }}>
            <Statistic
              title="Total Marks"
              value={analytics.totalMarks}
              valueStyle={{ fontSize: '32px', color: '#2563eb', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderRadius: '16px', transition: 'all 250ms ease' }}>
            <Statistic
              title="Subjects"
              value={analytics.subjects?.length || 0}
              valueStyle={{ fontSize: '32px', color: '#f59e0b', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Subjects Table */}
      <Card style={{ marginBottom: 30 }}>
        <Title level={3}>📚 Subject Performance</Title>
        {analytics.subjects && analytics.subjects.length > 0 ? (
          <Table
            dataSource={analytics.subjects.map((s, i) => ({ ...s, key: i }))}
            columns={[
              {
                title: 'Subject',
                dataIndex: 'subject',
                key: 'subject',
                render: (text) => <Text strong>{text}</Text>,
                width: '40%'
              },
              {
                title: 'Average',
                dataIndex: 'average',
                key: 'average',
                render: (avg) => (
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>{avg}%</Text>
                    <Progress
                      percent={avg}
                      size="small"
                      status={avg >= 75 ? 'success' : avg >= 60 ? 'normal' : 'exception'}
                    />
                  </div>
                ),
                width: '25%'
              },
              {
                title: 'Grade',
                dataIndex: 'grade',
                key: 'grade',
                render: (grade) => (
                  <Tag
                    color={getGradeColor(grade)}
                    style={{
                      backgroundColor: getGradeBgColor(grade),
                      color: getGradeColor(grade),
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 8px'
                    }}
                  >
                    {grade}
                  </Tag>
                ),
                width: '10%'
              },
              {
                title: 'Count',
                dataIndex: 'count',
                key: 'count',
                render: (count) => count,
                width: '10%'
              },
              {
                title: 'Range',
                key: 'range',
                render: (_, record) => `${record.min} - ${record.max}`,
                width: '15%'
              }
            ]}
            pagination={false}
            size="middle"
            bordered
          />
        ) : (
          <Empty description="No subject data" />
        )}
      </Card>

      {/* Chart */}
      {subjectChartData.length > 0 && (
        <Card style={{ marginBottom: 30 }}>
          <Title level={3}>📈 Subject Scores Overview</Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#1890ff" name="Score %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Marks */}
      <Card style={{ marginBottom: 30 }}>
        <Title level={3}>📝 Recent Marks</Title>
        {analytics.marks && analytics.marks.length > 0 ? (
          <List
            dataSource={analytics.marks.slice(0, 10)}
            renderItem={(mark) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{
                        backgroundColor: mark.score >= 75 ? '#52c41a' : mark.score >= 60 ? '#faad14' : '#ff4d4f'
                      }}
                    >
                      {Math.round(mark.score / 10) * 10}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <Text strong>{mark.subject}</Text>
                      <Tag color={mark.score >= 75 ? 'green' : mark.score >= 60 ? 'orange' : 'red'}>
                        {mark.score}%
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">{mark.type}</Text>
                      <Text type="secondary">
                        {new Date(mark.date).toLocaleDateString()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No marks data" />
        )}
      </Card>

      {/* Action Buttons */}
      <Space style={{ marginTop: 20 }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchAnalytics}
        >
          Refresh
        </Button>
        <Button
          icon={<FileExcelOutlined />}
          onClick={downloadAsExcel}
        >
          Export to Excel
        </Button>
        <Button
          type="dashed"
          href="/upload"
        >
          Upload More Marks
        </Button>
      </Space>
    </div>
  );
};

export default UserAnalyticsDashboard;
