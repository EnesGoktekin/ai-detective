import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDatabaseConnection, getDatabaseInfo } from './utils/database';
import { testGeminiConnection, generateResponse } from './services/gemini.service';
import casesRouter from './routes/cases.routes';
import gameRouter from './routes/game.routes';
import chatRouter from './routes/chat.routes';
import evidenceRouter from './routes/evidence.routes';
import accusationRouter from './routes/accusation.routes';
import messagesRouter from './routes/messages.routes';
import { sanitizeBody } from './middleware/validation.middleware';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

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

// Middleware: Sanitize request bodies (prevent XSS)
app.use(sanitizeBody);

// API Routes
app.use('/api/cases', casesRouter);
app.use('/api/games', gameRouter);
app.use('/api/games', chatRouter);  // FIXED: Chat is nested under /games/:game_id/chat
app.use('/api/evidence', evidenceRouter);
app.use('/api/accusation', accusationRouter);
app.use('/api/messages', messagesRouter);

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

// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Global Error Handler - Must be last
app.use(errorHandler);

// Start server and listen on specified port
const server = app.listen(PORT, () => {
  console.info(`🚀 Detective AI Backend server is running on port ${PORT}`);
  console.info(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log database info
  const dbInfo = getDatabaseInfo();
  console.info(`🗄️  Database: ${dbInfo.url}`);
});

// Test connections after server starts (non-blocking, no await)
setImmediate(() => {
  testDatabaseConnection()
    .then(connected => {
      if (connected) console.info('✅ Database connection verified!');
    })
    .catch(err => console.error('❌ Database test error:', err.message));
  
  testGeminiConnection()
    .then(connected => {
      if (connected) console.info('✅ Gemini AI connection successful!');
    })
    .catch(err => console.error('❌ AI test error:', err.message));
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.info('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.info('\nSIGINT received, closing server gracefully...');
  server.close(() => {
    console.info('Server closed');
    process.exit(0);
  });
});

// Export app for testing purposes
export default app;
export { server };
