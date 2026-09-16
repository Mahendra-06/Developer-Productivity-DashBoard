import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allows Swagger UI to load inline styles/scripts
  }));

  // CORS Configuration
  const corsOrigin = env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map(s => s.trim());
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Load OpenAPI Document
  try {
    const openapiPath = path.resolve(__dirname, '../docs/openapi.json');
    if (fs.existsSync(openapiPath)) {
      const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));

      // Serve OpenAPI JSON schema dynamically
      app.get('/api/docs/json', (_req: Request, res: Response) => {
        const freshDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
        res.json(freshDoc);
      });

      // Serve interactive Swagger UI dynamically referencing /api/docs/json
      app.use('/api/docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
        const freshDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
        swaggerUi.setup(freshDoc, {
          customCss: '.swagger-ui .topbar { display: none }',
          customSiteTitle: 'DMetrics API Documentation',
        })(req, res, next);
      });
    }
  } catch (err) {
    console.warn('Failed to load Swagger UI specs:', err);
  }

  // Quiet favicon requests from browsers
  app.get('/favicon.ico', (_req: Request, res: Response) => {
    res.status(204).end();
  });

  // Root Welcome & Documentation pointer
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'DMetrics REST API',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/docs',
      health: `${env.API_PREFIX}/health`,
      endpoints: {
        users: `${env.API_PREFIX}/users`,
        projects: `${env.API_PREFIX}/projects`,
        tasks: `${env.API_PREFIX}/tasks`,
      },
    });
  });

  // Mount API Router
  app.use(env.API_PREFIX, apiRouter);

  // 404 Fallthrough Handler
  app.use(notFoundHandler);

  // Centralized Error Handler Middleware
  app.use(errorHandler);

  return app;
};
