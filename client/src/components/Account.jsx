import { Form, Input, Button, Card, Space, Typography, message, Modal } from 'antd';
import { useState } from 'react';
import axios from 'axios';

const { Title, Text } = Typography;

const Account = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(user?.balance || '0.00');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', content: '' });

  const validateAmount = (_, value) => {
    if (!value) return Promise.reject('Amount is required');
    
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

  const showMessage = (type, content) => {
    setModalMessage({
      type: type === 'success' ? 'Operation Successful' : 'Operation Failed',
      content: content
    });
    setModalVisible(true);
  };

  const handleTransaction = async (type, values) => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:3000/${type}`, {
        ...values,
        username: user.username
      }, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      setBalance(response.data.balance);
      showMessage('success', `${type} successful!`);
    } catch (error) {
      showMessage('error', error.response?.data?.message || `${type} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <Card>
        <Title level={3}>Account Dashboard</Title>
        <Text strong style={{ fontSize: '1.2em', display: 'block', marginBottom: '24px' }}>
          Current Balance: ${balance}
        </Text>

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card title="Deposit" size="small">
            <Form
              onFinish={(values) => handleTransaction('deposit', values)}
              layout="vertical"
              style={{ width: '100%' }}
            >
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ validator: validateAmount }]}
              >
                <Input placeholder="0.00" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Deposit
              </Button>
            </Form>
          </Card>

          <Card title="Withdraw" size="small">
            <Form
              onFinish={(values) => handleTransaction('withdraw', values)}
              layout="vertical"
              style={{ width: '100%' }}
            >
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ validator: validateAmount }]}
              >
                <Input placeholder="0.00" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Withdraw
              </Button>
            </Form>
          </Card>
        </Space>
      </Card>

      <Modal
        title={modalMessage.type}
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="ok" type={modalMessage.type === 'Operation Successful' ? 'primary' : 'default'} onClick={() => setModalVisible(false)}>
            OK
          </Button>
        ]}
      >
        <p>{modalMessage.content}</p>
      </Modal>
    </div>
  );
};

export default Account;