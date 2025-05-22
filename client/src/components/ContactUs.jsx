import { Form, Input, Button, Typography } from 'antd';
import { useState } from 'react';

const { Title } = Typography;
const { TextArea } = Input;

const ContactUs = () => {
  const [submittedMessage, setSubmittedMessage] = useState('');

  const onFinish = (values) => {
    // Intentionally create XSS vulnerability: render user input without filtering
    setSubmittedMessage(`
      <div class="feedback-message">
        <h3>Your feedback has been received:</h3>
        <p>${values.message}</p>
      </div>
    `);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Title level={2}>Contact Us</Title>
      
      <Form
        name="contact"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="message"
          label="Your Feedback"
          rules={[{ required: true, message: 'Please enter your feedback' }]}
        >
          <TextArea rows={4} placeholder="Please enter your feedback..." />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit Feedback
          </Button>
        </Form.Item>
      </Form>

      {/* Unsafe rendering method, vulnerable to XSS attacks */}
      <div dangerouslySetInnerHTML={{ __html: submittedMessage }} />
    </div>
  );
};

export default ContactUs;