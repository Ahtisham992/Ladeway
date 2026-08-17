import { Controller, Post, Get, Param, UseInterceptors, UploadedFile, Res, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Controller('voice/recordings')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'recordings');

  constructor(private readonly prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  @Post(':conversationId')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadRecording(
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    this.logger.log(`Received recording upload for conversation: ${conversationId}`);
    
    if (!file) {
      throw new InternalServerErrorException('No audio file provided');
    }

    const filePath = path.join(this.uploadDir, `${conversationId}.webm`);
    
    try {
      fs.writeFileSync(filePath, file.buffer);
      const recordingUrl = `/api/voice/recordings/${conversationId}`;

      // Update DB
      await this.prisma.$system.conversation.update({
        where: { id: conversationId },
        data: { recordingUrl },
      });

      this.logger.log(`Successfully saved recording to ${filePath}`);
      return { success: true, recordingUrl };
    } catch (error) {
      this.logger.error(`Failed to save recording for ${conversationId}:`, error);
      throw new InternalServerErrorException('Failed to save recording');
    }
  }

  @Get(':conversationId')
  async getRecording(
    @Param('conversationId') conversationId: string,
    @Res() res: Response
  ) {
    const filePath = path.join(this.uploadDir, `${conversationId}.webm`);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Recording not found');
    }

    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Disposition', `inline; filename="recording-${conversationId}.webm"`);
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
