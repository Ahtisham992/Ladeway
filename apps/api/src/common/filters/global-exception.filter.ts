import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { AlertingService } from '../alerting/alerting.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly alertingService: AlertingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Capture to Sentry
    Sentry.captureException(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Trigger a Discord alert for unhandled errors
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.alertingService.sendAlert(
        'Critical API Error',
        `Unhandled exception at ${request.method} ${request.url}\n\nError: ${exception instanceof Error ? exception.message : 'Unknown'}\nRequest ID: ${request.headers['x-request-id'] || 'N/A'}`,
        'ERROR'
      );
    }

    // Instead of leaking stack traces in production, return sanitized error
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
