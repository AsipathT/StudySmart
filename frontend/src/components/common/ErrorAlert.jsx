import React from 'react';
import { Alert } from 'antd';

const ErrorAlert = ({ message, description = '', closable = true, onClose = null, style = {} }) => {
  if (!message) return null;

  return (
    <Alert
      message={message}
      description={description}
      type="error"
      showIcon
      closable={closable}
      onClose={onClose}
      style={{ marginBottom: '16px', ...style }}
    />
  );
};

export default ErrorAlert;
