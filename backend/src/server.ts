import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// 404 handler - Endpoint not found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint not found: ${req.method} ${req.path}`,
  });
});

// Start server and listen on specified port
app.listen(PORT, () => {
  console.info(`🚀 Detective AI Backend server is running on port ${PORT}`);
  console.info(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export app for testing purposes
export default app;
