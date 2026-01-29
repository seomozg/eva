import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Girl } from '../entities/girl.entity';
import { Conversation, MessageRole } from '../entities/conversation.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { ChatService } from '../chat/chat.service';
import { CreateGirlDto } from './dto/create-girl.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Girl)
    private girlRepository: Repository<Girl>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private chatService: ChatService,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update fields
    if (updateProfileDto.firstName !== undefined) {
      user.firstName = updateProfileDto.firstName;
    }

    return this.userRepository.save(user);
  }

  async getBalance(userId: string): Promise<{ balance: number; transactions: Transaction[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transactions = await this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return { balance: user.balance, transactions };
  }

  async createGirl(userId: string, createGirlDto: CreateGirlDto): Promise<Girl> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate avatar if not provided
    let avatarUrl = createGirlDto.avatarUrl;
    if (!avatarUrl) {
      avatarUrl = await this.chatService.generateImage(
        `${createGirlDto.appearance}, beautiful girl, portrait, high quality`,
        undefined,
        userId
      );
    }

    const girl = this.girlRepository.create({
      userId,
      name: createGirlDto.name,
      appearance: createGirlDto.appearance,
      personality: createGirlDto.personality,
      avatarUrl,
    });

    return this.girlRepository.save(girl);
  }

  async getGirls(userId: string): Promise<Girl[]> {
    return this.girlRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateGirl(userId: string, girlId: string, updateData: { appearance?: string; personality?: string; avatarUrl?: string }): Promise<Girl> {
    const girl = await this.girlRepository.findOne({
      where: { id: girlId, userId },
    });

    if (!girl) {
      throw new NotFoundException('Girl not found');
    }

    if (girl.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Update fields
    if (updateData.appearance !== undefined) {
      girl.appearance = updateData.appearance;
    }
    if (updateData.personality !== undefined) {
      girl.personality = updateData.personality;
    }
    if (updateData.avatarUrl !== undefined) {
      girl.avatarUrl = updateData.avatarUrl;
    }

    return this.girlRepository.save(girl);
  }

  async deleteGirl(userId: string, girlId: string): Promise<void> {
    const girl = await this.girlRepository.findOne({
      where: { id: girlId, userId },
    });

    if (!girl) {
      throw new NotFoundException('Girl not found');
    }

    if (girl.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    girl.isActive = false;
    await this.girlRepository.save(girl);
  }

  async getConversations(userId: string, girlId: string): Promise<Conversation[]> {
    // Verify girl belongs to user
    const girl = await this.girlRepository.findOne({
      where: { id: girlId, userId },
    });

    if (!girl) {
      throw new NotFoundException('Girl not found');
    }

    return this.conversationRepository.find({
      where: { userId, girlId },
      order: { createdAt: 'ASC' },
    });
  }

  async saveMessage(userId: string, girlId: string, role: 'user' | 'assistant', content: string, mediaUrl?: string, mediaType?: string, originalMediaUrl?: string): Promise<Conversation> {
    // Verify girl belongs to user
    const girl = await this.girlRepository.findOne({
      where: { id: girlId, userId },
    });

    if (!girl) {
      throw new NotFoundException('Girl not found');
    }

    const conversation = this.conversationRepository.create({
      userId,
      girlId,
      role: role === 'user' ? MessageRole.USER : MessageRole.ASSISTANT,
      content,
      mediaUrl,
      originalMediaUrl,
      mediaType,
    });

    return this.conversationRepository.save(conversation);
  }

  async getMessages(userId: string, girlId: string): Promise<Conversation[]> {
    // Verify girl belongs to user
    const girl = await this.girlRepository.findOne({
      where: { id: girlId, userId },
    });

    if (!girl) {
      throw new NotFoundException('Girl not found');
    }

    return this.conversationRepository.find({
      where: { userId, girlId },
      order: { createdAt: 'ASC' },
    });
  }

  async deductBalance(userId: string, amount: number, type: TransactionType, description?: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.balance < amount) {
      return false; // Insufficient balance
    }

    // Deduct balance
    user.balance -= amount;
    await this.userRepository.save(user);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      type,
      amount: -amount, // Negative for deduction
      description: description || `${type} generation`,
    });
    await this.transactionRepository.save(transaction);

    return true;
  }

  async addBalance(userId: string, amount: number, description?: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.balance += amount;
    await this.userRepository.save(user);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      description: description || 'Balance top-up',
    });
    await this.transactionRepository.save(transaction);
  }
}