import React, { useState } from 'react';
import {
  Card,
  Select,
  Button,
  Row,
  Col,
  Spin,
  Alert,
  Space,
  Typography,
  Statistic
} from 'antd';
import {
  DashboardOutlined,
  ReloadOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import PredictedScoreCard from '../components/prediction/PredictedScoreCard';
import RecommendationBox from '../components/prediction/RecommendationBox';
import predictionAPI from '../services/prediction.service';

const { Title, Text } = Typography;
const { Option } = Select;

const PerformancePredictor = () => {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('Database Systems');
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const subjects = [
    'Database Systems',
    'Data Structures',
    'Algorithms',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Machine Learning',
    'Web Development'
  ];

  const handleGeneratePrediction = async () => {
    if (!subject) {
      setError('Please select a subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await predictionAPI.generatePrediction(subject);
      
      if (result.success) {
        setPrediction(result.data);
        
        // Fetch updated history
        const historyResult = await predictionAPI.getPredictionHistory();
        if (historyResult.success) {
          setHistory(historyResult.data);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    try {
      const result = await predictionAPI.getPredictionHistory();
      if (result.success) {
        setHistory(result.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load history');
    }
  };

  // Mock data for initial display
  const mockPrediction = {
    predictedScore: 68,
    confidence: 'Medium',
    recommendedHours: 5,
    message: 'Study 5 more hours to reach 75%',
    insights: {
      quizBaseScore: 60,
      studyHoursContribution: 8,
      targetScore: 75,
      dataPointsUsed: 7
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <DashboardOutlined style={{ fontSize: '20px' }} />
            <span>Performance Predictor</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Button 
            key="history" 
            icon={<HistoryOutlined />}
            onClick={handleLoadHistory}
          >
            View History
          </Button>
        }
      >
        <Text>AI-powered performance prediction based on your study patterns</Text>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Left Column - Controls */}
        <Col xs={24} lg={8}>
          <Card title="Generate Prediction" style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong>Select Subject</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={subject}
                  onChange={setSubject}
                  placeholder="Choose a subject"
                >
                  {subjects.map(sub => (
                    <Option key={sub} value={sub}>
                      {sub}
                    </Option>
                  ))}
                </Select>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleGeneratePrediction}
                loading={loading}
                block
              >
                Generate Prediction
              </Button>

              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(null)}
                />
              )}

              {/* Stats */}
              <Card size="small" title="Quick Stats">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Total Predictions"
                      value={history.length || 0}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Avg. Confidence"
                      value={history.length > 0 
                        ? Math.round(history.filter(h => h.confidence === 'High').length / history.length * 100) 
                        : 0
                      }
                      suffix="%"
                    />
                  </Col>
                </Row>
              </Card>
            </Space>
          </Card>

          <RecommendationBox />
        </Col>

        {/* Right Column - Results */}
        <Col xs={24} lg={16}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Analyzing your study patterns...</Text>
              </div>
            </div>
          ) : prediction ? (
            <>
              <PredictedScoreCard prediction={prediction} />
              
              {/* Prediction History */}
              {history.length > 0 && (
                <Card title="Prediction History" style={{ marginTop: 24 }}>
                  <Row gutter={[16, 16]}>
                    {history.slice(0, 3).map((item) => (
                      <Col xs={24} sm={12} md={8} key={item._id}>
                        <Card size="small">
                          <Text strong>{item.subject}</Text>
                          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                            {item.predictedScore}%
                          </div>
                          <Text type="secondary">
                            {item.confidence} confidence
                          </Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </>
          ) : (
            /* Demo Mode - Show mock data */
            <>
              <Alert
                message="Demo Mode"
                description="Click 'Generate Prediction' to get real predictions. Showing sample data below."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              <PredictedScoreCard prediction={mockPrediction} />
            </>
          )}
        </Col>
      </Row>

      {/* How It Works Section */}
      <Card title="How It Works" style={{ marginTop: 24 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={8}>
            <Card size="small">
              <Title level={4}>1. Data Collection</Title>
              <Text>
                System collects your study hours and quiz scores automatically
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Title level={4}>2. Pattern Analysis</Title>
              <Text>
                Analyzes your learning patterns and performance trends
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Title level={4}>3. Smart Prediction</Title>
              <Text>
                Predicts future performance and provides personalized recommendations
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PerformancePredictor;
