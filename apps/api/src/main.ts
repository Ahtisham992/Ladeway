/**
 * Ladeway API — Application Bootstrap
 *
 * Configures:
 * - CORS for the frontend origin
 * - Global validation pipe
 * - Port from environment variable (default 3001)
 *
 * Deployed on Railway as a persistent Node.js process (not serverless)
 * to support SSE streaming for AI responses.
 */
import { otelSDK } from './tracing';
otelSDK.start();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger as PinoLogger } from 'nestjs-pino';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));
  app.useWebSocketAdapter(new WsAdapter(app));
  const logger = new Logger('Bootstrap');

  // CORS — allow frontend origin
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.vercel.app') || origin === process.env.CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Session-Token',
    ],
    credentials: true,
  });

  // Global validation pipe — rejects unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 Ladeway API running on port ${port}`);
  logger.log(`📍 Health check: http://localhost:${port}/health`);
}

bootstrap();
