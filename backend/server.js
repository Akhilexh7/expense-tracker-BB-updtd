const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 5000;

// Enable detailed logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Middleware
// CORS configuration - allow list comes from env or defaults
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://expense-tracker-bb-updtd-ztd4.vercel.app';
const allowedOrigins = [
  'http://localhost:3000',
  FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.warn('Blocked CORS request from origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'X-User-Id']
}));

// Ensure preflight requests are handled
app.options('*', cors());

// Also explicitly add CORS headers for all responses (helps some proxies/browsers)
app.use((req, res, next) => {
  const allowHeaders = ['Content-Type', 'Authorization', 'x-user-id', 'X-User-Id'];
  res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
  next();
});

// Parse JSON bodies
app.use(express.json());

// Error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ Bad JSON:', err.message);
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next(err);
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budgetbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Test route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'BudgetBuddy API is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test reminder route
app.get('/api/reminders/test', (req, res) => {
  res.json({ message: 'Reminders route is working!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Available routes:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/signup`);
  console.log(`   GET  /api/expenses`);
  console.log(`   GET  /api/budget`);
  console.log(`   GET  /api/reminders`);
  console.log(`   POST /api/reminders`);
});