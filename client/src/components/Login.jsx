import { Form, Input, Button, message, Modal } from 'antd';
import { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateCredentials = (_, value) => {
    if (!value) return Promise.reject('This field is required');
    
    const credentialRegex = /^[_\-\.0-9a-z]{1,127}$/;
    if (!credentialRegex.test(value)) {
      return Promise.reject('Invalid format');
    }
    
    return Promise.resolve();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/login', values);
      message.success('Login successful!');
      onLoginSuccess(response.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Login failed');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form
        name="login"
        onFinish={onFinish}
        layout="vertical"
        style={{ maxWidth: 400, margin: '0 auto' }}
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{ validator: validateCredentials }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ validator: validateCredentials }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="Login Failed"
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
        okText="Ok"
        cancelText="Cancel"
      >
        <p>{errorMessage}</p>
      </Modal>
    </>
  );
};

export default Login;