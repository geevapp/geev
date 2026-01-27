// src/posts/post-interaction.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from './entities/post.entity';
import {
  PostInteraction,
  InteractionType,
} from './entities/post-interaction.entity';

@Injectable()
export class PostInteractionService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostInteraction)
    private readonly interactionRepo: Repository<PostInteraction>,
    private readonly dataSource: DataSource,
  ) {}

  async addInteraction(
    postId: string,
    userId: string,
    type: InteractionType,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(Post, { where: { id: postId } });
      if (!post) throw new BadRequestException('Post not found');

      const existing = await manager.findOne(PostInteraction, {
        where: { post: { id: postId }, userId },
      });

      if (existing?.type === type) {
        throw new BadRequestException(`Post already ${type}d`);
      }

      if (existing) {
        existing.type = type;
        await manager.save(existing);

        if (type === InteractionType.LIKE) {
          post.likeCount++;
          post.burnCount--;
        } else {
          post.burnCount++;
          post.likeCount--;
        }
      } else {
        const interaction = manager.create(PostInteraction, {
          post,
          userId,
          type,
        });

        await manager.save(interaction);

        type === InteractionType.LIKE
          ? post.likeCount++
          : post.burnCount++;
      }

      await manager.save(post);
      return { success: true };
    });
  }

  async removeInteraction(
    postId: string,
    userId: string,
    type: InteractionType,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const interaction = await manager.findOne(PostInteraction, {
        where: { post: { id: postId }, userId, type },
      });

      if (!interaction) {
        throw new BadRequestException(`No ${type} interaction found`);
      }

      await manager.remove(interaction);

      const post = await manager.findOne(Post, { where: { id: postId } });
      if (!post) throw new BadRequestException('Post not found');

      type === InteractionType.LIKE
        ? post.likeCount--
        : post.burnCount--;

      await manager.save(post);
      return { success: true };
    });
  }

  async getStats(postId: string) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      select: ['id', 'likeCount', 'burnCount'],
    });

    if (!post) throw new BadRequestException('Post not found');

    return {
      postId,
      likes: post.likeCount,
      burns: post.burnCount,
    };
  }
}
