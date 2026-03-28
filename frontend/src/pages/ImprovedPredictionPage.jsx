// frontend/src/pages/ImprovedPredictionPage.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tabs, Statistic, Empty, Spin } from 'antd';
import { UserOutlined, BookOutlined, ClockCircleOutlined } from '@ant-design/icons';
import StudySessionForm from '../components/study/StudySessionForm';
import QuizScoreForm from '../components/quiz/QuizScoreForm';
import ProfileCompletionForm from '../components/profile/ProfileCompletionForm';
import PredictionResult from '../components/prediction/PredictionResult';

const { TabPane } = Tabs;

const ImprovedPredictionPage = () => {
  const [userData, setUserData] = useState(null);
  const [studySessions, setStudySessions] = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    // Load from API
    setLoading(false);
  };

  const dataCompleteness = {
    profile: userData ? Object.keys(userData).length : 0,
    sessions: studySessions.length,
    scores: quizScores.length,
    total: (userData ? 10 : 0) + studySessions.length + quizScores.length
  };

  return (
    <div className="prediction-page">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <h2>Performance Prediction</h2>
            <p>Complete your profile and add data for accurate predictions</p>
          </Card>
        </Col>

        {/* Data Collection Stats */}
        <Col span={24}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title="Profile Completion" 
                value={dataCompleteness.profile} 
                suffix="/10"
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Study Sessions" 
                value={dataCompleteness.sessions} 
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Quiz Scores" 
                value={dataCompleteness.scores} 
                prefix={<BookOutlined />}
              />
            </Col>
          </Row>
        </Col>

        {/* Data Entry Forms */}
        <Col span={24}>
          <Tabs defaultActiveKey="1" type="card">
            <TabPane tab="Profile" key="1">
              <ProfileCompletionForm user={userData} />
            </TabPane>
            <TabPane tab="Study Sessions" key="2">
              <StudySessionForm />
            </TabPane>
            <TabPane tab="Quiz Scores" key="3">
              <QuizScoreForm />
            </TabPane>
          </Tabs>
        </Col>

        {/* Prediction Results */}
        <Col span={24}>
          {dataCompleteness.total > 5 ? (
            <PredictionResult 
              userData={userData}
              studySessions={studySessions}
              quizScores={quizScores}
            />
          ) : (
            <Empty description="Add more data to see predictions" />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ImprovedPredictionPage;