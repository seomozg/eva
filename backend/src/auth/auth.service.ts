import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, SubscriptionType } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { APP_CONFIG } from '../config/app.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const { email, password, firstName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      balance: APP_CONFIG.PRICING.INITIAL_BALANCE,
    });

    await this.userRepository.save(user);

    // Generate JWT
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = loginDto;
    console.log('Login attempt for:', email);

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('User found:', user.id, 'password hash:', user.password ? 'exists' : 'empty');

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    console.log('Login successful for:', user.id);

    return { access_token };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async googleLogin(googleUser: any): Promise<{ access_token: string; user: User }> {
    // Find or create user based on Google profile
    let user = await this.userRepository.findOne({ where: { email: googleUser.email } });

    if (!user) {
      // Create new user from Google profile
      user = this.userRepository.create({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        password: '', // No password for OAuth users
        balance: APP_CONFIG.PRICING.INITIAL_BALANCE, // Give new users initial balance
        subscriptionType: SubscriptionType.FREE,
      });
      await this.userRepository.save(user);
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}