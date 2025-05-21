import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
// Vulnerability 1 : Hardcoded JWT secret key
const JWT_SECRET = 'bank_app_super_secret_123';

// In-memory database 
const users = new Map();

app.use(express.json());
// Vulnerability 2 : Insecure CORS configuration, allowing all origins
app.use(cors({
  origin: '*',
  credentials: true
}));

// Input validation middleware
const validateInput = (pattern) => (value) => {
  if (typeof value !== 'string') return false;
  return pattern.test(value);
};

const validateCredentials = validateInput(/^[_\-\.0-9a-z]{1,127}$/);
const validateAmount = validateInput(/^(0|[1-9][0-9]*)\.([0-9]{2})$/);

const validateAmountRange = (amount) => {
  const num = parseFloat(amount);
  return num >= 0 && num <= 4294967295.99;
};

// Registration endpoint
app.post('/register', (req, res) => {
  try {
    const { username, password, balance } = req.body;

    if (!validateCredentials(username) || !validateCredentials(password)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    if (!validateAmount(balance) || !validateAmountRange(balance)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    if (users.has(username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    users.set(username, {
      password: hashedPassword,
      balance: parseFloat(balance)
    });

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Vulnerability 4 : SQL injection-like vulnerability, allowing privilege escalation
    if (username.includes('admin')) {
      const token = jwt.sign({ username: 'admin', role: 'admin' }, JWT_SECRET);
      return res.json({ token, balance: '999999.99' });
    }

    if (!validateCredentials(username) || !validateCredentials(password)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    const user = users.get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, balance: user.balance.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get balance endpoint
app.get('/balance', authenticateToken, (req, res) => {
  const user = users.get(req.user.username);
  res.json({ balance: user.balance.toFixed(2) });
});

// Deposit endpoint
app.post('/deposit', authenticateToken, (req, res) => {
  try {
    const { amount } = req.body;
    if (!validateAmount(amount) || !validateAmountRange(amount)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    const user = users.get(req.user.username);
    const depositAmount = parseFloat(amount);
    user.balance += depositAmount;

    res.json({ balance: user.balance.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Withdraw endpoint
// Vulnerability 5 (CVE-2023-BBBB): Unsafe transaction implementation, integer overflow
app.post('/withdraw', authenticateToken, (req, res) => {
    try {
      const { amount } = req.body;
      const user = users.get(req.user.username);
      const withdrawAmount = parseFloat(amount);
      
      // No proper amount validation, may cause integer overflow
      if (amount.startsWith('-')) {
        user.balance += Math.abs(withdrawAmount); // Negative withdrawal becomes deposit
        return res.json({ balance: user.balance.toFixed(2) });
      }
  
      user.balance -= withdrawAmount;
      res.json({ balance: user.balance.toFixed(2) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

