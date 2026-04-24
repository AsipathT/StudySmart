import React from 'react';
import { Spin, Row, Col } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = ({ size = 'large', tip = 'Loading...' }) => {
  return (
    <Row justify="center" align="middle" style={{ minHeight: '200px' }}>
      <Col>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
          size={size}
          tip={tip}
        />
      </Col>
    </Row>
  );
};

export default LoadingSpinner;
