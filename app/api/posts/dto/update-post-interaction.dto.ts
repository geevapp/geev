import { PartialType } from '@nestjs/mapped-types';
import { CreatePostInteractionDto } from './create-post-interaction.dto';

export class UpdatePostInteractionDto extends PartialType(CreatePostInteractionDto) {}
