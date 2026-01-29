import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Girl } from './girl.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  girlId: string;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  originalMediaUrl: string; // Original URL from external API

  @Column({ nullable: true })
  thumbnailUrl: string; // Thumbnail URL for videos

  @Column({ nullable: true })
  mediaType: string; // 'image' | 'video'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Girl, girl => girl.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'girlId' })
  girl: Girl;
}