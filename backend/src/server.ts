import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDatabaseConnection, getDatabaseInfo } from './utils/database';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app: Application = express();

// Get port from environment or use default 3000
const PORT = process.env.PORT || 3000;

// Middleware: Enable CORS for frontend communication
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Middleware: Parse JSON request bodies
app.use(express.json());

// Middleware: Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Test endpoint - Simple health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Detective AI Backend is running! 🕵️',
    timestamp: new Date().toISOString(),
  });
});

// Database test endpoint
app.get('/api/database/test', async (_req: Request, res: Response) => {
  try {
    const isConnected = await testDatabaseConnection();
    const dbInfo = getDatabaseInfo();
    
    res.status(200).json({
      status: isConnected ? 'connected' : 'disconnected',
      database: {
        url: dbInfo.url,
        connected: dbInfo.connected,
      },
      message: isConnected 
        ? 'Database connection successful! ✅' 
        : 'Database connection failed! ❌',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to test database connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler - Endpoint not found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint not found: ${req.method} ${req.path}`,
  });
});

// Start server and listen on specified port
app.listen(PORT, async () => {
  console.info(`🚀 Detective AI Backend server is running on port ${PORT}`);
  console.info(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  const dbInfo = getDatabaseInfo();
  console.info(`🗄️  Database: ${dbInfo.url}`);
  await testDatabaseConnection();
});

// Export app for testing purposes
export default app;
