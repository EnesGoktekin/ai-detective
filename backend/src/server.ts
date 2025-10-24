import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDatabaseConnection, getDatabaseInfo } from './utils/database';
import { testGeminiConnection, generateResponse } from './services/gemini.service';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app: Application = express();

// Security: Disable X-Powered-By header to prevent information disclosure
app.disable('x-powered-by');

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

// Gemini AI test endpoint
app.get('/api/ai/test', async (_req: Request, res: Response) => {
  try {
    const isConnected = await testGeminiConnection();
    
    res.status(200).json({
      status: isConnected ? 'connected' : 'disconnected',
      message: isConnected 
        ? 'Gemini AI connection successful! 🤖' 
        : 'Gemini AI connection failed! ❌',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to test Gemini AI connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Gemini AI prompt test endpoint
app.post('/api/ai/prompt', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        status: 'error',
        message: 'Prompt is required and must be a string',
      });
      return;
    }
    
    const response = await generateResponse(prompt);
    
    res.status(200).json({
      status: 'success',
      prompt,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate AI response',
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
const server = app.listen(PORT, () => {
  console.info(`🚀 Detective AI Backend server is running on port ${PORT}`);
  console.info(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection (async, non-blocking)
  const dbInfo = getDatabaseInfo();
  console.info(`🗄️  Database: ${dbInfo.url}`);
  testDatabaseConnection().catch(console.error);
  
  // Test Gemini AI connection (async, non-blocking)
  console.info('🤖 Testing Gemini AI connection...');
  testGeminiConnection().then((aiConnected) => {
    if (aiConnected) {
      console.info('✅ Gemini AI connection successful!');
    } else {
      console.error('❌ Gemini AI connection failed!');
    }
  }).catch(console.error);
});

// Export app for testing purposes
export default app;
export { server };
