import { ServiceUnavailableException } from '@nestjs/common';

export class AIUnavailableException extends ServiceUnavailableException {
  constructor(message = 'AI inference service is currently unavailable. Please try again later.') {
    super(message);
  }
}
