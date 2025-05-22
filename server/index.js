import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 3000;
// Vulnerability 1 :hardcoded secret key

const JWT_SECRET = 'bank_app_super_secret_123';

// Create database connection
let db;
(async () => {
  db = await open({
    filename: './bank.db',
    driver: sqlite3.Database
  });
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      balance REAL NOT NULL
    )
  `);
})();

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


app.post('/register', async (req, res) => {
  try {
    const { username, password, balance } = req.body;

    if (!validateCredentials(username) || !validateCredentials(password)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    if (!validateAmount(balance) || !validateAmountRange(balance)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    
    const existingUser = await db.get('SELECT username FROM users WHERE username = ?', username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.run(
      'INSERT INTO users (username, password, balance) VALUES (?, ?, ?)',
      [username, hashedPassword, parseFloat(balance)]
    );

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
    // Vulnerability 3 : privileged user bypassing authentication

    if (username.includes('admin')) {
      const token = jwt.sign({ username: 'admin', role: 'admin' }, JWT_SECRET);
      return res.json({ token, balance: '999999.99' });
    }


    // Vulnerability 4 : SQL injection vulnerability - only on username field
    const query = `SELECT * FROM users WHERE username = '${username}'`;
    const user = await db.get(query);
    console.log(query);
    console.log(user);
    
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

// Balance query endpoint
app.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT balance FROM users WHERE username = ?', req.user.username);
    res.json({ balance: user.balance.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deposit endpoint
app.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!validateAmount(amount) || !validateAmountRange(amount)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    const depositAmount = parseFloat(amount);
    await db.run(
      'UPDATE users SET balance = balance + ? WHERE username = ?',
      [depositAmount, req.user.username]
    );

    const user = await db.get('SELECT balance FROM users WHERE username = ?', req.user.username);
    res.json({ balance: user.balance.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Withdraw endpoint
app.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    // if (!validateAmount(amount) || !validateAmountRange(amount)) {
    //   return res.status(400).json({ message: 'invalid_input' });
    // }

    const withdrawAmount = parseFloat(amount);
    // Vulnerability 5 : Integer overflow vulnerability
    // Keep integer overflow vulnerability
    const user = await db.get('SELECT balance FROM users WHERE username = ?', req.user.username);
    const newBalance = parseFloat(user.balance) - withdrawAmount;
    console.log(newBalance);
    if (newBalance < 0) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    await db.run(
      'UPDATE users SET balance = ? WHERE username = ?',
      [newBalance, req.user.username]
    );

    res.json({ balance: newBalance.toFixed(2) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Vulnerability 6: Information disclosure
app.get('/debug', (req, res) => {
  const debugInfo = {
    dbConfig: {
      path: db.config.filename,
      driver: db.config.driver
    },
    serverConfig: {
      secret: JWT_SECRET,
      port: PORT
    }
  };
  res.json(debugInfo);
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


