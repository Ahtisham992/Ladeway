import { Controller, Post, Body, Res, Param, Get, Query, NotFoundException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ConversationService } from './conversation.service';
import { SessionService } from '../session/session.service';
import { PrismaService } from '../database/prisma.service';
import { StartConversationDto, SendMessageDto, StartConversationSchema, SendMessageSchema } from './types/conversation.types';
import { ZodValidationPipe } from '../industry-config/zod.pipe';

@Controller('conversations')
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly sessionService: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('start')
  async startConversation(
    @Body(new ZodValidationPipe(StartConversationSchema)) dto: StartConversationDto
  ) {
    try {
      return await this.conversationService.startConversation(dto.configId);
    } catch (error: any) {
      this.logger.error('START_CONVERSATION_ERROR:', error);
      throw error;
    }
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

  @Get('state')
  async getState(@Query('sessionToken') sessionToken: string) {
    const session = await this.sessionService.getSession(sessionToken)
    if (!session) throw new NotFoundException('Session expired')
    
    const messages = await this.prisma.$system.message.findMany({
      where: { conversationId: session.conversationId },
      orderBy: { timestamp: 'asc' }
    })
    
    return {
      conversationId: session.conversationId,
      status: session.status,
      capturedFields: session.capturedFields,
      missingFields: session.missingFields,
      messages: messages.map(m => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp
      }))
    }
  }
}
