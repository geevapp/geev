import {
  Controller,
  Post as HttpPost,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PostInteractionService } from './post-interaction.service';
import { InteractionType } from './entities/post-interaction.entity';

@Controller('api/posts')

export class PostInteractionController {
  constructor(private readonly service: PostInteractionService) {}

  private getUserId(req: any): string {
    return req.user['id']; // wallet / uuid / sub
  }

  @HttpPost(':id/like')
  like(@Param('id') id: string, @Req() req: any) {
    return this.service.addInteraction(
      id,
      this.getUserId(req),
      InteractionType.LIKE,
    );
  }

  @Delete(':id/like')
  unlike(@Param('id') id: string, @Req() req: any) {
    return this.service.removeInteraction(
      id,
      this.getUserId(req),
      InteractionType.LIKE,
    );
  }

  @HttpPost(':id/burn')
  burn(@Param('id') id: string, @Req() req: any) {
    return this.service.addInteraction(
      id,
      this.getUserId(req),
      InteractionType.BURN,
    );
  }

  @Delete(':id/burn')
  unburn(@Param('id') id: string, @Req() req: any) {
    return this.service.removeInteraction(
      id,
      this.getUserId(req),
      InteractionType.BURN,
    );
  }

  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.service.getStats(id);
  }
}
