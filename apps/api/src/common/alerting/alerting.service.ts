import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly webhookUrl: string | undefined;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
  }

  async sendAlert(title: string, message: string, severity: 'INFO' | 'WARNING' | 'ERROR' = 'ERROR') {
    if (!this.webhookUrl) {
      this.logger.warn(`Alert triggered but no webhook URL configured: [${severity}] ${title}`);
      return;
    }

    const colorMap = {
      INFO: 3447003, // Blue
      WARNING: 16776960, // Yellow
      ERROR: 15158332, // Red
    };

    const payload = {
      embeds: [
        {
          title: `[${severity}] ${title}`,
          description: message,
          color: colorMap[severity],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      this.logger.log(`Sent alert to Discord: ${title}`);
    } catch (error: any) {
      this.logger.error(`Failed to send Discord alert: ${error.message}`);
    }
  }
}
