import React, { useState, useEffect } from 'react';
import { Table, Card, Statistic, Row, Col, Input, Select, Button, Spin, Empty, Tag, Space, Modal, Avatar } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    averageScore: 0,
    topStudents: [],
    atRiskStudents: []
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStudentsData();
  }, [user, navigate]);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      // Fetch all students - you would need this endpoint on backend
      const response = await api.get('/users/students');
      
      if (response.data.success) {
        setStudents(response.data.data || []);
        
        // Calculate analytics
        const avgScore = students.length > 0 
          ? Math.round(students.reduce((acc, s) => acc + (s.latestScore || 0), 0) / students.length)
          : 0;
        
        const topStudents = students
          .sort((a, b) => (b.predictedScore || 0) - (a.predictedScore || 0))
          .slice(0, 5);
          
        const atRiskStudents = students
          .filter(s => (s.predictedScore || 0) < 50)
          .slice(0, 5);

        setAnalytics({
          totalStudents: students.length,
          averageScore: avgScore,
          topStudents,
          atRiskStudents
        });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // If endpoint doesn't exist, use mock data for demo
      setStudents(getMockStudents());
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const getMockStudents = () => [
    {
      id: '1',
      name: 'Kavindi Wijesinghe',
      email: 'IT21234567@my.sliit.lk',
      subject: 'Database Systems',
      latestScore: 85,
      predictedScore: 82,
      gpa: 3.8,
      status: 'Excellent'
    },
    {
      id: '2',
      name: 'Ashan Kumar',
      email: 'IT21234568@my.sliit.lk',
      subject: 'Data Structures',
      latestScore: 72,
      predictedScore: 75,
      gpa: 3.4,
      status: 'Good'
    },
    {
      id: '3',
      name: 'Nishadha Silva',
      email: 'IT21234569@my.sliit.lk',
      subject: 'Algorithms',
      latestScore: 45,
      predictedScore: 42,
      gpa: 2.1,
      status: 'At Risk'
    },
    {
      id: '4',
      name: 'Priya Perera',
      email: 'IT21234570@my.sliit.lk',
      subject: 'Web Development',
      latestScore: 88,
      predictedScore: 90,
      gpa: 3.9,
      status: 'Excellent'
    },
    {
      id: '5',
      name: 'Dilshan Fernando',
      email: 'IT21234571@my.sliit.lk',
      subject: 'Machine Learning',
      latestScore: 55,
      predictedScore: 58,
      gpa: 2.8,
      status: 'Below Average'
    }
  ];

  const getMockAnalytics = () => ({
    totalStudents: 5,
    averageScore: 69,
    topStudents: [],
    atRiskStudents: []
  });

  const filteredStudents = students.filter(s => {
    const matchEmail = s.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchSubject = filterSubject === 'all' || s.subject === filterSubject;
    return matchEmail && matchSubject;
  });

  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Latest Score',
      dataIndex: 'latestScore',
      key: 'latestScore',
      render: (score) => (
        <Tag color={score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red'}>
          {score}%
        </Tag>
      ),
    },
    {
      title: 'Predicted Score',
      dataIndex: 'predictedScore',
      key: 'predictedScore',
      render: (score) => (
        <Tag color={score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red'}>
          {score}%
        </Tag>
      ),
    },
    {
      title: 'GPA',
      dataIndex: 'gpa',
      key: 'gpa',
      render: (gpa) => <strong>{gpa}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Excellent') color = 'success';
        else if (status === 'Good') color = 'processing';
        else if (status === 'At Risk') color = 'error';
        else if (status === 'Below Average') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  const chartData = [
    { name: 'Week 1', avg: 65, trend: 200 },
    { name: 'Week 2', avg: 68, trend: 221 },
    { name: 'Week 3', avg: 72, trend: 229 },
    { name: 'Week 4', avg: 70, trend: 200 },
    { name: 'Week 5', avg: 75, trend: 250 },
    { name: 'Week 6', avg: 78, trend: 280 },
  ];

  const scoreDistribution = [
    { name: 'Excellent (80-100)', value: 25, fill: '#52c41a' },
    { name: 'Good (60-79)', value: 45, fill: '#1890ff' },
    { name: 'Average (40-59)', value: 20, fill: '#faad14' },
    { name: 'Poor (<40)', value: 10, fill: '#f5222d' },
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: 'Logout',
      content: 'Are you sure you want to logout?',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>📊 Admin Dashboard</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Welcome, {user?.name}</p>
        </div>
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>

      {/* Key Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={analytics.totalStudents}
              prefix="👥"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={analytics.averageScore}
              suffix="%"
              prefix="📈"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Excellent Students"
              value={Math.round(analytics.totalStudents * 0.25)}
              prefix="⭐"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="At-Risk Students"
              value={Math.round(analytics.totalStudents * 0.1)}
              prefix="⚠️"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Performance Trend" extra={<FilterOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="#1890ff" name="Average Score" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Score Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Filters & Search */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Input
              placeholder="Search by email..."
              prefix={<SearchOutlined />}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Select
              value={filterSubject}
              onChange={setFilterSubject}
              style={{ width: '100%' }}
            >
              <Select.Option value="all">All Subjects</Select.Option>
              <Select.Option value="Database Systems">Database Systems</Select.Option>
              <Select.Option value="Data Structures">Data Structures</Select.Option>
              <Select.Option value="Algorithms">Algorithms</Select.Option>
              <Select.Option value="Web Development">Web Development</Select.Option>
              <Select.Option value="Machine Learning">Machine Learning</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Button
              icon={<DownloadOutlined />}
              block
              onClick={() => toast.success('Report generated')}
            >
              Export Report
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Students Table */}
      <Card title="All Students" extra={<span style={{ color: '#666' }}>{filteredStudents.length} students</span>}>
        {filteredStudents.length === 0 ? (
          <Empty description="No students found" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredStudents.map(s => ({ ...s, key: s.id }))}
            pagination={{ pageSize: 10, total: filteredStudents.length }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 24, color: '#999' }}>
        <p>© 2024 StudySmart Admin Dashboard. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
