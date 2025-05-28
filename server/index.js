import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 3000;
// Vulnerability 1 :hardcoded secret key

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_should_be_changed_in_production';

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
// Solution: Restrict the allowed origins to only the trusted domains that need to access your API.
app.use(cors({
  origin: ['http://localhost:5173'], // Replace with actual trusted domains, e.g., your frontend URL
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

    // Vulnerability 4 : SQL injection vulnerability - only on username field
    // Solution: Use parameterized queries (prepared statements) which separate SQL code from user input, preventing injection.
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    
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
    
    if (!validateAmount(amount) || !validateAmountRange(amount)) {
      return res.status(400).json({ message: 'invalid_input' });
    }

    // Fix the vulnerability: Before executing a withdrawal, obtain the user's current balance and check if there is sufficient funds.
    // Avoid directly calculating newBalance. Instead, check first and then update.
    const user = await db.get('SELECT balance FROM users WHERE username = ?', req.user.username);
    
   
    if (!user || typeof user.balance === 'undefined') {
      return res.status(500).json({ message: 'User balance not found' });
    }


    if (user.balance < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    
    await db.run(
      'UPDATE users SET balance = balance - ? WHERE username = ?',
      [withdrawAmount, req.user.username]
    );

  
    const updatedUser = await db.get('SELECT balance FROM users WHERE username = ?', req.user.username);
    res.json({ balance: updatedUser.balance.toFixed(2) });
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


