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
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS — allow frontend origin
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
