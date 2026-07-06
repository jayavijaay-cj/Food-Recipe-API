const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const recipeRoutes = require('./routes/recipeRoutes');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3001', 'http://localhost:3000']
    : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api', recipeRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Recipe Management System API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      recipes: '/api/recipes',
      search: '/api/recipes/search',
      stats: '/api/stats',
      health: '/api/health'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: ['/api', '/api/recipes', '/api/recipes/search', '/api/stats', '/api/health']
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const startServer = async () => {
  try {
    console.log('Checking database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Cannot start server - database connection failed');
      console.log('💡 Make sure PostgreSQL is running and check your .env configuration');
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`Recipe Management API Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
      console.log(`Statistics: http://localhost:${PORT}/api/stats`);
      console.log(`Recipes: http://localhost:${PORT}/api/recipes`);
      console.log(`Search: http://localhost:${PORT}/api/recipes/search`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  console.log('⏹️  SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⏹️  SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;