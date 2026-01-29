import { Controller, Get, Post, Body, UseGuards, Request, Param, Delete, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGirlDto } from './dto/create-girl.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  getBalance(@Request() req) {
    return this.usersService.getBalance(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('girls')
  createGirl(@Request() req, @Body() createGirlDto: CreateGirlDto) {
    return this.usersService.createGirl(req.user.id, createGirlDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('girls')
  getGirls(@Request() req) {
    return this.usersService.getGirls(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('girls/:id')
  updateGirl(@Request() req, @Param('id') girlId: string, @Body() updateData: { appearance?: string; personality?: string; avatarUrl?: string }) {
    return this.usersService.updateGirl(req.user.id, girlId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('girls/:id')
  deleteGirl(@Request() req, @Param('id') girlId: string) {
    return this.usersService.deleteGirl(req.user.id, girlId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:girlId')
  getConversations(@Request() req, @Param('girlId') girlId: string) {
    return this.usersService.getConversations(req.user.id, girlId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages/:girlId')
  saveMessage(@Request() req, @Param('girlId') girlId: string, @Body() messageData: { role: 'user' | 'assistant'; content: string; mediaUrl?: string; mediaType?: string; originalMediaUrl?: string }) {
    return this.usersService.saveMessage(req.user.id, girlId, messageData.role, messageData.content, messageData.mediaUrl, messageData.mediaType, messageData.originalMediaUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:girlId')
  getMessages(@Request() req, @Param('girlId') girlId: string) {
    return this.usersService.getMessages(req.user.id, girlId);
  }
}