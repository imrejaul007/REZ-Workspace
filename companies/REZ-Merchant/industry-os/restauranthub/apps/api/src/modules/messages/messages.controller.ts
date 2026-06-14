import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { IsString, IsOptional, MinLength } from 'class-validator';

class CreateConversationDto {
  @IsString()
  recipientId!: string;

  @IsOptional()
  @IsString()
  subject?: string;
}

class SendMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  async listConversations(@Request() req) {
    return this.messagesService.listConversations(req.user.id);
  }

  @Get('conversations/:id')
  async getConversation(@Request() req, @Param('id') id: string) {
    return this.messagesService.getConversation(req.user.id, id);
  }

  @Post('conversations')
  async createConversation(
    @Request() req,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagesService.createConversation(
      req.user.id,
      dto.recipientId,
      dto.subject,
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(req.user.id, id, dto.content);
  }

  @Patch('conversations/:id/read')
  async markRead(@Request() req, @Param('id') id: string) {
    return this.messagesService.markConversationRead(req.user.id, id);
  }
}
