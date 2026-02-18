import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config/config.js';
import logger from './config/logger.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import validateAuth from './middleware/validateAuth.js';

const app: Application = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    // Disable COOP so the header isn't sent on HTTP (non-localhost). Browsers ignore it on
    // "untrustworthy" origins and show a console warning. Use HTTPS or localhost for COOP.
    crossOriginOpenerPolicy: false,
  })
);

app.use(
  cors({
    origin: config.discord.frontendUrl || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-imvu-userid', 'X-imvu-auth'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  morgan('combined', {
    stream: { write: (msg: string) => logger.http(msg.trim()) },
  })
);

app.use('/api/', validateAuth);
app.use('/api', routes);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Xanoty API',
    documentation: '/api',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', path: _req.path, method: _req.method },
  });
});

app.use(errorHandler);

export default app;
