import React from 'react';
import { Typography } from 'antd';
import StudySessionForm from '../components/study/StudySessionForm';

const { Title } = Typography;

const SessionTrackerPage = () => {
  return (
    <div>
      <Title level={2}>Session Tracker</Title>
      <StudySessionForm />
    </div>
  );
};

export default SessionTrackerPage;
