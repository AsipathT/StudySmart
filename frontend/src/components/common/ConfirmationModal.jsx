import React from 'react';
import { Modal, Button } from 'antd';

const ConfirmationModal = ({
  visible,
  title = 'Confirm Action',
  message = 'Are you sure?',
  okText = 'Confirm',
  cancelText = 'Cancel',
  onOk,
  onCancel,
  okButtonDanger = false,
  loading = false,
}) => {
  return (
    <Modal
      title={title}
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      confirmLoading={loading}
      okButtonProps={{ danger: okButtonDanger }}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default ConfirmationModal;
