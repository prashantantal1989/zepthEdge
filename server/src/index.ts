import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler';
import loggingMiddleware from './middleware/logging';
import { initDb } from './db/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import workflowRoutes from './routes/workflowRoutes'; // Import workflow routes

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database
initDb().then(() => {
  console.log('Database initialization complete (or table already exists).');
}).catch(error => {
  console.error('Database initialization failed:', error);
  // Optionally exit or handle more gracefully if DB is critical for startup
  // process.exit(1);
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(loggingMiddleware); // Log incoming requests

// Routes
app.use('/auth', authRoutes); // Mount authentication routes
app.use('/api', userRoutes); // Mount user-related API routes
app.use('/api', workflowRoutes); // Mount workflow-related API routes

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware - should be the LAST middleware added
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Ensure DATABASE_URL and JWT_SECRET environment variables are set for production.');
});

export default app;
