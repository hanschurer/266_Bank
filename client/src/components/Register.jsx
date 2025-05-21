import { Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [loading, setLoading] = useState(false);

  const validateAmount = (_, value) => {
    if (!value) return Promise.reject('Initial balance is required');
    
    const amountRegex = /^(0|[1-9][0-9]*)\.([0-9]{2})$/;
    if (!amountRegex.test(value)) {
      return Promise.reject('Amount must be in format: X.XX (e.g., 10.00)');
    }
    
    const [whole, fraction] = value.split('.');
    const amount = parseFloat(`${whole}.${fraction}`);
    if (amount < 0 || amount > 4294967295.99) {
      return Promise.reject('Amount must be between 0.00 and 4294967295.99');
    }
    
    return Promise.resolve();
  };

  const validateCredentials = (_, value) => {
    if (!value) return Promise.reject('This field is required');
    
    const credentialRegex = /^[_\-\.0-9a-z]{1,127}$/;
    if (!credentialRegex.test(value)) {
      return Promise.reject('Only underscores, hyphens, dots, digits, and lowercase letters are allowed (1-127 characters)');
    }
    
    return Promise.resolve();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/register', values);
      message.success('Registration successful!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="register"
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

      <Form.Item
        label="Initial Balance"
        name="balance"
        rules={[{ validator: validateAmount }]}
      >
        <Input placeholder="0.00" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Register;