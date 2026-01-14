// Load environment variables FIRST
require('dotenv').config();

// Import packages
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const issueRoutes = require('./routes/issueRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// ============ MIDDLEWARE ============

// Enable CORS for frontend (CRITICAL!)
app.use(cors({
  origin: ['https://civicsnapp.netlify.app/', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============ ROUTES ============

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Civic Issue Mapper API',
    version: '1.0.0',
    status: 'Server is running',
    endpoints: {
      issues: '/api/issues',
      upload: '/api/upload/image',
      stats: '/api/issues/stats',
      documentation: 'See README.md'
    },
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);  
app.use('/api/issues', issueRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/`);
  console.log(`🌐 CORS enabled for: https://civicsnapp.netlify.app/`);
});