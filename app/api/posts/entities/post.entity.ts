// src/posts/entities/post.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column({ type: 'text' })
    content!: string;

  @Column({ default: 0 })
    likeCount!: number;

  @Column({ default: 0 })
    burnCount!: number;

  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;
}
