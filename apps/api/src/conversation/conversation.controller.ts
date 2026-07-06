import { Controller, Post, Body, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { ConversationService } from './conversation.service';
import { StartConversationDto, SendMessageDto, StartConversationSchema, SendMessageSchema } from './types/conversation.types';
import { ZodValidationPipe } from '../industry-config/zod.pipe';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('start')
  async startConversation(
    @Body(new ZodValidationPipe(StartConversationSchema)) dto: StartConversationDto
  ) {
    return this.conversationService.startConversation(dto.configId);
  }

  @Post(':id/message')
  async sendMessage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) dto: SendMessageDto,
    @Res() res: Response
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream = this.conversationService.sendMessage(dto.sessionToken, dto.message);
      
      for await (const chunk of stream) {
        if (chunk.includes('{"_done":true')) {
          const state = JSON.parse(chunk);
          res.write(`event: done\ndata: ${JSON.stringify({ status: state.status, turnCount: state.turnCount })}\n\n`);
        } else {
          res.write(`event: token\ndata: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      }
    } catch (error: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
