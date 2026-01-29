import { Controller, Post, Body, Sse, MessageEvent, Query, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionType } from '../entities/transaction.entity';
import { Observable } from 'rxjs';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  @Post('send')
  async sendMessage(@Body('messages') messages: { role: 'user' | 'assistant' | 'system', content: string }[]): Promise<{ response: string }> {
    const response = await this.chatService.sendMessage(messages);
    return { response };
  }

  @Sse('send-stream')
  sendMessageStream(@Query('messages') messages: string): Observable<MessageEvent> {
    console.log(`SSE endpoint called with messages: ${messages}`);
    const parsedMessages = JSON.parse(messages);
    return this.chatService.sendMessageStream(parsedMessages);
  }

  @Post('detect-intent')
  async detectIntent(@Body('message') message: string): Promise<{ intent: 'text' | 'image' | 'video' }> {
    const intent = await this.chatService.detectIntent(message);
    return { intent };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-image')
  async generateImage(@Request() req, @Body() body: { prompt: string; baseImageUrl?: string }) {
    const imageUrl = await this.chatService.generateImage(body.prompt, body.baseImageUrl, req.user.id);
    return { imageUrl, originalImageUrl: imageUrl.startsWith('/uploads/') ? undefined : imageUrl };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-video')
  async generateVideo(@Request() req, @Body() body: { prompt: string; baseImageUrl?: string }) {
    const videoUrl = await this.chatService.generateVideo(body.prompt, body.baseImageUrl, req.user.id);
    return { videoUrl, originalVideoUrl: videoUrl.startsWith('/uploads/') ? undefined : videoUrl };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-video-from-image')
  async generateVideoFromImage(@Request() req, @Body() body: { imageUrl: string; text: string }) {
    const videoUrl = await this.chatService.generateVideoFromImage(body.imageUrl, body.text, req.user.id);
    return { videoUrl, originalVideoUrl: videoUrl.startsWith('/uploads/') ? undefined : videoUrl };
  }

  @Post('create-girl')
  @UseGuards(JwtAuthGuard)
  async createGirl(@Request() req) {
    const userId = req.user.id;
    return await this.chatService.createGirl(userId);
  }
}
