import { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import './App.css';
import { UserOutlined, DollarOutlined, LoginOutlined, LogoutOutlined, MessageOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title } = Typography;

import Register from './components/Register';
import Login from './components/Login';
import Account from './components/Account';
import ContactUs from './components/ContactUs';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [currentView, setCurrentView] = useState('register');

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentUser(userData);
    setCurrentView('account');
  };

  const getMenuItems = () => {
    if (currentUser) {
      return [
        {
          key: '3',
          icon: <DollarOutlined />,
          label: 'Account',
        },
        {
          key: '5',
          icon: <MessageOutlined />,
          label: 'Contact Us',
        },
        {
          key: '4',
          icon: <LogoutOutlined />,
          label: 'Logout',
        },
      ];
    }
    return [
      {
        key: '1',
        icon: <UserOutlined />,
        label: 'Register',
      },
      {
        key: '2',
        icon: <LoginOutlined />,
        label: 'Login',
      },
    ];
  };

  const handleMenuClick = (key) => {
    switch (key) {
      case '1':
        setCurrentView('register');
        break;
      case '2':
        setCurrentView('login');
        break;
      case '3':
        setCurrentView('account');
        break;
      case '4':
        localStorage.removeItem('user');
        setCurrentUser(null);
        setCurrentView('login');
        break;
      case '5':
        setCurrentView('contact');
        break;
    }
  };

  const renderContent = () => {
    if (!currentUser && currentView !== 'register') {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentView) {
      case 'register':
        return <Register onRegisterSuccess={() => handleMenuClick('2')} />;
      case 'account':
        return <Account user={currentUser} />;
      case 'contact':
        return <ContactUs />;
      default:
        return null;
    }
  };

  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Title level={3} className="header-title" style={{ color: 'white', margin: '0 20px 0 0', flexShrink: 0 }}>Bank App</Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[currentView === 'account' ? '3' : currentView === 'register' ? '1' : '2']}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          items={getMenuItems()}
        />
      </Header>
      <Content style={{ 
        padding: '24px', 
        marginTop: '64px',  
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="site-layout-content">
          {renderContent()}
        </div>
      </Content>
    </Layout>
  );
}

export default App;
