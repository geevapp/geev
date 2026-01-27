
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';

export enum InteractionType {
  LIKE = 'like',
  BURN = 'burn',
}

@Entity('post_interactions')
@Unique(['userId', 'post'])
export class PostInteraction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string; 

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  post!: Post;

  @Column({ type: 'enum', enum: InteractionType })
  type!: InteractionType;

  @CreateDateColumn()
  createdAt!: Date;
}
