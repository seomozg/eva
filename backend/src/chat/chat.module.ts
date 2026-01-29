import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { Girl } from '../entities/girl.entity';
import { Conversation } from '../entities/conversation.entity';
import { Transaction } from '../entities/transaction.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([User, Girl, Conversation, Transaction])
  ],
  controllers: [ChatController],
  providers: [ChatService, UsersService],
  exports: [ChatService]
})
export class ChatModule {}
