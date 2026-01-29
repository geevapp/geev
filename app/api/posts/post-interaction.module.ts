import { Module } from '@nestjs/common';
import { PostInteractionService } from './post-interaction.service';
import { PostInteractionController } from './post-interaction.controller';

@Module({
  controllers: [PostInteractionController],
  providers: [PostInteractionService],
})
export class PostInteractionModule {}
