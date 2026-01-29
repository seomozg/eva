import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Girl } from './girl.entity';
import { Conversation } from './conversation.entity';
import { Transaction } from './transaction.entity';

export enum SubscriptionType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
    default: SubscriptionType.FREE,
  })
  subscriptionType: SubscriptionType;

  @Column({ nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Girl, girl => girl.user)
  girls: Girl[];

  @OneToMany(() => Conversation, conversation => conversation.user)
  conversations: Conversation[];

  @OneToMany(() => Transaction, transaction => transaction.user)
  transactions: Transaction[];
}